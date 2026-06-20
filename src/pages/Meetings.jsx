import { useMemo, useState } from 'react'
import { Plus, Search, NotebookPen } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useQuickAdd } from '../context/QuickAddContext'
import PageHeader from '../components/PageHeader'
import { Button, EmptyState } from '../components/ui'
import { Select } from '../components/ui/Form'
import MeetingCard from '../components/meetings/MeetingCard'

export default function Meetings() {
  const { meetings, clients } = useData()
  const { open } = useQuickAdd()
  const [q, setQ] = useState('')
  const [clientId, setClientId] = useState('')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return meetings
      .filter((m) => {
        if (term && !`${m.title} ${m.notes || ''} ${m.decisions || ''}`.toLowerCase().includes(term)) return false
        if (clientId && m.clientId !== clientId) return false
        return true
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [meetings, q, clientId])

  return (
    <div>
      <PageHeader
        title="Meeting Notes"
        subtitle="Capture decisions and turn action items into tasks."
        actions={<Button onClick={() => open('meeting')}><Plus className="h-4 w-4" /> New Note</Button>}
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search meeting notes…" className="input pl-9" />
        </div>
        <Select value={clientId} onChange={(e) => setClientId(e.target.value)} className="sm:w-48">
          <option value="">All clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={NotebookPen} title={meetings.length ? 'No notes match' : 'No meeting notes yet'} description={meetings.length ? 'Try a different search.' : 'Log your first meeting and capture the decisions.'} action={<Button onClick={() => open('meeting')}><Plus className="h-4 w-4" /> New Note</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((m) => <MeetingCard key={m.id} meeting={m} />)}
        </div>
      )}
    </div>
  )
}
