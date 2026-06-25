import { useState } from 'react'
import { MessageSquarePlus, PencilLine, Wand2, Check, Bell, AlertTriangle, Tag, Eraser } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { useQuickAdd } from '../context/QuickAddContext'
import PageHeader from '../components/PageHeader'
import { Button, Card } from '../components/ui'
import { Field, Input, Textarea, Select } from '../components/ui/Form'
import { ConfirmDialog } from '../components/ui/Modal'
import { parseWhatsApp } from '../lib/whatsappParse'
import { toDateTimeInput, fmtDateTime, cn } from '../lib/utils'

const PRESET_CLIENTS = ['iSolutions Pakistan', 'Festigo Event Planner', 'Gain Shred Gym Mobile Shop']

// Capture priority levels → existing task `priority` field values.
const PRIORITY_LEVELS = [
  { value: 'normal', label: 'Normal' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'top', label: 'Top Urgent' },
]
const PRIORITY_MAP = { normal: 'medium', urgent: 'high', top: 'urgent' }

// Helper labels only — estimated work time. NOT used to schedule anything.
const TASK_TYPES = [
  { value: 'other', label: 'Other', est: null },
  { value: 'video', label: 'Video', est: 60 },
  { value: 'thumbnail', label: 'Thumbnail / Picture Post', est: 15 },
  { value: 'caption', label: 'Caption', est: 5 },
]

// One simple manual reminder/deadline workflow.
const REMINDER_PRESETS = [
  { value: 'none', label: 'No reminder' },
  { value: 'min5', label: 'In 5 minutes' },
  { value: 'min15', label: 'In 15 minutes' },
  { value: 'min20', label: 'In 20 minutes' },
  { value: 'min30', label: 'In 30 minutes' },
  { value: 'min60', label: 'In 60 minutes' },
  { value: 'today_evening', label: 'Today evening (6:00 PM)' },
  { value: 'tomorrow_morning', label: 'Tomorrow morning (9:00 AM)' },
  { value: 'custom', label: 'Custom date / time' },
]

// Task source → a tag slug (stored in existing `tags`; also written to notes).
const SOURCES = [
  { value: 'Manual', tag: 'manual' },
  { value: 'WhatsApp', tag: 'whatsapp' },
  { value: 'Call', tag: 'call' },
  { value: 'Meeting', tag: 'meeting' },
  { value: 'Self Planned', tag: 'self-planned' },
]

// Resolve a reminder mode to an absolute Date (computed at the moment it's needed,
// so relative presets like "In 5 minutes" are accurate from save time).
function resolveReminderDate(mode, customAt, now = new Date()) {
  const plus = (min) => new Date(now.getTime() + min * 60000)
  switch (mode) {
    case 'min5': return plus(5)
    case 'min15': return plus(15)
    case 'min20': return plus(20)
    case 'min30': return plus(30)
    case 'min60': return plus(60)
    case 'today_evening': { const d = new Date(now); d.setHours(18, 0, 0, 0); return d }
    case 'tomorrow_morning': { const d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d }
    case 'custom': return customAt ? new Date(customAt) : null
    default: return null // 'none'
  }
}

const blankManualDraft = () => ({
  title: '',
  description: '',
  priorityLevel: 'normal',
  taskType: 'other',
  reminderMode: 'none',
  reminderCustomAt: '',
  source: 'Manual',
})

// Shared fields used by BOTH modes: priority, task type, reminder, tags preview.
function CommonDraftFields({ draft, setDraft, resolved }) {
  const setD = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }))
  const type = TASK_TYPES.find((t) => t.value === draft.taskType)
  const srcTag = (SOURCES.find((s) => s.value === draft.source) || SOURCES[0]).tag
  return (
    <>
      {/* Priority */}
      <div>
        <span className="label">Priority{draft.detected?.urgent ? ' (suggested: Urgent — change if needed)' : ''}</span>
        <div className="flex gap-2">
          {PRIORITY_LEVELS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setDraft((d) => ({ ...d, priorityLevel: p.value }))}
              className={cn(
                'flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
                draft.priorityLevel === p.value
                  ? 'border-accent-500 bg-accent-500/10 text-accent-600'
                  : 'border-border text-muted hover:text-fg',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task type helper */}
      <Field label="Task type (work-time guide only)">
        <Select value={draft.taskType} onChange={setD('taskType')}>
          {TASK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}{t.est ? ` · ~${t.est} min` : ' · manual'}
            </option>
          ))}
        </Select>
        {type && type.est && (
          <span className="mt-1 block text-xs text-muted">
            Estimated work time ~{type.est} min — for your reference only, it does not schedule anything.
          </span>
        )}
      </Field>

      {/* Single manual reminder/deadline */}
      <Field label="When should I be reminded?">
        <Select value={draft.reminderMode} onChange={setD('reminderMode')}>
          {REMINDER_PRESETS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </Select>
        {draft.reminderMode === 'custom' && (
          <Input type="datetime-local" className="mt-2" value={draft.reminderCustomAt} onChange={setD('reminderCustomAt')} />
        )}
        {resolved ? (
          <span className="mt-1.5 flex items-center gap-1.5 text-xs text-accent-600 dark:text-accent-400">
            <Bell className="h-3.5 w-3.5" /> Reminder set for {fmtDateTime(resolved)}
          </span>
        ) : draft.priorityLevel === 'top' ? (
          <span className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" /> Top Urgent with no reminder set.
          </span>
        ) : null}
      </Field>

      {/* Tags preview */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="chip bg-surface-2 text-muted"><Tag className="h-3 w-3" /> {srcTag}</span>
        {draft.priorityLevel === 'top' && <span className="chip bg-surface-2 text-muted"><Tag className="h-3 w-3" /> top-urgent</span>}
        {draft.taskType !== 'other' && <span className="chip bg-surface-2 text-muted"><Tag className="h-3 w-3" /> {draft.taskType}</span>}
      </div>
    </>
  )
}

export default function QuickTaskIntake() {
  const { clients, create } = useData()
  const { toast } = useToast()
  const { open } = useQuickAdd()

  const [mode, setMode] = useState('paste') // 'paste' | 'manual'
  const [raw, setRaw] = useState('')
  const [clientSel, setClientSel] = useState('')
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const existingNames = new Set(clients.map((c) => (c.company || '').trim().toLowerCase()))
  const presetOptions = PRESET_CLIENTS.filter((n) => !existingNames.has(n.trim().toLowerCase()))

  const setD = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }))

  const switchMode = (m) => {
    setMode(m)
    setRaw('')
    setClientSel('')
    setConfirmOpen(false)
    setDraft(m === 'manual' ? blankManualDraft() : null)
  }

  const reset = () => {
    setRaw('')
    setClientSel('')
    setConfirmOpen(false)
    setDraft(mode === 'manual' ? blankManualDraft() : null)
  }

  const createDraft = () => {
    if (!raw.trim()) return toast('Paste a WhatsApp message first', 'error')
    const p = parseWhatsApp(raw)
    const clearDateTime = p.detected.date && p.detected.time && p.dueDate
    setDraft({
      title: p.title,
      description: p.description,
      priorityLevel: p.suggestedPriority, // suggestion only
      taskType: 'other',
      reminderMode: clearDateTime ? 'custom' : 'none',
      reminderCustomAt: clearDateTime ? toDateTimeInput(p.dueDate) : '',
      source: 'WhatsApp', // pasted messages default to WhatsApp
      detected: p.detected,
    })
  }

  const reminderDate = () => (draft ? resolveReminderDate(draft.reminderMode, draft.reminderCustomAt) : null)

  const resolveClientId = async (allowCreate) => {
    if (!clientSel) return null
    if (clientSel.startsWith('new:')) {
      const name = clientSel.slice(4)
      const existing = clients.find((c) => (c.company || '').trim().toLowerCase() === name.trim().toLowerCase())
      if (existing) return existing.id
      if (!allowCreate) return null
      const c = await create('clients', { company: name })
      return c?.id ?? null
    }
    return clientSel
  }

  const buildPayload = (clientId, when) => {
    const type = TASK_TYPES.find((t) => t.value === draft.taskType)
    const src = SOURCES.find((s) => s.value === draft.source) || SOURCES[0]
    const tags = [src.tag]
    if (draft.priorityLevel === 'top') tags.push('top-urgent')
    if (draft.taskType !== 'other') tags.push(draft.taskType)
    const notes =
      `Source: ${draft.source} · ${fmtDateTime(new Date())}` +
      (type && type.est ? `\nType: ${type.label} · ~${type.est} min (estimate only)` : '')
    return {
      title: draft.title.trim() || 'Quick task',
      description: draft.description || '',
      clientId,
      projectId: null,
      category: 'General',
      priority: PRIORITY_MAP[draft.priorityLevel] || 'medium',
      status: 'pending',
      dueDate: when ? when.toISOString() : null,
      notes,
      tags,
      dependencies: [],
      recurrence: 'none',
      reminder: when ? 'at_due' : 'none',
      reminderCustomAt: null,
    }
  }

  // Actual save → existing create('tasks', …) path.
  const doSave = async () => {
    setSaving(true)
    try {
      const when = reminderDate()
      const clientId = await resolveClientId(true)
      const task = await create('tasks', buildPayload(clientId, when))
      if (task) {
        toast('Task saved')
        reset()
      }
    } finally {
      setSaving(false)
    }
  }

  const approveSave = async () => {
    if (!draft.title.trim()) return toast('Task title is required', 'error')
    if (draft.priorityLevel === 'top' && !reminderDate()) {
      setConfirmOpen(true)
      return
    }
    await doSave()
  }

  const openFullEditor = async () => {
    const when = reminderDate()
    const clientId = await resolveClientId(false)
    const src = SOURCES.find((s) => s.value === draft.source) || SOURCES[0]
    const tags = [src.tag]
    if (draft.priorityLevel === 'top') tags.push('top-urgent')
    open('task', {
      initial: {
        title: draft.title,
        description: draft.description,
        clientId: clientId || '',
        category: 'General',
        priority: PRIORITY_MAP[draft.priorityLevel] || 'medium',
        status: 'pending',
        dueDate: when ? when.toISOString() : null,
        reminder: when ? 'at_due' : 'none',
        tags,
      },
    })
    reset()
  }

  const resolved = reminderDate()

  // Reusable client <Select> (used by both modes).
  const clientSelect = (
    <Select value={clientSel} onChange={(e) => setClientSel(e.target.value)}>
      <option value="">No client</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>{c.company}</option>
      ))}
      {presetOptions.map((n) => (
        <option key={n} value={`new:${n}`}>{n} (new client)</option>
      ))}
    </Select>
  )

  const TABS = [
    { id: 'paste', label: 'Paste Client Message', icon: MessageSquarePlus },
    { id: 'manual', label: 'Manual Quick Task', icon: PencilLine },
  ]

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Quick Task Intake"
        subtitle="Capture tasks fast — paste a client message or type one manually. Nothing saves until you approve."
      />

      {/* Mode tabs */}
      <div className="mb-5 inline-flex rounded-xl border border-border bg-surface-2/50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchMode(tab.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition',
              mode === tab.id ? 'bg-surface text-fg shadow-soft' : 'text-muted hover:text-fg',
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'paste' ? (
        <div className="space-y-5">
          {/* Step 1 — paste + client */}
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
              <MessageSquarePlus className="h-4 w-4" /> 1 · Paste message
            </h2>
            <Field label="WhatsApp message">
              <Textarea
                rows={5}
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="Paste the copied WhatsApp message here…"
                autoFocus
              />
            </Field>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Client">{clientSelect}</Field>
              <div className="flex items-end">
                <Button onClick={createDraft} className="w-full">
                  <Wand2 className="h-4 w-4" /> Create draft
                </Button>
              </div>
            </div>
          </Card>

          {/* Step 2 — review/edit draft */}
          {draft && (
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
                  <PencilLine className="h-4 w-4" /> 2 · Review &amp; edit draft
                </h2>
                {draft.detected?.urgent && (
                  <span className="chip bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    <AlertTriangle className="h-3 w-3" /> urgency words detected
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <Field label="Task title" required>
                  <Input value={draft.title} onChange={setD('title')} />
                </Field>
                <Field label="Description / notes" hint="The original WhatsApp message is kept here — edit as needed.">
                  <Textarea rows={4} value={draft.description} onChange={setD('description')} />
                </Field>

                <CommonDraftFields draft={draft} setDraft={setDraft} resolved={resolved} />

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
                  <Button variant="subtle" onClick={reset}>Discard</Button>
                  <Button variant="ghost" onClick={openFullEditor}>Open in full editor</Button>
                  <Button onClick={approveSave} disabled={saving}>
                    <Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Approve & Save'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      ) : (
        // ── Manual Quick Task ──────────────────────────────────────────────
        draft && (
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
              <PencilLine className="h-4 w-4" /> Manual Quick Task
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Client">{clientSelect}</Field>
                <Field label="Source">
                  <Select value={draft.source} onChange={setD('source')}>
                    {SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>{s.value}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Task title" required>
                <Input value={draft.title} onChange={setD('title')} placeholder="What needs to get done?" autoFocus />
              </Field>
              <Field label="Description / notes">
                <Textarea rows={3} value={draft.description} onChange={setD('description')} placeholder="Optional details…" />
              </Field>

              <CommonDraftFields draft={draft} setDraft={setDraft} resolved={resolved} />

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
                <Button variant="subtle" onClick={reset}><Eraser className="h-4 w-4" /> Clear</Button>
                <Button onClick={approveSave} disabled={saving}>
                  <Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Approve & Save'}
                </Button>
              </div>
            </div>
          </Card>
        )
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doSave}
        title="Top Urgent task has no reminder/deadline"
        message="Do you still want to save?"
        confirmLabel="Save anyway"
        danger={false}
      />
    </div>
  )
}
