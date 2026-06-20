import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Mail, Phone, MessageCircle, Pencil, Trash2, MoreHorizontal, Users, FolderKanban, CheckSquare } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useQuickAdd } from '../context/QuickAddContext'
import PageHeader from '../components/PageHeader'
import { Button, Card, Avatar, EmptyState } from '../components/ui'
import { ConfirmDialog } from '../components/ui/Modal'

export default function Clients() {
  const { clients, projects, tasks, files, removeClient } = useData()
  const { open } = useQuickAdd()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [menuId, setMenuId] = useState(null)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return clients.filter((c) => !term || `${c.company} ${c.contact} ${c.email}`.toLowerCase().includes(term))
  }, [clients, q])

  const counts = (id) => ({
    projects: projects.filter((p) => p.clientId === id).length,
    tasks: tasks.filter((t) => t.clientId === id && t.status !== 'done').length,
    files: files.filter((f) => f.clientId === id).length,
  })

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} client${clients.length !== 1 ? 's' : ''}`}
        actions={<Button onClick={() => open('client')}><Plus className="h-4 w-4" /> Add Client</Button>}
      />

      <div className="relative mb-5 max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients…" className="input pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No clients yet" description="Add your first client to start organising their work." action={<Button onClick={() => open('client')}><Plus className="h-4 w-4" /> Add Client</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const ct = counts(c.id)
            return (
              <Card key={c.id} hover className="relative p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={c.company} size={44} />
                  <button onClick={() => navigate(`/clients/${c.id}`)} className="min-w-0 flex-1 text-left">
                    <h3 className="truncate text-base font-bold text-fg">{c.company}</h3>
                    {c.contact && <p className="truncate text-sm text-muted">{c.contact}</p>}
                  </button>
                  <div className="relative">
                    <button onClick={() => setMenuId(menuId === c.id ? null : c.id)} onBlur={() => setTimeout(() => setMenuId((m) => (m === c.id ? null : m)), 150)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {menuId === c.id && (
                      <div className="absolute right-0 top-9 z-20 w-32 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-pop">
                        <button onClick={() => open('client', { record: c })} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                        <button onClick={() => setConfirm(c)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  {c.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {c.email}</span>}
                  {c.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {c.phone}</span>}
                  {c.whatsapp && <span className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> {c.whatsapp}</span>}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-fg">{ct.projects}</div>
                    <div className="flex items-center justify-center gap-1 text-[11px] text-muted"><FolderKanban className="h-3 w-3" /> Projects</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-fg">{ct.tasks}</div>
                    <div className="flex items-center justify-center gap-1 text-[11px] text-muted"><CheckSquare className="h-3 w-3" /> Open</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-fg">{ct.files}</div>
                    <div className="text-[11px] text-muted">Files</div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => removeClient(confirm.id)}
        title="Delete client?"
        message={`“${confirm?.company}” will be removed. Their tasks, projects and files will be kept but unlinked.`}
      />
    </div>
  )
}
