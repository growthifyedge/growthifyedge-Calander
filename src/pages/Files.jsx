import { useMemo, useState } from 'react'
import { UploadCloud, Search, FolderOpen } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useQuickAdd } from '../context/QuickAddContext'
import PageHeader from '../components/PageHeader'
import { Button, EmptyState } from '../components/ui'
import { Select } from '../components/ui/Form'
import FileGrid from '../components/files/FileGrid'
import { fileKind, fmtBytes, sum, cn } from '../lib/utils'

const KINDS = [
  { value: '', label: 'All types' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'pdf', label: 'PDFs' },
  { value: 'document', label: 'Documents' },
]

export default function Files() {
  const { files, clients } = useData()
  const { open } = useQuickAdd()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('')
  const [clientId, setClientId] = useState('')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return files
      .filter((f) => {
        const k = f.kind || fileKind(f.mime, f.name)
        if (term && !f.name.toLowerCase().includes(term)) return false
        if (kind && k !== kind) return false
        if (clientId && f.clientId !== clientId) return false
        return true
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [files, q, kind, clientId])

  const totalSize = useMemo(() => sum(files, (f) => f.size || 0), [files])

  return (
    <div>
      <PageHeader
        title="File Center"
        subtitle={`${files.length} files · ${fmtBytes(totalSize)} stored`}
        actions={<Button onClick={() => open('file')}><UploadCloud className="h-4 w-4" /> Upload</Button>}
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files…" className="input pl-9" />
        </div>
        <Select value={kind} onChange={(e) => setKind(e.target.value)} className="sm:w-40">
          {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </Select>
        <Select value={clientId} onChange={(e) => setClientId(e.target.value)} className="sm:w-48">
          <option value="">All clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={files.length ? 'No files match' : 'No files yet'}
          description={files.length ? 'Try a different search or filter.' : 'Upload images, videos, PDFs and documents — they stay on your device.'}
          action={<Button onClick={() => open('file')}><UploadCloud className="h-4 w-4" /> Upload files</Button>}
        />
      ) : (
        <FileGrid files={filtered} />
      )}
    </div>
  )
}
