import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useQuickAdd } from '../../context/QuickAddContext'
import { TASK_STATUSES } from '../../lib/constants'
import { cn } from '../../lib/utils'
import TaskCard from './TaskCard'

export default function KanbanBoard({ tasks, selectedIds, onToggleSelect }) {
  const { setTaskStatus } = useData()
  const { open } = useQuickAdd()
  const [dragId, setDragId] = useState(null)
  const [overCol, setOverCol] = useState(null)

  const drop = (status) => {
    if (dragId) setTaskStatus(dragId, status)
    setDragId(null)
    setOverCol(null)
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUSES.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.value)
        return (
          <div
            key={col.value}
            onDragOver={(e) => {
              e.preventDefault()
              setOverCol(col.value)
            }}
            onDragLeave={() => setOverCol((c) => (c === col.value ? null : c))}
            onDrop={() => drop(col.value)}
            className={cn(
              'flex max-h-[calc(100vh-220px)] flex-col rounded-2xl border bg-surface-2/40 transition',
              overCol === col.value ? 'border-accent-400 bg-accent-50/40 dark:bg-accent-500/5' : 'border-border',
            )}
          >
            <div className="flex items-center justify-between px-3.5 pt-3.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.dot }} />
                <span className="text-sm font-bold text-fg">{col.label}</span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">{colTasks.length}</span>
              </div>
              <button onClick={() => open('task', { initial: { status: col.value } })} className="text-muted hover:text-accent-600" title="Add task here">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-2.5 overflow-y-auto p-3.5">
              {colTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-muted">Drop tasks here</div>
              ) : (
                colTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    onClick={() => open('task', { record: t })}
                    selected={selectedIds?.has(t.id)}
                    onToggleSelect={onToggleSelect}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
