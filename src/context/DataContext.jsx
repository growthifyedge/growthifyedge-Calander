import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { addDays, addWeeks, addMonths } from 'date-fns'
import { db, getDataSource } from '../lib/db'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { buildSeed, defaultSettings } from '../lib/seed'
import { uid, nowISO, toDate, reminderFireTime } from '../lib/utils'

const DataContext = createContext(null)
export const useData = () => useContext(DataContext)

const EMPTY = { clients: [], projects: [], tasks: [], files: [], meetings: [], approvals: [], activity: [] }

const LABEL_KEY = { clients: 'company', projects: 'name', tasks: 'title', meetings: 'title', approvals: 'title', files: 'name' }
const ACTIVITY_TYPE = { clients: 'client', projects: 'project', tasks: 'task', meetings: 'meeting', approvals: 'approval', files: 'file' }

// Step 5B: keep tasks.reminder_time (absolute) in sync with the app's reminder
// fields (reminder + reminderCustomAt + dueDate via reminderFireTime). Whenever
// the fire time changes vs the previous record, reset the delivery flags so the
// cron will pick it up again. snake_case mapping to Supabase columns happens in
// supabaseAdapter (reminderTime → reminder_time, etc.).
const withTaskReminder = (next, prev = null) => {
  const reminderTime = reminderFireTime(next)?.toISOString() ?? null
  const changed = reminderTime !== (prev?.reminderTime ?? null)
  return {
    ...next,
    reminderTime,
    ...(changed ? { reminderSent: false, reminderSentAt: null } : {}),
  }
}

export function DataProvider({ children }) {
  const { userId, status: authStatus } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState(EMPTY)
  const [settings, setSettings] = useState(defaultSettings())
  const [loading, setLoading] = useState(true)
  const isLocal = getDataSource() === 'local'

  // ── Initial load (per signed-in user); seed only in local mode ─────────────
  useEffect(() => {
    if (authStatus === 'loading') return
    if (authStatus === 'anon') {
      setData(EMPTY)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    ;(async () => {
      try {
        await db.ready()
        const loaded = {}
        for (const c of Object.keys(EMPTY)) loaded[c] = await db.getAll(c)
        let s = await db.getSettings()

        const isEmpty = Object.values(loaded).every((arr) => !arr || arr.length === 0)
        if (isEmpty && isLocal) {
          const seed = buildSeed()
          for (const c of Object.keys(seed)) {
            await db.setAll(c, seed[c])
            loaded[c] = seed[c]
          }
          loaded.files = []
          s = defaultSettings()
          await db.saveSettings(s)
        }
        if (!alive) return
        setData({ ...EMPTY, ...loaded })
        if (s) setSettings((prev) => ({ ...prev, ...s, profile: { ...prev.profile, ...(s.profile || {}) } }))
      } catch (e) {
        console.error('Data load failed', e)
        toast?.('Could not load your data', 'error')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [authStatus, userId, isLocal]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cross-session refresh (no realtime channel) ─────────────────────────────
  // Data is loaded once at login. A change made in ANOTHER session/device/tab
  // — e.g. an agent marking a task Done at /#/agent — is saved to the backend
  // but won't appear in this already-open tab until the data is re-pulled.
  // Re-pull SILENTLY (never toggles `loading`, so no loader flash) when this tab
  // regains focus/visibility, plus a light interval while visible. Persisted
  // writes are the source of truth, so re-pulling can't lose anything saved.
  const refresh = useCallback(async () => {
    if (authStatus !== 'authed') return
    try {
      await db.ready()
      const loaded = {}
      for (const c of Object.keys(EMPTY)) loaded[c] = await db.getAll(c)
      const s = await db.getSettings()
      setData(() => ({ ...EMPTY, ...loaded }))
      if (s) setSettings((prev) => ({ ...prev, ...s, profile: { ...prev.profile, ...(s.profile || {}) } }))
    } catch (e) {
      console.error('[DataContext] background refresh failed', e)
    }
  }, [authStatus])

  useEffect(() => {
    if (authStatus !== 'authed') return
    let last = Date.now()
    const maybeRefresh = (force = false) => {
      if (document.visibilityState === 'hidden') return
      const now = Date.now()
      if (!force && now - last < 4000) return // throttle focus bursts
      last = now
      refresh()
    }
    const onFocus = () => maybeRefresh()
    const onVisible = () => maybeRefresh()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    const interval = setInterval(() => maybeRefresh(true), 60000) // backstop while visible
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(interval)
    }
  }, [authStatus, refresh])

  // ── Activity log ────────────────────────────────────────────────────────────
  const logActivity = useCallback(
    (type, action, entity) => {
      const item = { id: uid('av'), user_id: userId, type, action, entity, at: nowISO() }
      db.put('activity', item).catch(() => {})
      setData((d) => ({ ...d, activity: [item, ...d.activity].slice(0, 60) }))
    },
    [userId],
  )

  // ── Generic per-record CRUD ─────────────────────────────────────────────────
  const create = useCallback(
    async (collection, payload) => {
      let record = { id: uid(collection.slice(0, 2)), user_id: userId, createdAt: nowISO(), ...payload }
      if (collection === 'tasks') {
        record.reminderTime = reminderFireTime(record)?.toISOString() ?? null
        record.reminderSent = false
        record.reminderSentAt = null
      }
      // Persist FIRST — only reflect the new record in the UI once the backend
      // save actually succeeds, so we never show a record that wasn't saved.
      try {
        await db.put(collection, record)
      } catch (e) {
        console.error(`[DataContext] failed to save ${collection}:`, e)
        toast?.('Could not save — it was not created. Please retry.', 'error')
        return null
      }
      setData((d) => ({ ...d, [collection]: [record, ...d[collection]] }))
      logActivity(ACTIVITY_TYPE[collection], 'created', record[LABEL_KEY[collection]] || 'item')
      return record
    },
    [userId, logActivity, toast],
  )

  const update = useCallback(
    async (collection, id, patch, opts = {}) => {
      let updated = null
      setData((d) => {
        const next = d[collection].map((r) => {
          if (r.id !== id) return r
          updated = { ...r, ...patch, updatedAt: nowISO() }
          if (collection === 'tasks') updated = withTaskReminder(updated, r)
          return updated
        })
        return { ...d, [collection]: next }
      })
      if (updated) {
        try {
          await db.put(collection, updated)
        } catch (e) {
          console.error(`[DataContext] failed to update ${collection}:`, e)
          // Strict callers (e.g. Agent Dashboard) want the REAL error to surface
          // so they can display the exact failure reason instead of a generic toast.
          if (opts.strict) throw e
          toast?.('Could not save changes — please retry', 'error')
        }
      }
      if (opts.activity) logActivity(ACTIVITY_TYPE[collection], opts.activity, updated?.[LABEL_KEY[collection]] || 'item')
      return updated
    },
    [logActivity, toast],
  )

  const remove = useCallback(
    async (collection, id) => {
      let label = 'item'
      setData((d) => {
        label = d[collection].find((r) => r.id === id)?.[LABEL_KEY[collection]] || 'item'
        return { ...d, [collection]: d[collection].filter((r) => r.id !== id) }
      })
      await db.remove(collection, id).catch((e) => console.error(e))
      logActivity(ACTIVITY_TYPE[collection], 'deleted', label)
    },
    [logActivity],
  )

  // ── Bulk operations (used by Tasks bulk management) ─────────────────────────
  const bulkUpdate = useCallback(
    async (collection, ids, patchOrFn) => {
      const idSet = new Set(ids)
      const changed = data[collection]
        .filter((r) => idSet.has(r.id))
        .map((r) => {
          const next = { ...r, ...(typeof patchOrFn === 'function' ? patchOrFn(r) : patchOrFn), updatedAt: nowISO() }
          return collection === 'tasks' ? withTaskReminder(next, r) : next
        })
      const byId = Object.fromEntries(changed.map((r) => [r.id, r]))
      setData((d) => ({ ...d, [collection]: d[collection].map((r) => byId[r.id] || r) }))
      for (const r of changed) await db.put(collection, r).catch((e) => console.error(e))
      return changed
    },
    [data],
  )

  const bulkRemove = useCallback(async (collection, ids) => {
    const idSet = new Set(ids)
    setData((d) => ({ ...d, [collection]: d[collection].filter((r) => !idSet.has(r.id)) }))
    for (const id of ids) await db.remove(collection, id).catch((e) => console.error(e))
  }, [])

  // Null out references in related rows (non-destructive cascade)
  const nullRefs = useCallback(async (collection, field, value) => {
    const changed = []
    setData((d) => {
      const next = d[collection].map((r) => {
        if (r[field] === value) {
          const u = { ...r, [field]: null, updatedAt: nowISO() }
          changed.push(u)
          return u
        }
        return r
      })
      return { ...d, [collection]: next }
    })
    for (const r of changed) await db.put(collection, r).catch(() => {})
  }, [])

  const removeClient = useCallback(
    async (id) => {
      for (const col of ['projects', 'tasks', 'meetings', 'approvals', 'files']) await nullRefs(col, 'clientId', id)
      await remove('clients', id)
    },
    [nullRefs, remove],
  )

  const removeProject = useCallback(
    async (id) => {
      for (const col of ['tasks', 'files', 'approvals']) await nullRefs(col, 'projectId', id)
      await remove('projects', id)
    },
    [nullRefs, remove],
  )

  // ── Task status with dependency blocking + recurrence spawning ──────────────
  const spawnNextOccurrence = useCallback(
    async (task) => {
      const base = toDate(task.dueDate) || new Date()
      let next
      if (task.recurrence === 'daily') next = addDays(base, 1)
      else if (task.recurrence === 'weekly') next = addWeeks(base, 1)
      else if (task.recurrence === 'monthly') next = addMonths(base, 1)
      else if (task.recurrence === 'custom') next = addDays(base, Number(task.recurrenceInterval) || 1)
      else return
      if (task.recurrenceUntil && next > toDate(task.recurrenceUntil)) return
      await create('tasks', {
        title: task.title,
        description: task.description,
        clientId: task.clientId || null,
        projectId: task.projectId || null,
        category: task.category,
        priority: task.priority,
        status: 'pending',
        dueDate: next.toISOString(),
        notes: task.notes,
        tags: task.tags || [],
        dependencies: [],
        recurrence: task.recurrence,
        recurrenceInterval: task.recurrenceInterval || null,
        recurrenceUntil: task.recurrenceUntil || null,
        // Carry the reminder preset forward; a fixed custom time can't apply to a new date.
        reminder: task.reminder === 'custom' ? 'none' : task.reminder || 'none',
        reminderCustomAt: null,
        completedAt: null,
      })
      toast?.('Next occurrence scheduled', 'info')
    },
    [create, toast],
  )

  const isBlocked = useCallback(
    (task, tasksList) => (task.dependencies || []).some((depId) => tasksList.find((t) => t.id === depId)?.status !== 'done'),
    [],
  )

  const setTaskStatus = useCallback(
    async (id, status, opts = {}) => {
      const task = data.tasks.find((t) => t.id === id)
      if (!task) {
        if (opts.strict) throw new Error('Task not found in current data')
        return
      }
      if (status === 'done') {
        const blockers = (task.dependencies || []).filter((depId) => {
          const dep = data.tasks.find((t) => t.id === depId)
          return dep && dep.status !== 'done'
        })
        if (blockers.length) {
          const msg = `Blocked — finish ${blockers.length} dependency task${blockers.length > 1 ? 's' : ''} first`
          if (opts.strict) throw new Error(msg)
          toast?.(msg, 'error')
          return
        }
      }
      const patch = { status, completedAt: status === 'done' ? nowISO() : null }
      // opts.strict makes the underlying update() rethrow the real persistence error.
      await update('tasks', id, patch, { activity: status === 'done' ? 'completed' : undefined, strict: opts.strict })
      if (status === 'done' && task.recurrence && task.recurrence !== 'none') await spawnNextOccurrence(task)
    },
    [data.tasks, update, spawnNextOccurrence, toast],
  )

  // ── Strict status save (used by Agent Dashboard) ────────────────────────────
  // Reliability-first: writes the status fields, targets by id, and CONFIRMS using
  // the row the adapter returns from the write itself (Supabase upsert `.select()`
  // is part of the same statement → always consistent), instead of a separate
  // read-back query that can race read-after-write under connection pooling.
  // Optimistic update is reverted on any failure, and the real error is rethrown.
  const saveTaskStatusStrict = useCallback(
    async (id, status) => {
      const prev = data.tasks.find((t) => t.id === id)
      if (!prev) throw new Error('Task not found in current data')

      // Dependency blocking only applies to completion.
      if (status === 'done') {
        const blockers = (prev.dependencies || []).filter((depId) => data.tasks.find((t) => t.id === depId)?.status !== 'done')
        if (blockers.length) throw new Error(`Blocked — finish ${blockers.length} dependency task${blockers.length > 1 ? 's' : ''} first`)
      }

      // Build a minimal, status-only payload merged onto the existing row (so
      // user_id etc. are preserved for RLS). No reminder fields are touched.
      const payload = { ...prev, status, completedAt: status === 'done' ? nowISO() : null, updatedAt: nowISO() }
      console.log('[GE status DEBUG] saving', { id, before: prev.status, target: status, payloadStatus: payload.status })

      // Optimistic UI.
      setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? payload : t)) }))

      let savedRow
      try {
        savedRow = await db.put('tasks', payload) // returns the persisted row (Supabase .select()/local record)
      } catch (e) {
        console.error('[GE status DEBUG] db.put threw', { id, target: status, code: e?.code, message: e?.message, details: e?.details, hint: e?.hint })
        setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? prev : t)) })) // revert
        throw e
      }

      const returnedStatus = savedRow?.status ?? null
      console.log('[GE status DEBUG] backend returned', { id, returnedStatus, ok: returnedStatus === status })

      if (returnedStatus !== status) {
        setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? prev : t)) })) // revert
        throw new Error(`Backend returned status "${returnedStatus ?? 'no row'}" after requesting "${status}"`)
      }

      // Confirmed — sync shared state from the authoritative returned row.
      setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...savedRow } : t)) }))
      if (status === 'done' && prev.recurrence && prev.recurrence !== 'none') await spawnNextOccurrence(prev)
      logActivity('task', status === 'done' ? 'completed' : 'updated', savedRow.title || prev.title || 'task')
      return savedRow
    },
    [data.tasks, spawnNextOccurrence, logActivity],
  )

  // ── Files (record + blob in storage) ────────────────────────────────────────
  const addFile = useCallback(
    async (meta, blob) => {
      const id = uid('file')
      const storagePath = isLocal ? id : `${userId}/${id}`
      if (blob) await db.saveBlob(storagePath, blob).catch((e) => console.error(e))
      const record = { id, user_id: userId, storagePath, createdAt: nowISO(), ...meta }
      setData((d) => ({ ...d, files: [record, ...d.files] }))
      await db.put('files', record).catch((e) => console.error(e))
      logActivity('file', 'uploaded', record.name || 'file')
      return record
    },
    [userId, isLocal, logActivity],
  )

  // Like addFile, but THROWS on storage/DB failure so callers can detect upload
  // errors (used by Quick Task Intake attachments). Additive — addFile unchanged.
  const uploadAttachment = useCallback(
    async (meta, blob) => {
      const id = uid('file')
      const storagePath = isLocal ? id : `${userId}/${id}`
      await db.saveBlob(storagePath, blob) // throws on failure
      const record = { id, user_id: userId, storagePath, createdAt: nowISO(), ...meta }
      await db.put('files', record) // throws on failure (no orphan blob record on save error)
      setData((d) => ({ ...d, files: [record, ...d.files] }))
      logActivity('file', 'uploaded', record.name || 'file')
      return record
    },
    [userId, isLocal, logActivity],
  )

  const removeFile = useCallback(
    async (id) => {
      const file = data.files.find((f) => f.id === id)
      if (file) await db.removeBlob(file.storagePath || file.id).catch(() => {})
      await remove('files', id)
    },
    [data.files, remove],
  )

  const getFileUrl = useCallback((file) => db.getFileUrl(file), [])

  // ── Settings ────────────────────────────────────────────────────────────────
  const updateSettings = useCallback(async (patch) => {
    setSettings((s) => {
      const next = { ...s, ...patch, profile: { ...s.profile, ...(patch.profile || {}) } }
      db.saveSettings(next).catch(() => {})
      return next
    })
  }, [])

  // ── Backup / restore / reset ────────────────────────────────────────────────
  const exportBackup = useCallback(async () => db.exportAll(), [])
  const importBackup = useCallback(async (payload) => {
    await db.importAll(payload)
    const loaded = {}
    for (const c of Object.keys(EMPTY)) loaded[c] = await db.getAll(c)
    setData({ ...EMPTY, ...loaded })
    const s = await db.getSettings()
    if (s) setSettings((prev) => ({ ...prev, ...s }))
  }, [])

  const resetWorkspace = useCallback(
    async (withDemo = true) => {
      await db.clearAll()
      if (withDemo && isLocal) {
        const seed = buildSeed()
        for (const c of Object.keys(seed)) await db.setAll(c, seed[c])
        const s = defaultSettings()
        await db.saveSettings(s)
        setData({ ...EMPTY, ...seed, files: [] })
        setSettings(s)
      } else {
        setData(EMPTY)
      }
    },
    [isLocal],
  )

  const clientById = useMemo(() => Object.fromEntries(data.clients.map((c) => [c.id, c])), [data.clients])
  const projectById = useMemo(() => Object.fromEntries(data.projects.map((p) => [p.id, p])), [data.projects])
  const taskById = useMemo(() => Object.fromEntries(data.tasks.map((t) => [t.id, t])), [data.tasks])
  const allTags = useMemo(
    () => [...new Set(data.tasks.flatMap((t) => t.tags || []))].sort((a, b) => a.localeCompare(b)),
    [data.tasks],
  )

  const value = {
    ...data,
    settings,
    loading,
    clientById,
    projectById,
    taskById,
    allTags,
    create,
    update,
    remove,
    refresh,
    bulkUpdate,
    bulkRemove,
    setTaskStatus,
    saveTaskStatusStrict,
    isBlocked,
    removeClient,
    removeProject,
    addFile,
    uploadAttachment,
    removeFile,
    getFileUrl,
    updateSettings,
    logActivity,
    exportBackup,
    importBackup,
    resetWorkspace,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
