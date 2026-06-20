import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Mail, Phone, MessageCircle, Pencil, Plus, Users, UploadCloud } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useQuickAdd } from '../context/QuickAddContext'
import PageHeader from '../components/PageHeader'
import { Button, Card, Avatar, EmptyState } from '../components/ui'
import { Tabs } from '../components/ui/Tabs'
import TaskListView from '../components/tasks/TaskListView'
import ProjectCard from '../components/projects/ProjectCard'
import FileGrid from '../components/files/FileGrid'
import MeetingCard from '../components/meetings/MeetingCard'

export default function ClientDetail() {
  const { id } = useParams()
  const { clients, projects, tasks, files, meetings } = useData()
  const { open } = useQuickAdd()
  const [tab, setTab] = useState('tasks')

  const client = clients.find((c) => c.id === id)
  const cTasks = useMemo(() => tasks.filter((t) => t.clientId === id), [tasks, id])
  const cProjects = useMemo(() => projects.filter((p) => p.clientId === id), [projects, id])
  const cFiles = useMemo(() => files.filter((f) => f.clientId === id), [files, id])
  const cMeetings = useMemo(() => meetings.filter((m) => m.clientId === id).sort((a, b) => new Date(b.date) - new Date(a.date)), [meetings, id])

  if (!client) {
    return <EmptyState icon={Users} title="Client not found" description="This client may have been deleted." action={<Button as="a" variant="ghost" href="#/clients">Back to clients</Button>} />
  }

  const tabs = [
    { id: 'tasks', label: 'Tasks', count: cTasks.length },
    { id: 'projects', label: 'Projects', count: cProjects.length },
    { id: 'files', label: 'Files', count: cFiles.length },
    { id: 'meetings', label: 'Meetings', count: cMeetings.length },
  ]

  return (
    <div>
      <PageHeader back={{ to: '/clients', label: 'Clients' }} title={client.company} subtitle={client.contact} actions={<Button variant="ghost" onClick={() => open('client', { record: client })}><Pencil className="h-4 w-4" /> Edit</Button>} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Sidebar info */}
        <Card className="p-5 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={client.company} size={64} />
            <h2 className="mt-3 text-lg font-bold text-fg">{client.company}</h2>
            {client.contact && <p className="text-sm text-muted">{client.contact}</p>}
          </div>
          <div className="mt-5 space-y-2.5 text-sm">
            {client.email && <a href={`mailto:${client.email}`} className="flex items-center gap-2.5 text-muted hover:text-accent-600"><Mail className="h-4 w-4" /> {client.email}</a>}
            {client.phone && <a href={`tel:${client.phone}`} className="flex items-center gap-2.5 text-muted hover:text-accent-600"><Phone className="h-4 w-4" /> {client.phone}</a>}
            {client.whatsapp && <a href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-muted hover:text-accent-600"><MessageCircle className="h-4 w-4" /> {client.whatsapp}</a>}
          </div>
          {client.notes && (
            <div className="mt-5 border-t border-border pt-4">
              <div className="label">Notes</div>
              <p className="whitespace-pre-wrap text-sm text-fg/90">{client.notes}</p>
            </div>
          )}
          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
            <div><div className="text-lg font-bold text-fg">{cProjects.length}</div><div className="text-[11px] text-muted">Projects</div></div>
            <div><div className="text-lg font-bold text-fg">{cTasks.filter((t) => t.status !== 'done').length}</div><div className="text-[11px] text-muted">Open</div></div>
            <div><div className="text-lg font-bold text-fg">{cFiles.length}</div><div className="text-[11px] text-muted">Files</div></div>
          </div>
        </Card>

        {/* Tabbed content */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <Tabs tabs={tabs} active={tab} onChange={setTab} className="flex-1" />
          </div>

          {tab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex justify-end"><Button variant="ghost" onClick={() => open('task', { initial: { clientId: id } })}><Plus className="h-4 w-4" /> Add task</Button></div>
              {cTasks.length ? <TaskListView tasks={cTasks} /> : <EmptyState title="No tasks for this client" />}
            </div>
          )}
          {tab === 'projects' && (
            <div className="space-y-3">
              <div className="flex justify-end"><Button variant="ghost" onClick={() => open('project', { initial: { clientId: id } })}><Plus className="h-4 w-4" /> Add project</Button></div>
              {cProjects.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{cProjects.map((p) => <ProjectCard key={p.id} project={p} showClient={false} />)}</div> : <EmptyState title="No projects yet" />}
            </div>
          )}
          {tab === 'files' && (
            <div className="space-y-3">
              <div className="flex justify-end"><Button variant="ghost" onClick={() => open('file', { initial: { clientId: id } })}><UploadCloud className="h-4 w-4" /> Upload</Button></div>
              {cFiles.length ? <FileGrid files={cFiles} /> : <EmptyState title="No files yet" />}
            </div>
          )}
          {tab === 'meetings' && (
            <div className="space-y-3">
              <div className="flex justify-end"><Button variant="ghost" onClick={() => open('meeting', { initial: { clientId: id } })}><Plus className="h-4 w-4" /> Add note</Button></div>
              {cMeetings.length ? cMeetings.map((m) => <MeetingCard key={m.id} meeting={m} showClient={false} />) : <EmptyState title="No meeting notes yet" />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
