import { Paperclip, CheckCircle2, Repeat, Lock, Tag } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { PriorityDot, CategoryBadge, ReminderChip } from '../ui/Badge'
import { Checkbox } from '../ui/Form'
import { isOverdue, dueLabel, cn } from '../../lib/utils'

export default function TaskCard({ task, onClick, onDragStart, draggable, selected = false, onToggleSelect }) {
  const { clientById, projectById, files, tasks, setTaskStatus, isBlocked } = useData()
  const overdue = isOverdue(task)
  const attachments = files.filter((f) => f.taskId === task.id).length
  const done = task.status === 'done'
  const blocked = !done && isBlocked(task, tasks)
  const recurring = task.recurrence && task.recurrence !== 'none'
  const tags = task.tags || []

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-xl border bg-surface p-3 shadow-soft transition hover:shadow-card hover:-translate-y-0.5',
        selected ? 'border-accent-500 ring-2 ring-accent-500/30' : 'border-border',
        draggable && 'active:cursor-grabbing',
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onToggleSelect && (
            <span onClick={(e) => e.stopPropagation()} className="flex">
              <Checkbox checked={selected} onChange={() => onToggleSelect(task.id)} aria-label="Select task" />
            </span>
          )}
          <CategoryBadge value={task.category} />
        </div>
        <div className="flex items-center gap-1.5">
          {recurring && <Repeat className="h-3.5 w-3.5 text-muted" title="Recurring task" />}
          <PriorityDot value={task.priority} />
        </div>
      </div>

      <div className="flex items-start gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setTaskStatus(task.id, done ? 'pending' : 'done')
          }}
          className={cn('mt-0.5 shrink-0 transition', done ? 'text-emerald-500' : blocked ? 'text-amber-400' : 'text-muted/40 hover:text-emerald-500')}
          title={blocked ? 'Blocked by dependencies' : done ? 'Mark as not done' : 'Mark as done'}
        >
          {blocked ? <Lock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        </button>
        <p className={cn('flex-1 text-sm font-semibold leading-snug text-fg', done && 'text-muted line-through')}>{task.title}</p>
      </div>

      <p className="mt-1.5 truncate pl-6 text-xs text-muted">
        {clientById[task.clientId]?.company || 'Internal'}
        {projectById[task.projectId] && <> · {projectById[task.projectId].name}</>}
      </p>

      {(tags.length > 0 || task.reminder) && (
        <div className="mt-2 flex flex-wrap items-center gap-1 pl-6">
          <ReminderChip task={task} />
          {tags.slice(0, 3).map((t) => (
            <span key={t} className="chip bg-surface-2 text-muted">
              <Tag className="h-2.5 w-2.5" />
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between pl-6">
        <div className="flex items-center gap-1.5">
          {task.dueDate ? (
            <span className={cn('chip', overdue ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' : 'bg-surface-2 text-muted')}>{dueLabel(task.dueDate)}</span>
          ) : (
            <span />
          )}
          {blocked && <span className="chip bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Blocked</span>}
        </div>
        {attachments > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted">
            <Paperclip className="h-3 w-3" />
            {attachments}
          </span>
        )}
      </div>
    </div>
  )
}
