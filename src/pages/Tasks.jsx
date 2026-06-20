import { useMemo, useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { List, LayoutGrid, CalendarDays, Plus, Search, X, SlidersHorizontal, CheckSquare } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useQuickAdd } from '../context/QuickAddContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/PageHeader'
import { Button, EmptyState } from '../components/ui'
import { Select, Checkbox } from '../components/ui/Form'
import { ConfirmDialog } from '../components/ui/Modal'
import TaskListView from '../components/tasks/TaskListView'
import KanbanBoard from '../components/tasks/KanbanBoard'
import BulkActionBar from '../components/tasks/BulkActionBar'
import CalendarView from '../components/calendar/CalendarView'
import { TASK_STATUSES, TASK_PRIORITIES, TASK_CATEGORIES, statusMeta } from '../lib/constants'
import { cn } from '../lib/utils'

const VIEWS = [
  { id: 'list', label: 'List', icon: List },
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
]

export default function Tasks() {
  const { tasks, clients, projects, allTags, taskById, update, bulkUpdate, bulkRemove, setTaskStatus, isBlocked, logActivity } = useData()
  const { open } = useQuickAdd()
  const { toast } = useToast()
  const [view, setView] = useState('list')
  const [q, setQ] = useState('')
  const [f, setF] = useState({ clientId: '', projectId: '', category: '', priority: '', status: '', tag: '' })
  const [sort, setSort] = useState('due')
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    let list = tasks.filter((t) => {
      if (term && !(`${t.title} ${t.description || ''} ${t.notes || ''}`.toLowerCase().includes(term))) return false
      if (f.clientId && t.clientId !== f.clientId) return false
      if (f.projectId && t.projectId !== f.projectId) return false
      if (f.category && t.category !== f.category) return false
      if (f.priority && t.priority !== f.priority) return false
      if (f.status && t.status !== f.status) return false
      if (f.tag && !(t.tags || []).includes(f.tag)) return false
      return true
    })
    const prRank = (p) => statusMeta(TASK_PRIORITIES, p).rank
    list = [...list].sort((a, b) => {
      if (sort === 'due') return new Date(a.dueDate || '2999') - new Date(b.dueDate || '2999')
      if (sort === 'priority') return prRank(b.priority) - prRank(a.priority)
      if (sort === 'created') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sort === 'title') return a.title.localeCompare(b.title)
      return 0
    })
    return list
  }, [tasks, q, f, sort])

  const activeFilters = Object.values(f).filter(Boolean).length
  const clearFilters = () => setF({ clientId: '', projectId: '', category: '', priority: '', status: '', tag: '' })

  // ── Bulk selection ──────────────────────────────────────────────────────
  const ids = useMemo(() => [...selected], [selected])
  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }, [])
  const clearSelection = useCallback(() => setSelected(new Set()), [])
  const selectAll = () => setSelected(new Set(tasks.map((t) => t.id)))
  const visibleIds = filtered.map((t) => t.id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))
  const someVisibleSelected = visibleIds.some((id) => selected.has(id))
  const toggleVisible = () =>
    setSelected((prev) => {
      const n = new Set(prev)
      if (allVisibleSelected) visibleIds.forEach((id) => n.delete(id))
      else visibleIds.forEach((id) => n.add(id))
      return n
    })

  const plural = (n) => `${n} task${n !== 1 ? 's' : ''}`

  const bulkStatus = async (status) => {
    if (status === 'done') {
      const sel = ids.map((id) => taskById[id]).filter(Boolean)
      const blocked = sel.filter((t) => t.status !== 'done' && isBlocked(t, tasks))
      const doable = sel.filter((t) => !blocked.includes(t))
      for (const t of doable) await setTaskStatus(t.id, 'done')
      toast(`${plural(doable.length)} marked done${blocked.length ? ` · ${blocked.length} skipped (blocked)` : ''}`, blocked.length ? 'info' : 'success')
    } else {
      await bulkUpdate('tasks', ids, { status, completedAt: null })
      logActivity('task', 'updated', plural(ids.length))
      toast(`${plural(ids.length)} updated`)
    }
  }
  const bulkPriority = async (priority) => {
    await bulkUpdate('tasks', ids, { priority })
    logActivity('task', 'updated', plural(ids.length))
    toast(`Priority set for ${plural(ids.length)}`)
  }
  const bulkDue = async (iso) => {
    await bulkUpdate('tasks', ids, { dueDate: iso })
    toast(iso ? `Due date set for ${plural(ids.length)}` : `Due date cleared for ${plural(ids.length)}`)
  }
  const bulkTags = async (arr) => {
    await bulkUpdate('tasks', ids, (t) => ({ tags: [...new Set([...(t.tags || []), ...arr])] }))
    toast(`Tags added to ${plural(ids.length)}`)
  }
  const doBulkDelete = async () => {
    const n = ids.length
    await bulkRemove('tasks', ids)
    logActivity('task', 'deleted', plural(n))
    clearSelection()
    toast(`${plural(n)} deleted`)
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`${filtered.length} of ${tasks.length} tasks`}
        actions={
          <Button onClick={() => open('task')}>
            <Plus className="h-4 w-4" /> New Task
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" className="input pl-9" />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={cn('btn-ghost h-[42px] shrink-0', activeFilters && 'border-accent-400 text-accent-600')}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && <span className="rounded-full bg-accent-600 px-1.5 text-[10px] text-white">{activeFilters}</span>}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className="h-[42px] w-auto">
            <option value="due">Sort: Due date</option>
            <option value="priority">Sort: Priority</option>
            <option value="created">Sort: Newest</option>
            <option value="title">Sort: Title</option>
          </Select>
          <div className="inline-flex rounded-xl border border-border bg-surface-2/50 p-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition', view === v.id ? 'bg-surface text-fg shadow-soft' : 'text-muted hover:text-fg')}
                title={v.label}
              >
                <v.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface p-3 sm:grid-cols-3 lg:grid-cols-6">
          <Select value={f.status} onChange={(e) => setF((p) => ({ ...p, status: e.target.value }))}>
            <option value="">All statuses</option>
            {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Select value={f.priority} onChange={(e) => setF((p) => ({ ...p, priority: e.target.value }))}>
            <option value="">All priorities</option>
            {TASK_PRIORITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Select value={f.clientId} onChange={(e) => setF((p) => ({ ...p, clientId: e.target.value, projectId: '' }))}>
            <option value="">All clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
          </Select>
          <Select value={f.projectId} onChange={(e) => setF((p) => ({ ...p, projectId: e.target.value }))}>
            <option value="">All projects</option>
            {projects.filter((p) => !f.clientId || p.clientId === f.clientId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select value={f.category} onChange={(e) => setF((p) => ({ ...p, category: e.target.value }))}>
            <option value="">All categories</option>
            {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={f.tag} onChange={(e) => setF((p) => ({ ...p, tag: e.target.value }))} disabled={!allTags.length}>
            <option value="">{allTags.length ? 'All tags' : 'No tags yet'}</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="btn-subtle justify-start">
              <X className="h-4 w-4" /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Selection controls (List & Board) */}
      {view !== 'calendar' && filtered.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <label className="flex cursor-pointer select-none items-center gap-2 text-muted">
            <Checkbox checked={allVisibleSelected} indeterminate={someVisibleSelected && !allVisibleSelected} onChange={toggleVisible} />
            Select visible ({filtered.length})
          </label>
          <button onClick={selectAll} className="font-semibold text-accent-600 hover:underline">
            Select all {tasks.length}
          </button>
          {selected.size > 0 && (
            <button onClick={clearSelection} className="text-muted hover:text-fg">
              Clear selection ({selected.size})
            </button>
          )}
        </div>
      )}

      {/* Views */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={tasks.length ? 'Try adjusting your search or filters.' : 'Create your first task to get started.'}
          action={<Button onClick={() => open('task')}><Plus className="h-4 w-4" /> New Task</Button>}
        />
      ) : view === 'list' ? (
        <TaskListView tasks={filtered} selectedIds={selected} onToggleSelect={toggleSelect} />
      ) : view === 'board' ? (
        <KanbanBoard tasks={filtered} selectedIds={selected} onToggleSelect={toggleSelect} />
      ) : (
        <CalendarView
          tasks={filtered}
          showMeetings={false}
          onTaskClick={(t) => open('task', { record: t })}
          onReschedule={(id, date) => update('tasks', id, { dueDate: date })}
        />
      )}

      {/* Spacer so the floating bar never covers the last rows */}
      {selected.size > 0 && view !== 'calendar' && <div className="h-24" />}

      <AnimatePresence>
        {selected.size > 0 && view !== 'calendar' && (
          <BulkActionBar
            count={selected.size}
            onStatus={bulkStatus}
            onPriority={bulkPriority}
            onDueDate={bulkDue}
            onAddTags={bulkTags}
            onDelete={() => setConfirmDelete(true)}
            onClear={clearSelection}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={doBulkDelete}
        title={`Delete ${plural(selected.size)}?`}
        message="The selected tasks will be permanently removed. This cannot be undone."
        confirmLabel={`Delete ${selected.size}`}
      />
    </div>
  )
}
