import { useState } from 'react'
import { MessageSquarePlus, Wand2, Check, CalendarClock, Bell, AlertTriangle, Tag, PencilLine } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { useQuickAdd } from '../context/QuickAddContext'
import PageHeader from '../components/PageHeader'
import { Button, Card } from '../components/ui'
import { Field, Input, Textarea, Select } from '../components/ui/Form'
import { parseWhatsApp } from '../lib/whatsappParse'
import { REMINDER_OPTIONS, TASK_PRIORITIES } from '../lib/constants'
import { toDateTimeInput, fmtDateTime } from '../lib/utils'

// The three intake clients from the brief, offered even before they exist as
// client records (created via the existing create('clients') on save).
const PRESET_CLIENTS = ['iSolutions Pakistan', 'Festigo Event Planner', 'Gain Shred Gym Mobile Shop']

export default function QuickCapture() {
  const { clients, create } = useData()
  const { toast } = useToast()
  const { open } = useQuickAdd()

  const [raw, setRaw] = useState('')
  const [clientSel, setClientSel] = useState('')
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)

  const existingNames = new Set(clients.map((c) => (c.company || '').trim().toLowerCase()))
  const presetOptions = PRESET_CLIENTS.filter((n) => !existingNames.has(n.trim().toLowerCase()))

  const setD = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }))

  const createDraft = () => {
    if (!raw.trim()) return toast('Paste a WhatsApp message first', 'error')
    const p = parseWhatsApp(raw)
    setDraft({
      title: p.title,
      description: p.description,
      dueDate: p.dueDate ? toDateTimeInput(p.dueDate) : '',
      reminder: p.reminder,
      reminderCustomAt: '',
      priority: p.priority,
      tags: p.tags,
      detected: p.detected,
    })
  }

  // Resolve the selected client to an id. For a preset not yet in the client
  // list, create it (only when saving) reusing the existing create('clients').
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

  const buildPayload = (clientId) => ({
    title: draft.title.trim() || 'WhatsApp task',
    description: draft.description || '',
    clientId,
    projectId: null,
    category: 'General',
    priority: draft.priority,
    status: 'pending',
    dueDate: draft.dueDate ? new Date(draft.dueDate).toISOString() : null,
    notes: `Captured from WhatsApp · ${fmtDateTime(new Date())}`,
    tags: draft.tags,
    dependencies: [],
    recurrence: 'none',
    reminder: draft.reminder,
    reminderCustomAt:
      draft.reminder === 'custom' && draft.reminderCustomAt ? new Date(draft.reminderCustomAt).toISOString() : null,
  })

  const reset = () => {
    setRaw('')
    setClientSel('')
    setDraft(null)
  }

  // Approve & Save → existing task save path (create('tasks', …)).
  const approveSave = async () => {
    if (!draft.title.trim()) return toast('Task title is required', 'error')
    setSaving(true)
    try {
      const clientId = await resolveClientId(true)
      const task = await create('tasks', buildPayload(clientId))
      if (task) {
        toast('Task saved from WhatsApp capture')
        reset()
      }
      // if task is null, create() already showed the error toast
    } finally {
      setSaving(false)
    }
  }

  // Optional: hand the draft to the full task editor for extra fields.
  const openFullEditor = async () => {
    const clientId = await resolveClientId(false) // don't create a client just to open the editor
    open('task', {
      initial: {
        title: draft.title,
        description: draft.description,
        clientId: clientId || '',
        category: 'General',
        priority: draft.priority,
        status: 'pending',
        dueDate: draft.dueDate ? new Date(draft.dueDate).toISOString() : null,
        reminder: draft.reminder,
        reminderCustomAt:
          draft.reminder === 'custom' && draft.reminderCustomAt ? new Date(draft.reminderCustomAt).toISOString() : null,
        tags: draft.tags,
      },
    })
    reset()
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="WhatsApp Quick Capture"
        subtitle="Paste a client message, pick the client, review the draft, then save — nothing saves until you approve."
      />

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
            <Field label="Client">
              <Select value={clientSel} onChange={(e) => setClientSel(e.target.value)}>
                <option value="">No client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company}
                  </option>
                ))}
                {presetOptions.map((n) => (
                  <option key={n} value={`new:${n}`}>
                    {n} (new client)
                  </option>
                ))}
              </Select>
            </Field>
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
              <div className="flex flex-wrap gap-1.5">
                {draft.detected.date && <span className="chip bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"><CalendarClock className="h-3 w-3" /> date</span>}
                {draft.detected.time && <span className="chip bg-accent-500/10 text-accent-600 dark:text-accent-300"><Bell className="h-3 w-3" /> time</span>}
                {draft.detected.urgent && <span className="chip bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"><AlertTriangle className="h-3 w-3" /> urgent</span>}
              </div>
            </div>

            <div className="space-y-4">
              <Field label="Task title" required>
                <Input value={draft.title} onChange={setD('title')} />
              </Field>
              <Field label="Description / notes" hint="The original WhatsApp message is kept here — edit as needed.">
                <Textarea rows={4} value={draft.description} onChange={setD('description')} />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Due date">
                  <Input type="datetime-local" value={draft.dueDate} onChange={setD('dueDate')} />
                </Field>
                <Field label="Priority">
                  <Select value={draft.priority} onChange={setD('priority')}>
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Reminder">
                  <Select value={draft.reminder} onChange={setD('reminder')}>
                    {REMINDER_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </Select>
                </Field>
                {draft.reminder === 'custom' && (
                  <Field label="Remind me at">
                    <Input type="datetime-local" value={draft.reminderCustomAt} onChange={setD('reminderCustomAt')} />
                  </Field>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {draft.tags.map((t) => (
                  <span key={t} className="chip bg-surface-2 text-muted"><Tag className="h-3 w-3" /> {t}</span>
                ))}
              </div>

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
    </div>
  )
}
