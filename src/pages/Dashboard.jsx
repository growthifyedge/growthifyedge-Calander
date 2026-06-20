import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  ListChecks,
  Clock,
  Loader,
  Eye,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  Plus,
  Users,
  FolderKanban,
  UploadCloud,
  NotebookPen,
  ArrowRight,
  FileText,
  Bell,
  CalendarPlus,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { useQuickAdd } from '../context/QuickAddContext'
import { StatCard, Card, SectionHeader, EmptyState } from '../components/ui'
import { PriorityDot } from '../components/ui/Badge'
import { TASK_STATUSES, TASK_PRIORITIES } from '../lib/constants'
import { isOverdue, isDueToday, dueLabel, relativeTime, fmtBytes, fileKind, reminderFireTime, daysUntil, cn } from '../lib/utils'

const ACTIVITY_ICON = { task: ListChecks, meeting: NotebookPen, approval: Eye, file: UploadCloud, client: Users, project: FolderKanban }

export default function Dashboard() {
  const { tasks, clients, files, activity, projectById, clientById } = useData()
  const { open } = useQuickAdd()

  const stats = useMemo(() => {
    const by = (s) => tasks.filter((t) => t.status === s).length
    return {
      total: tasks.length,
      pending: by('pending'),
      in_progress: by('in_progress'),
      review: by('review'),
      done: by('done'),
      overdue: tasks.filter(isOverdue).length,
      today: tasks.filter((t) => isDueToday(t.dueDate) && t.status !== 'done').length,
      tomorrow: tasks.filter((t) => t.status !== 'done' && daysUntil(t.dueDate) === 1).length,
    }
  }, [tasks])

  const upcomingReminders = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'done')
        .map((t) => ({ t, fire: reminderFireTime(t) }))
        .filter((x) => x.fire && x.fire.getTime() > Date.now())
        .sort((a, b) => a.fire - b.fire)
        .slice(0, 6),
    [tasks],
  )

  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'done' && t.dueDate)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 6),
    [tasks],
  )

  const recentUploads = useMemo(
    () => [...files].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [files],
  )

  const statusData = useMemo(
    () => TASK_STATUSES.map((s) => ({ name: s.label, value: tasks.filter((t) => t.status === s.value).length, color: s.dot })),
    [tasks],
  )
  const priorityData = useMemo(
    () =>
      TASK_PRIORITIES.map((p) => ({
        name: p.label,
        value: tasks.filter((t) => t.priority === p.value && t.status !== 'done').length,
        color: p.dot,
      })),
    [tasks],
  )

  const quickActions = [
    { label: 'Add Task', icon: Plus, onClick: () => open('task') },
    { label: 'Add Client', icon: Users, onClick: () => open('client') },
    { label: 'Add Project', icon: FolderKanban, onClick: () => open('project') },
    { label: 'Upload File', icon: UploadCloud, onClick: () => open('file') },
    { label: 'Meeting Note', icon: NotebookPen, onClick: () => open('meeting') },
  ]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg">{greeting} 👋</h1>
          <p className="mt-1 text-sm text-muted">
            You have <span className="font-semibold text-fg">{stats.today} task{stats.today !== 1 && 's'}</span> due today
            {stats.overdue > 0 && (
              <> and <span className="font-semibold text-red-500">{stats.overdue} overdue</span></>
            )}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-fg transition hover:border-accent-400 hover:text-accent-600"
            >
              <a.icon className="h-3.5 w-3.5" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={ListChecks} label="Total Tasks" value={stats.total} tone="accent" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} tone="slate" />
        <StatCard icon={Loader} label="In Progress" value={stats.in_progress} tone="blue" />
        <StatCard icon={Eye} label="In Review" value={stats.review} tone="amber" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.done} tone="emerald" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} tone="red" />
        <StatCard icon={CalendarClock} label="Due Today" value={stats.today} tone="accent" />
        <StatCard icon={CalendarPlus} label="Due Tomorrow" value={stats.tomorrow} tone="blue" />
      </div>

      {/* Main grid */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Upcoming deadlines */}
        <Card className="p-5 lg:col-span-2">
          <SectionHeader
            title="Upcoming Deadlines"
            count={upcoming.length}
            action={
              <Link to="/tasks" className="inline-flex items-center gap-1 text-xs font-semibold text-accent-600 hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Nothing on the horizon" description="All caught up — no upcoming due dates." />
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((t) => {
                const overdue = isOverdue(t)
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => open('task', { record: t })}
                      className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-surface-2/60 -mx-2 px-2 rounded-lg"
                    >
                      <PriorityDot value={t.priority} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-fg">{t.title}</p>
                        <p className="truncate text-xs text-muted">
                          {clientById[t.clientId]?.company || 'Internal'}
                          {projectById[t.projectId] && <> · {projectById[t.projectId].name}</>}
                        </p>
                      </div>
                      <span className={cn('chip shrink-0', overdue ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' : 'bg-surface-2 text-muted')}>
                        {dueLabel(t.dueDate)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Recent activity */}
        <Card className="p-5">
          <SectionHeader title="Recent Activity" />
          {activity.length === 0 ? (
            <EmptyState icon={Clock} title="No activity yet" />
          ) : (
            <ul className="space-y-3.5">
              {activity.slice(0, 7).map((a) => {
                const Icon = ACTIVITY_ICON[a.type] || ListChecks
                return (
                  <li key={a.id} className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-fg">
                        <span className="capitalize text-muted">{a.action}</span> {a.entity}
                      </p>
                      <p className="text-xs text-muted/80">{relativeTime(a.at)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Upcoming reminders */}
        <Card className="p-5 lg:col-span-2">
          <SectionHeader
            title="Upcoming Reminders"
            count={upcomingReminders.length}
            action={
              <Link to="/tasks" className="text-xs font-semibold text-accent-600 hover:underline">
                All tasks
              </Link>
            }
          />
          {upcomingReminders.length === 0 ? (
            <EmptyState icon={Bell} title="No reminders scheduled" description="Set a reminder on a task to get notified before it's due." />
          ) : (
            <ul className="divide-y divide-border">
              {upcomingReminders.map(({ t, fire }) => (
                <li key={t.id}>
                  <button
                    onClick={() => open('task', { record: t })}
                    className="-mx-2 flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-surface-2/60"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-500/10 text-accent-600 dark:text-accent-400">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-fg">{t.title}</p>
                      <p className="truncate text-xs text-muted">
                        {clientById[t.clientId]?.company || 'Internal'} · due {dueLabel(t.dueDate)}
                      </p>
                    </div>
                    <span className="chip shrink-0 bg-accent-500/10 text-accent-600 dark:text-accent-300">{relativeTime(fire)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Tasks by status */}
        <Card className="p-5">
          <SectionHeader title="Tasks by Status" />
          <div className="flex items-center gap-2">
            <ResponsiveContainer width="55%" height={170}>
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={42} outerRadius={68} paddingAngle={2} stroke="none">
                  {statusData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,.12)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-2">
              {statusData.map((d) => (
                <li key={d.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="font-semibold text-fg">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Tasks by priority */}
        <Card className="p-5">
          <SectionHeader title="Open Tasks by Priority" />
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={priorityData} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgb(var(--surface-2))' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,.12)', fontSize: 12 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {priorityData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent uploads */}
        <Card className="p-5">
          <SectionHeader
            title="Recent Uploads"
            action={
              <Link to="/files" className="text-xs font-semibold text-accent-600 hover:underline">
                File Center
              </Link>
            }
          />
          {recentUploads.length === 0 ? (
            <EmptyState icon={UploadCloud} title="No files yet" description="Upload your first asset." action={<button onClick={() => open('file')} className="btn-primary">Upload file</button>} />
          ) : (
            <ul className="space-y-2.5">
              {recentUploads.map((f) => (
                <li key={f.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{f.name}</p>
                    <p className="text-xs text-muted">
                      {(f.kind || fileKind(f.mime, f.name))} · {fmtBytes(f.size)} · {relativeTime(f.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
