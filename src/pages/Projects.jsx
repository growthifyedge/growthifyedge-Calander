import { useMemo, useState } from 'react'
import { Plus, Search, FolderKanban } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useQuickAdd } from '../context/QuickAddContext'
import PageHeader from '../components/PageHeader'
import { Button, EmptyState } from '../components/ui'
import { Select } from '../components/ui/Form'
import ProjectCard from '../components/projects/ProjectCard'
import { PROJECT_STATUSES } from '../lib/constants'

export default function Projects() {
  const { projects, clients } = useData()
  const { open } = useQuickAdd()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [clientId, setClientId] = useState('')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return projects.filter((p) => {
      if (term && !`${p.name} ${p.description || ''}`.toLowerCase().includes(term)) return false
      if (status && p.status !== status) return false
      if (clientId && p.clientId !== clientId) return false
      return true
    })
  }, [projects, q, status, clientId])

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        actions={<Button onClick={() => open('project')}><Plus className="h-4 w-4" /> New Project</Button>}
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" className="input pl-9" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-44">
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
        <Select value={clientId} onChange={(e) => setClientId(e.target.value)} className="sm:w-48">
          <option value="">All clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title={projects.length ? 'No projects match' : 'No projects yet'} description={projects.length ? 'Adjust your search or filters.' : 'Create a project and attach it to a client.'} action={<Button onClick={() => open('project')}><Plus className="h-4 w-4" /> New Project</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  )
}
