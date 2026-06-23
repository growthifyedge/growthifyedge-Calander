import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useData } from './DataContext'
import { useToast } from './ToastContext'
import { reminderFireTime, toDate, fmtDateTime } from '../lib/utils'

const NotificationContext = createContext(null)
export const useNotifications = () => useContext(NotificationContext)

const KEY_FIRED = 'ge_fired_notifs'
const KEY_ENABLED = 'ge_notif_enabled'
const KEY_ASKED = 'ge_notif_asked'
const POLL_MS = 30000

const supported = typeof window !== 'undefined' && 'Notification' in window
const dev = import.meta.env.DEV
// NOTE: notification logs intentionally run in PRODUCTION too (temporary debugging).
const log = (...a) => console.log('[GE notif]', ...a)

export function NotificationProvider({ children }) {
  const { tasks, clientById } = useData()
  const { toast } = useToast()
  const [permission, setPermission] = useState(supported ? Notification.permission : 'unsupported')
  const [enabled, setEnabled] = useState(() => localStorage.getItem(KEY_ENABLED) !== 'false')

  const firedRef = useRef(new Set(JSON.parse(localStorage.getItem(KEY_FIRED) || '[]')))
  const lastCheckRef = useRef(Date.now())

  const persistFired = () => {
    let arr = [...firedRef.current]
    if (arr.length > 600) arr = arr.slice(-400) // prune
    firedRef.current = new Set(arr)
    localStorage.setItem(KEY_FIRED, JSON.stringify(arr))
  }

  // Keep the displayed permission in sync if the user changes it in browser
  // settings while the tab is open (otherwise React state goes stale).
  useEffect(() => {
    if (!supported) return
    const refresh = () => setPermission(Notification.permission)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    let permStatus
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'notifications' })
        .then((s) => {
          permStatus = s
          s.onchange = () => setPermission(Notification.permission)
        })
        .catch(() => {})
    }
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
      if (permStatus) permStatus.onchange = null
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!supported) return 'unsupported'
    try {
      const p = await Notification.requestPermission()
      setPermission(p)
      return p
    } catch {
      return supported ? Notification.permission : 'unsupported'
    }
  }, [])

  const setEnabledPersist = useCallback((v) => {
    setEnabled(v)
    localStorage.setItem(KEY_ENABLED, v ? 'true' : 'false')
  }, [])

  // Core: construct a browser Notification with MINIMAL options (no SVG icon —
  // SVG icons can silently prevent display in Chrome). Returns {ok, reason}.
  const notify = useCallback(async (title, body, tag) => {
    if (!supported) return { ok: false, reason: 'Notifications not supported in this browser' }
    const perm = Notification.permission
    if (perm === 'denied') return { ok: false, reason: 'blocked' }
    if (perm !== 'granted') return { ok: false, reason: 'permission not granted' }
    const options = { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', ...(tag ? { tag } : {}) }
    try {
      // Android Chrome forbids `new Notification(...)` — use the SW registration.
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification(title, options)
        return { ok: true }
      }
      new Notification(title, options)
      return { ok: true }
    } catch (e) {
      return { ok: false, reason: e?.message || 'Notification failed' }
    }
  }, [])

  // Settings "Send test" — directly triggers a real notification with full feedback.
  const sendTest = useCallback(async () => {
    log('Send test clicked', {
      'Notification.permission': supported ? Notification.permission : 'unsupported',
      'typeof window.Notification': typeof window.Notification,
      'window.isSecureContext': typeof window !== 'undefined' ? window.isSecureContext : 'n/a',
    })
    if (!supported) {
      toast('Notifications are not supported in this browser', 'error')
      return { ok: false, reason: 'unsupported' }
    }
    let perm = Notification.permission
    if (perm === 'default') perm = await requestPermission()
    if (perm === 'denied') {
      toast('Notifications blocked — allow them in your browser settings', 'error')
      return { ok: false, reason: 'blocked' }
    }
    if (perm !== 'granted') {
      toast('Notification permission was not granted', 'error')
      return { ok: false, reason: 'not granted' }
    }
    const res = await notify('Test notification', 'Reminder notifications are working on this device.')
    log('showNotification result', res)
    if (res.ok) toast('Test notification sent')
    else toast(`Notification failed: ${res.reason}`, 'error')
    return res
  }, [notify, requestPermission, toast])

  // Request permission once on first launch
  useEffect(() => {
    if (!supported) return
    log('mounted', {
      permission: Notification.permission,
      typeofNotification: typeof window.Notification,
      isSecureContext: window.isSecureContext,
    })
    if (Notification.permission === 'default' && !localStorage.getItem(KEY_ASKED)) {
      localStorage.setItem(KEY_ASKED, '1')
      Notification.requestPermission().then(setPermission).catch(() => {})
    }
  }, [])

  // Scheduler: poll every 30s for tasks crossing reminder / due / overdue moments.
  useEffect(() => {
    if (!supported) return

    const fireOnce = async (key, title, body) => {
      if (firedRef.current.has(key)) return
      firedRef.current.add(key)
      persistFired()
      const res = await notify(title, body, key)
      log('fired', { key, title, browserOk: res.ok, reason: res.reason })
      // Always surface an in-app toast — this is the fallback if the browser
      // notification fails for any reason, and confirms the scheduler triggered.
      const taskName = body.split('\n')[0]
      toast(`🔔 ${title.replace(/^[^\w]+/, '')}: ${taskName}`, res.ok ? 'info' : 'error')
    }
    const crossed = (time, since, now) => time != null && time > since && time <= now

    const check = () => {
      const now = Date.now()
      const since = lastCheckRef.current
      if (!enabled || Notification.permission !== 'granted') {
        lastCheckRef.current = now
        return
      }
      for (const t of tasks) {
        if (t.status === 'done' || !t.dueDate) continue
        const due = toDate(t.dueDate)?.getTime()
        if (!due) continue
        const client = clientById[t.clientId]?.company || 'Internal'
        const body = `${t.title}\n${client}\nDue ${fmtDateTime(t.dueDate)}`

        const rt = reminderFireTime(t)?.getTime()
        if (crossed(rt, since, now)) fireOnce(`${t.id}|reminder|${rt}`, 'GrowthifyEdge OS Reminder', body)
        if (crossed(due, since, now)) fireOnce(`${t.id}|due|${due}`, '⏰ Task due now', body)
        if (crossed(due + 60000, since, now)) fireOnce(`${t.id}|overdue|${due}`, '⚠️ Task overdue', body)
      }
      lastCheckRef.current = now
    }

    log('scheduler started', { tasks: tasks.length, enabled, permission: Notification.permission })
    check()
    const id = setInterval(check, POLL_MS)

    // Dev-only test seam (stripped from production builds).
    if (dev) window.__geNotif = { check, notify, setLastCheck: (t) => (lastCheckRef.current = t) }

    return () => clearInterval(id)
  }, [tasks, clientById, enabled, notify, toast])

  const value = { supported, permission, enabled, requestPermission, setEnabled: setEnabledPersist, notify, sendTest }
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
