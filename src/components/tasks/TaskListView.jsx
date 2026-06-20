import { useState } from 'react'
import { CheckCircle2, Paperclip, Pencil, Trash2, MoreHorizontal, Repeat, Lock, Tag } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useQuickAdd } from '../../context/QuickAddContext'
import { PriorityBadge, TaskStatusBadge, CategoryBadge, ReminderChip } from '../ui/Badge'
import { Checkbox } from '../ui/Form'
import { ConfirmDialog } from '../ui/Modal'
import { isOverdue, dueLabel, cn } from '../../lib/utils'

export default function TaskListView({ tasks, selectedIds = new Set(), onToggleSelect }) {
  const { clientById, projectById, files, tasks: allTasks, setTaskStatus, isBlocked, remove } = useData()
  const { open } = useQuickAdd()
  const [confirm, setConfirm] = useState(null)
  const [menuId, setMenuId] = useState(null)

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {/* Header (desktop) */}
        <div className="hidden grid-cols-[auto_auto_1fr_140px_120px_110px_120px_40px] gap-3 border-b border-border bg-surface-2/50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted lg:grid">
          <span className="w-[18px]" />
          <span className="w-5" />
          <span>Task</span>
          <span>Client</span>
          <span>Category</span>
          <span>Priority</span>
          <span>Due</span>
          <span />
        </div>

        <ul className="divide-y divide-border">
          {tasks.map((t) => {
            const done = t.status === 'done'
            const overdue = isOverdue(t)
            const att = files.filter((f) => f.taskId === t.id).length
            const blocked = !done && isBlocked(t, allTasks)
            const recurring = t.recurrence && t.recurrence !== 'none'
            const tags = t.tags || []
            return (
              <li
                key={t.id}
                className={cn(
                  'group grid grid-cols-[auto_auto_1fr] items-center gap-x-3 gap-y-1 px-4 py-3 transition hover:bg-surface-2/40 lg:grid-cols-[auto_auto_1fr_140px_120px_110px_120px_40px]',
                  selectedIds.has(t.id) && 'bg-accent-500/[0.06]',
                )}
              >
                {/* select */}
                <span className="row-start-1 flex items-center" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selectedIds.has(t.id)} onChange={() => onToggleSelect?.(t.id)} aria-label="Select task" />
                </span>

                {/* status toggle */}
                <button
                  onClick={() => setTaskStatus(t.id, done ? 'pending' : 'done')}
                  className={cn('row-start-1', done ? 'text-emerald-500' : blocked ? 'text-amber-400' : 'text-muted/40 hover:text-emerald-500')}
                  title={blocked ? 'Blocked by dependencies' : done ? 'Mark as not done' : 'Mark as done'}
                >
                  {blocked ? <Lock className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                </button>

                {/* title */}
                <button onClick={() => open('task', { record: t })} className="min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className={cn('truncate text-sm font-semibold text-fg', done && 'text-muted line-through')}>{t.title}</span>
                    {recurring && <Repeat className="h-3.5 w-3.5 shrink-0 text-muted" title="Recurring" />}
                    {blocked && <span className="chip shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Blocked</span>}
                    {att > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-muted">
                        <Paperclip className="h-3 w-3" />
                        {att}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <ReminderChip task={t} withStatus={false} />
                    {tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="chip bg-surface-2 text-muted"><Tag className="h-2.5 w-2.5" />{tag}</span>
                    ))}
                  </div>
                  <div className="truncate text-xs text-muted lg:hidden">
                    {clientById[t.clientId]?.company || 'Internal'} · {dueLabel(t.dueDate)}
                  </div>
                </button>

                {/* client (desktop) */}
                <span className="hidden truncate text-sm text-muted lg:block">{clientById[t.clientId]?.company || '—'}</span>
                {/* category */}
                <span className="hidden lg:block">
                  <CategoryBadge value={t.category} />
                </span>
                {/* priority */}
                <span className="hidden lg:block">
                  <PriorityBadge value={t.priority} />
                </span>
                {/* due */}
                <span className={cn('hidden text-xs font-medium lg:block', overdue ? 'text-red-500' : 'text-muted')}>{dueLabel(t.dueDate)}</span>

                {/* actions */}
                <div className="relative col-start-3 row-start-1 justify-self-end lg:col-start-8">
                  <button
                    onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                    onBlur={() => setTimeout(() => setMenuId((m) => (m === t.id ? null : m)), 150)}
                    className="rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-surface-2 hover:text-fg group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {menuId === t.id && (
                    <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-pop">
                      <button onClick={() => open('task', { record: t })} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button onClick={() => setConfirm(t)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-500/10">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => remove('tasks', confirm.id)}
        title="Delete task?"
        message={`“${confirm?.title}” will be permanently removed.`}
      />
    </>
  )
}
