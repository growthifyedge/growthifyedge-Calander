import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, Pencil, Trash2, CheckSquare, CalendarClock } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useQuickAdd } from '../../context/QuickAddContext'
import { Card, ProgressBar } from '../ui'
import { ProjectStatusBadge } from '../ui/Badge'
import { ConfirmDialog } from '../ui/Modal'
import { dueLabel } from '../../lib/utils'

export default function ProjectCard({ project, showClient = true }) {
  const { clientById, tasks, removeProject } = useData()
  const { open } = useQuickAdd()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const projectTasks = tasks.filter((t) => t.projectId === project.id)
  const doneTasks = projectTasks.filter((t) => t.status === 'done').length

  return (
    <Card hover className="relative p-5">
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => navigate(`/projects/${project.id}`)} className="min-w-0 flex-1 text-left">
          <h3 className="truncate text-base font-bold text-fg">{project.name}</h3>
          {showClient && <p className="truncate text-sm text-muted">{clientById[project.clientId]?.company || 'Internal'}</p>}
        </button>
        <div className="relative">
          <button onClick={() => setMenu((m) => !m)} onBlur={() => setTimeout(() => setMenu(false), 150)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menu && (
            <div className="absolute right-0 top-9 z-20 w-32 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-pop">
              <button onClick={() => open('project', { record: project })} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2"><Pencil className="h-3.5 w-3.5" /> Edit</button>
              <button onClick={() => setConfirm(true)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        <ProjectStatusBadge value={project.status} />
      </div>

      {project.description && <p className="mt-3 line-clamp-2 text-sm text-muted">{project.description}</p>}

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-muted">
          <span>Progress</span>
          <span className="font-semibold text-fg">{project.progress || 0}%</span>
        </div>
        <ProgressBar value={project.progress || 0} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
        <span className="flex items-center gap-1.5"><CheckSquare className="h-3.5 w-3.5" /> {doneTasks}/{projectTasks.length} tasks</span>
        {project.dueDate && <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> {dueLabel(project.dueDate)}</span>}
      </div>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => removeProject(project.id)} title="Delete project?" message={`“${project.name}” will be removed. Its tasks and files will be kept but unlinked.`} />
    </Card>
  )
}
