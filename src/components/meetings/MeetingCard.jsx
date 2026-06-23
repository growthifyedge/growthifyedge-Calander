import { useState } from 'react'
import { Calendar, Pencil, Trash2, CheckCircle2, Circle, Zap, ChevronDown } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useQuickAdd } from '../../context/QuickAddContext'
import { useToast } from '../../context/ToastContext'
import { Card } from '../ui'
import { ConfirmDialog } from '../ui/Modal'
import { fmtDateTime, cn } from '../../lib/utils'

export default function MeetingCard({ meeting, showClient = true, defaultOpen = false }) {
  const { clientById, update, create, remove } = useData()
  const { open } = useQuickAdd()
  const { toast } = useToast()
  const [expanded, setExpanded] = useState(defaultOpen)
  const [confirm, setConfirm] = useState(false)

  const items = meeting.actionItems || []
  const openItems = items.filter((i) => !i.done).length

  const toggleItem = (id) =>
    update('meetings', meeting.id, {
      actionItems: items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    })

  const convertToTask = async (item) => {
    const task = await create('tasks', {
      title: item.text,
      description: `From meeting: ${meeting.title}`,
      clientId: meeting.clientId || null,
      projectId: null,
      category: 'General',
      priority: 'medium',
      status: 'pending',
      dueDate: null,
      notes: '',
    })
    if (!task) return // save failed — error already shown
    await update('meetings', meeting.id, {
      actionItems: items.map((i) => (i.id === item.id ? { ...i, taskId: task.id } : i)),
    })
    toast('Action item converted to task')
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
          <Calendar className="h-5 w-5" />
        </div>
        <button onClick={() => setExpanded((e) => !e)} className="min-w-0 flex-1 text-left">
          <h3 className="truncate text-base font-bold text-fg">{meeting.title}</h3>
          <p className="truncate text-xs text-muted">
            {fmtDateTime(meeting.date)}
            {showClient && clientById[meeting.clientId] && <> · {clientById[meeting.clientId].company}</>}
            {items.length > 0 && <> · {openItems} open action{openItems !== 1 ? 's' : ''}</>}
          </p>
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => open('meeting', { record: meeting })} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setConfirm(true)} className="rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
          <button onClick={() => setExpanded((e) => !e)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg">
            <ChevronDown className={cn('h-4 w-4 transition', expanded && 'rotate-180')} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-border px-4 py-4">
          {meeting.notes && (
            <div>
              <div className="label">Notes</div>
              <p className="whitespace-pre-wrap text-sm text-fg/90">{meeting.notes}</p>
            </div>
          )}
          {meeting.decisions && (
            <div>
              <div className="label">Decisions</div>
              <p className="whitespace-pre-wrap text-sm text-fg/90">{meeting.decisions}</p>
            </div>
          )}
          {items.length > 0 && (
            <div>
              <div className="label">Action items</div>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2.5 rounded-lg bg-surface-2/60 px-3 py-2">
                    <button onClick={() => toggleItem(item.id)} className={cn(item.done ? 'text-emerald-500' : 'text-muted/50 hover:text-emerald-500')}>
                      {item.done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </button>
                    <span className={cn('flex-1 text-sm', item.done ? 'text-muted line-through' : 'text-fg')}>{item.text}</span>
                    {item.taskId ? (
                      <span className="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Task created</span>
                    ) : (
                      <button onClick={() => convertToTask(item)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-semibold text-accent-600 hover:bg-accent-500/10">
                        <Zap className="h-3 w-3" /> To task
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => remove('meetings', meeting.id)} title="Delete meeting note?" message={`“${meeting.title}” will be permanently removed.`} />
    </Card>
  )
}
