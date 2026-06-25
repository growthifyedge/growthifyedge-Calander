import { useMemo, useState } from 'react'
import { ListChecks, CalendarClock, Lock, ShieldCheck } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { Card, EmptyState } from '../components/ui'
import { Select } from '../components/ui/Form'
import { TaskStatusBadge, PriorityBadge, ReminderChip } from '../components/ui/Badge'
import FileThumb from '../components/files/FileThumb'
import FilePreviewModal from '../components/files/FilePreviewModal'
import { dueLabel, isOverdue, isDueToday, fmtDate, fmtDateTime, cn } from '../lib/utils'

// Agent-facing 3-state status → existing task `status` values.
const AGENT_STATUSES = [
  { value: 'pending', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

const SOURCE_LABELS = { manual: 'Manual', whatsapp: 'WhatsApp', call: 'Call', meeting: 'Meeting', 'self-planned': 'Self Planned' }
const TYPE_LABELS = { video: 'Video', thumbnail: 'Thumbnail / Picture Post', caption: 'Caption' }

const FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'today', label: 'Today' },
  { id: 'top', label: 'Top Urgent' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

const tagLabel = (tags, map) => {
  const t = (tags || []).find((x) => map[x])
  return t ? map[t] : null
}

export default function AgentDashboard() {
  const { tasks, clients, files, clientById, setTaskStatus, update, isBlocked } = useData()
  const { toast } = useToast()
  const [filter, setFilter] = useState('active')
  const [clientId, setClientId] = useState('')
  const [previewFile, setPreviewFile] = useState(null)
  const [noteDrafts, setNoteDrafts] = useState({})

  const filtered = useMemo(() => {
    const list = tasks.filter((t) => {
      if (clientId && t.clientId !== clientId) return false
      const isTop = t.priority === 'urgent' || (t.tags || []).includes('top-urgent')
      switch (filter) {
        case 'today':
          return t.status !== 'done' && isDueToday(t.dueDate)
        case 'top':
          return t.status !== 'done' && isTop
        case 'urgent':
          return t.status !== 'done' && t.priority === 'high'
        case 'in_progress':
          return t.status === 'in_progress'
        case 'done':
          return t.status === 'done'
        case 'active':
        default:
          return t.status !== 'done'
      }
    })
    return [...list].sort((a, b) => new Date(a.dueDate || '2999') - new Date(b.dueDate || '2999'))
  }, [tasks, filter, clientId])

  // Update status only — reuses the existing setTaskStatus (handles completedAt,
  // recurrence, dependency-blocking). No other task fields are editable here.
  const changeStatus = async (t, value) => {
    if (value === t.status) return
    if (value === 'done' && isBlocked(t, tasks)) {
      await setTaskStatus(t.id, value) // setTaskStatus surfaces the "blocked" toast
      return
    }
    await setTaskStatus(t.id, value)
    toast('Status updated')
  }

  // Append-only completion note → preserves the owner's existing notes.
  const addNote = async (t) => {
    const text = (noteDrafts[t.id] || '').trim()
    if (!text) return
    const stamped = `[Agent · ${fmtDateTime(new Date())}] ${text}`
    const newNotes = t.notes ? `${t.notes}\n${stamped}` : stamped
    await update('tasks', t.id, { notes: newNotes })
    setNoteDrafts((d) => ({ ...d, [t.id]: '' }))
    toast('Note added')
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Standalone header (no admin sidebar/nav) */}
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-600 text-white shadow-sm shadow-accent-600/40">
            <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
              <path d="M9 21V11l7 6 7-6v10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-tight text-fg">Agent Dashboard</div>
            <div className="text-[11px] font-semibold text-muted">View tasks · update status</div>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted">
            <ShieldCheck className="h-3.5 w-3.5" /> Limited access
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-5">
        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs font-semibold transition',
                  filter === f.id ? 'border-accent-500 bg-accent-500/10 text-accent-600' : 'border-border text-muted hover:text-fg',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)} className="sm:w-56">
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.company}</option>
            ))}
          </Select>
        </div>

        <p className="mb-3 text-xs text-muted">{filtered.length} task{filtered.length !== 1 && 's'}</p>

        {filtered.length === 0 ? (
          <EmptyState icon={ListChecks} title="No tasks here" description="Nothing matches this filter right now." />
        ) : (
          <div className="space-y-3">
            {filtered.map((t) => {
              const attachments = files.filter((f) => f.taskId === t.id)
              const source = tagLabel(t.tags, SOURCE_LABELS)
              const type = tagLabel(t.tags, TYPE_LABELS)
              const overdue = isOverdue(t)
              const isTop = t.priority === 'urgent' || (t.tags || []).includes('top-urgent')
              return (
                <Card key={t.id} className="p-4">
                  <div className="flex flex-col gap-3">
                    {/* Title + meta */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-fg">{t.title}</h3>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {clientById[t.clientId]?.company || 'Internal'}
                          {t.createdAt && <> · created {fmtDate(t.createdAt)}</>}
                        </p>
                      </div>
                      <TaskStatusBadge value={t.status} />
                    </div>

                    {/* Chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <PriorityBadge value={t.priority} />
                      {isTop && <span className="chip bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">Top Urgent</span>}
                      {source && <span className="chip bg-surface-2 text-muted">Source: {source}</span>}
                      {type && <span className="chip bg-surface-2 text-muted">{type}</span>}
                      {t.dueDate && (
                        <span className={cn('chip', overdue ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' : 'bg-surface-2 text-muted')}>
                          <CalendarClock className="h-3 w-3" /> {dueLabel(t.dueDate)}
                        </span>
                      )}
                      <ReminderChip task={t} withStatus={false} />
                    </div>

                    {/* Description / notes (read-only) */}
                    {t.description && <p className="whitespace-pre-wrap text-sm text-fg/90">{t.description}</p>}
                    {t.notes && <p className="whitespace-pre-wrap rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">{t.notes}</p>}

                    {/* Attachments (view / open / download — no delete) */}
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setPreviewFile(f)}
                            className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 p-1.5 pr-2.5 text-xs transition hover:border-accent-400"
                            title="Open attachment"
                          >
                            <span className="h-8 w-8 overflow-hidden rounded-md">
                              <FileThumb file={f} rounded="rounded-md" />
                            </span>
                            <span className="max-w-[140px] truncate text-fg">{f.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Status update (the one editable control) */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      <span className="text-xs font-semibold text-muted">Set status:</span>
                      {AGENT_STATUSES.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => changeStatus(t, s.value)}
                          className={cn(
                            'rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                            t.status === s.value ? 'border-accent-500 bg-accent-500/10 text-accent-600' : 'border-border text-muted hover:text-fg',
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                      {t.status !== 'done' && isBlocked(t, tasks) && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <Lock className="h-3 w-3" /> blocked by dependencies
                        </span>
                      )}
                    </div>

                    {/* Completion note (append-only to existing notes field) */}
                    <div className="flex gap-2">
                      <input
                        value={noteDrafts[t.id] || ''}
                        onChange={(e) => setNoteDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNote(t))}
                        placeholder="Add a completion note…"
                        className="input flex-1 py-2 text-sm"
                      />
                      <button
                        onClick={() => addNote(t)}
                        disabled={!(noteDrafts[t.id] || '').trim()}
                        className="btn-ghost shrink-0 px-3 py-2 text-sm disabled:opacity-50"
                      >
                        Add note
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <FilePreviewModal file={previewFile} open={Boolean(previewFile)} onClose={() => setPreviewFile(null)} />
    </div>
  )
}
