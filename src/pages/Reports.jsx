import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { FileDown, FileText, Clock, CheckCircle2, AlertTriangle, Users, FolderKanban } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/PageHeader'
import { Button, Card, StatCard } from '../components/ui'
import { TASK_CATEGORIES } from '../lib/constants'
import { isOverdue, fmtDate, fmtDateTime, daysUntil, downloadBlob, cn } from '../lib/utils'

export default function Reports() {
  const { tasks, clients, projects, clientById } = useData()
  const { toast } = useToast()
  const [active, setActive] = useState('pending')

  const reports = useMemo(() => {
    const byClient = (id) => clientById[id]?.company || 'Internal'
    const projName = (id) => projects.find((p) => p.id === id)?.name || '—'
    return {
      pending: {
        label: 'Pending Tasks',
        icon: Clock,
        columns: [
          { key: 'title', label: 'Task' },
          { key: 'client', label: 'Client' },
          { key: 'project', label: 'Project' },
          { key: 'priority', label: 'Priority' },
          { key: 'due', label: 'Due' },
        ],
        rows: tasks
          .filter((t) => t.status !== 'done')
          .map((t) => ({ title: t.title, client: byClient(t.clientId), project: projName(t.projectId), priority: t.priority, due: fmtDate(t.dueDate) })),
      },
      completed: {
        label: 'Completed Tasks',
        icon: CheckCircle2,
        columns: [
          { key: 'title', label: 'Task' },
          { key: 'client', label: 'Client' },
          { key: 'completed', label: 'Completed' },
        ],
        rows: tasks
          .filter((t) => t.status === 'done')
          .map((t) => ({ title: t.title, client: byClient(t.clientId), completed: t.completedAt ? fmtDateTime(t.completedAt) : '—' })),
      },
      overdue: {
        label: 'Overdue Tasks',
        icon: AlertTriangle,
        columns: [
          { key: 'title', label: 'Task' },
          { key: 'client', label: 'Client' },
          { key: 'due', label: 'Due' },
          { key: 'late', label: 'Days late' },
        ],
        rows: tasks
          .filter(isOverdue)
          .map((t) => ({ title: t.title, client: byClient(t.clientId), due: fmtDate(t.dueDate), late: Math.abs(daysUntil(t.dueDate)) })),
      },
      clients: {
        label: 'Client Progress',
        icon: Users,
        columns: [
          { key: 'client', label: 'Client' },
          { key: 'projects', label: 'Projects' },
          { key: 'open', label: 'Open tasks' },
          { key: 'done', label: 'Done tasks' },
          { key: 'rate', label: 'Completion' },
        ],
        rows: clients.map((c) => {
          const ct = tasks.filter((t) => t.clientId === c.id)
          const done = ct.filter((t) => t.status === 'done').length
          return {
            client: c.company,
            projects: projects.filter((p) => p.clientId === c.id).length,
            open: ct.length - done,
            done,
            rate: ct.length ? `${Math.round((done / ct.length) * 100)}%` : '—',
          }
        }),
      },
      projects: {
        label: 'Project Progress',
        icon: FolderKanban,
        columns: [
          { key: 'name', label: 'Project' },
          { key: 'client', label: 'Client' },
          { key: 'status', label: 'Status' },
          { key: 'progress', label: 'Progress' },
          { key: 'tasks', label: 'Tasks done' },
          { key: 'due', label: 'Due' },
        ],
        rows: projects.map((p) => {
          const pt = tasks.filter((t) => t.projectId === p.id)
          return {
            name: p.name,
            client: byClient(p.clientId),
            status: p.status,
            progress: `${p.progress || 0}%`,
            tasks: `${pt.filter((t) => t.status === 'done').length}/${pt.length}`,
            due: fmtDate(p.dueDate),
          }
        }),
      },
    }
  }, [tasks, clients, projects, clientById])

  const current = reports[active]
  const categoryData = useMemo(
    () => TASK_CATEGORIES.map((c) => ({ name: c, value: tasks.filter((t) => t.category === c).length })).filter((d) => d.value),
    [tasks],
  )

  const summary = {
    pending: tasks.filter((t) => t.status !== 'done').length,
    completed: tasks.filter((t) => t.status === 'done').length,
    overdue: tasks.filter(isOverdue).length,
  }

  const exportCSV = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const header = current.columns.map((c) => esc(c.label)).join(',')
    const lines = current.rows.map((r) => current.columns.map((c) => esc(r[c.key])).join(','))
    const csv = [header, ...lines].join('\n')
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `growthifyedge-${active}-report.csv`)
  }

  const exportPDF = () => {
    const rowsHtml = current.rows
      .map((r) => `<tr>${current.columns.map((c) => `<td>${String(r[c.key] ?? '')}</td>`).join('')}</tr>`)
      .join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${current.label} — GrowthifyEdge OS</title>
      <style>
        body{font-family:Inter,Arial,sans-serif;color:#0f172a;padding:40px;}
        h1{font-size:22px;margin:0 0 4px} .sub{color:#64748b;font-size:12px;margin-bottom:24px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th{text-align:left;background:#f1f5f9;padding:8px 10px;text-transform:uppercase;font-size:10px;letter-spacing:.04em;color:#475569}
        td{padding:8px 10px;border-bottom:1px solid #e2e8f0}
        .brand{display:flex;align-items:center;gap:8px;margin-bottom:20px;font-weight:800;color:#4f46e5}
      </style></head><body>
      <div class="brand">▲ GrowthifyEdge OS</div>
      <h1>${current.label}</h1>
      <div class="sub">Generated ${fmtDateTime(new Date())} · ${current.rows.length} records</div>
      <table><thead><tr>${current.columns.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table>
      <script>window.onload=function(){window.print()}</script>
      </body></html>`
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
    } else {
      toast('Allow pop-ups for this site to export PDF', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Operational reports across tasks, clients and projects."
        actions={
          <>
            <Button variant="ghost" onClick={exportCSV}><FileDown className="h-4 w-4" /> CSV</Button>
            <Button onClick={exportPDF}><FileText className="h-4 w-4" /> PDF</Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="grid grid-cols-3 gap-3 lg:col-span-1">
          <StatCard icon={Clock} label="Pending" value={summary.pending} tone="amber" />
          <StatCard icon={CheckCircle2} label="Completed" value={summary.completed} tone="emerald" />
          <StatCard icon={AlertTriangle} label="Overdue" value={summary.overdue} tone="red" />
        </div>
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Tasks by Category</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={categoryData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={42} />
              <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgb(var(--surface-2))' }} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="rgb(var(--accent-500))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Report selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(reports).map(([id, r]) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn('inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition', active === id ? 'border-accent-400 bg-accent-500/10 text-accent-600' : 'border-border text-muted hover:text-fg')}
          >
            <r.icon className="h-4 w-4" /> {r.label}
            <span className="rounded-full bg-surface-2 px-1.5 text-xs">{r.rows.length}</span>
          </button>
        ))}
      </div>

      {/* Report table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/50 text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                {current.columns.map((c) => <th key={c.key} className="px-4 py-3">{c.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {current.rows.length === 0 ? (
                <tr><td colSpan={current.columns.length} className="px-4 py-10 text-center text-muted">No records for this report.</td></tr>
              ) : (
                current.rows.map((r, i) => (
                  <tr key={i} className="transition hover:bg-surface-2/40">
                    {current.columns.map((c) => (
                      <td key={c.key} className={cn('px-4 py-3', c.key === 'title' || c.key === 'name' || c.key === 'client' ? 'font-medium text-fg' : 'text-muted', c.key === 'late' && 'text-red-500 font-semibold')}>
                        {r[c.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
