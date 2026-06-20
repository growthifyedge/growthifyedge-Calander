import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Pencil, Plus, FolderKanban, UploadCloud, CalendarClock } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useQuickAdd } from '../context/QuickAddContext'
import PageHeader from '../components/PageHeader'
import { Button, Card, ProgressBar, EmptyState } from '../components/ui'
import { ProjectStatusBadge, ApprovalStatusBadge } from '../components/ui/Badge'
import { Tabs } from '../components/ui/Tabs'
import TaskListView from '../components/tasks/TaskListView'
import FileGrid from '../components/files/FileGrid'
import { dueLabel, fmtDate } from '../lib/utils'

export default function ProjectDetail() {
  const { id } = useParams()
  const { projects, clientById, tasks, files, approvals, update } = useData()
  const { open } = useQuickAdd()
  const [tab, setTab] = useState('tasks')

  const project = projects.find((p) => p.id === id)
  const pTasks = useMemo(() => tasks.filter((t) => t.projectId === id), [tasks, id])
  const pFiles = useMemo(() => files.filter((f) => f.projectId === id), [files, id])
  const pApprovals = useMemo(() => approvals.filter((a) => a.projectId === id), [approvals, id])

  if (!project) {
    return <EmptyState icon={FolderKanban} title="Project not found" action={<Button as="a" variant="ghost" href="#/projects">Back to projects</Button>} />
  }

  const client = clientById[project.clientId]
  const doneCount = pTasks.filter((t) => t.status === 'done').length
  const autoProgress = pTasks.length ? Math.round((doneCount / pTasks.length) * 100) : project.progress || 0

  const tabs = [
    { id: 'tasks', label: 'Tasks', count: pTasks.length },
    { id: 'files', label: 'Files', count: pFiles.length },
    { id: 'approvals', label: 'Approvals', count: pApprovals.length },
  ]

  return (
    <div>
      <PageHeader
        back={{ to: '/projects', label: 'Projects' }}
        title={project.name}
        subtitle={client ? <>Client: <Link to={`/clients/${client.id}`} className="font-medium text-accent-600 hover:underline">{client.company}</Link></> : 'Internal project'}
        actions={<Button variant="ghost" onClick={() => open('project', { record: project })}><Pencil className="h-4 w-4" /> Edit</Button>}
      />

      {/* Overview */}
      <Card className="mb-5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <ProjectStatusBadge value={project.status} />
            {project.dueDate && <span className="flex items-center gap-1.5 text-sm text-muted"><CalendarClock className="h-4 w-4" /> Due {fmtDate(project.dueDate)} · {dueLabel(project.dueDate)}</span>}
          </div>
          <div className="w-full sm:w-64">
            <div className="mb-1 flex items-center justify-between text-xs text-muted">
              <span>Progress · {doneCount}/{pTasks.length} tasks done</span>
              <span className="font-semibold text-fg">{project.progress || 0}%</span>
            </div>
            <ProgressBar value={project.progress || 0} />
            {pTasks.length > 0 && project.progress !== autoProgress && (
              <button onClick={() => update('projects', id, { progress: autoProgress })} className="mt-1.5 text-[11px] font-semibold text-accent-600 hover:underline">
                Set to {autoProgress}% (from completed tasks)
              </button>
            )}
          </div>
        </div>
        {project.description && <p className="mt-4 whitespace-pre-wrap border-t border-border pt-4 text-sm text-fg/90">{project.description}</p>}
      </Card>

      <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-4" />

      {tab === 'tasks' && (
        <div className="space-y-3">
          <div className="flex justify-end"><Button variant="ghost" onClick={() => open('task', { initial: { projectId: id, clientId: project.clientId } })}><Plus className="h-4 w-4" /> Add task</Button></div>
          {pTasks.length ? <TaskListView tasks={pTasks} /> : <EmptyState title="No tasks in this project" />}
        </div>
      )}
      {tab === 'files' && (
        <div className="space-y-3">
          <div className="flex justify-end"><Button variant="ghost" onClick={() => open('file', { initial: { projectId: id, clientId: project.clientId } })}><UploadCloud className="h-4 w-4" /> Upload</Button></div>
          {pFiles.length ? <FileGrid files={pFiles} /> : <EmptyState title="No files yet" />}
        </div>
      )}
      {tab === 'approvals' && (
        <div className="space-y-3">
          <div className="flex justify-end"><Button variant="ghost" onClick={() => open('approval', { initial: { projectId: id, clientId: project.clientId } })}><Plus className="h-4 w-4" /> Add approval</Button></div>
          {pApprovals.length ? (
            <div className="space-y-2">
              {pApprovals.map((a) => (
                <button key={a.id} onClick={() => open('approval', { record: a })} className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 text-left hover:shadow-soft">
                  <span className="truncate text-sm font-semibold text-fg">{a.title}</span>
                  <ApprovalStatusBadge value={a.status} />
                </button>
              ))}
            </div>
          ) : <EmptyState title="No approval items yet" />}
        </div>
      )}
    </div>
  )
}
