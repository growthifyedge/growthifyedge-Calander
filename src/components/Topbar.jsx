import { useMemo, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  Plus,
  Sun,
  Moon,
  CheckSquare,
  Users,
  FolderKanban,
  UploadCloud,
  NotebookPen,
  BadgeCheck,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { useData } from '../context/DataContext'
import { useQuickAdd } from '../context/QuickAddContext'
import { Avatar } from './ui'
import { cn, truncate } from '../lib/utils'

const QUICK_ACTIONS = [
  { type: 'task', label: 'Add Task', icon: CheckSquare },
  { type: 'client', label: 'Add Client', icon: Users },
  { type: 'project', label: 'Add Project', icon: FolderKanban },
  { type: 'file', label: 'Upload File', icon: UploadCloud },
  { type: 'approval', label: 'Add Approval', icon: BadgeCheck },
  { type: 'meeting', label: 'Add Meeting Note', icon: NotebookPen },
]

export default function Topbar({ onMenu }) {
  const { theme, toggleTheme } = useTheme()
  const { tasks, clients, projects, meetings, settings } = useData()
  const { open } = useQuickAdd()
  const navigate = useNavigate()

  const [q, setQ] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const searchRef = useRef(null)
  const addRef = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false)
      if (addRef.current && !addRef.current.contains(e.target)) setShowAdd(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return []
    const match = (s) => s?.toLowerCase().includes(term)
    return [
      ...tasks.filter((t) => match(t.title)).slice(0, 5).map((t) => ({ kind: 'Task', label: t.title, onPick: () => open('task', { record: t }) })),
      ...clients.filter((c) => match(c.company)).slice(0, 4).map((c) => ({ kind: 'Client', label: c.company, onPick: () => navigate(`/clients/${c.id}`) })),
      ...projects.filter((p) => match(p.name)).slice(0, 4).map((p) => ({ kind: 'Project', label: p.name, onPick: () => navigate(`/projects/${p.id}`) })),
      ...meetings.filter((m) => match(m.title)).slice(0, 3).map((m) => ({ kind: 'Meeting', label: m.title, onPick: () => navigate('/meetings') })),
    ].slice(0, 9)
  }, [q, tasks, clients, projects, meetings, open, navigate])

  const pick = (r) => {
    r.onPick()
    setQ('')
    setShowResults(false)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-md lg:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-muted hover:bg-surface-2 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div ref={searchRef} className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search tasks, clients, projects…"
          className="h-10 w-full rounded-xl border border-border bg-surface-2/60 pl-9 pr-3 text-sm text-fg placeholder:text-muted/70 outline-none transition focus:border-accent-400 focus:bg-surface focus:ring-4 focus:ring-accent-500/10"
        />
        <AnimatePresence>
          {showResults && q.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-xl border border-border bg-surface shadow-pop"
            >
              {results.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted">No matches for “{truncate(q, 30)}”</div>
              ) : (
                <ul className="max-h-80 overflow-y-auto py-1.5">
                  {results.map((r, i) => (
                    <li key={i}>
                      <button
                        onClick={() => pick(r)}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-surface-2"
                      >
                        <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted">{r.kind}</span>
                        <span className="flex-1 truncate text-fg">{r.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Quick add */}
        <div ref={addRef} className="relative">
          <button onClick={() => setShowAdd((s) => !s)} className="btn-primary h-10 px-3 sm:px-4">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </button>
          <AnimatePresence>
            {showAdd && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                className="absolute right-0 top-12 z-40 w-52 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-pop"
              >
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.type}
                    onClick={() => {
                      open(a.type)
                      setShowAdd(false)
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-fg hover:bg-surface-2"
                  >
                    <a.icon className="h-4 w-4 text-muted" />
                    {a.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={toggleTheme} className={cn('inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg')} title="Toggle theme">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <button onClick={() => navigate('/settings')} className="ml-0.5" title="Profile & settings">
          <Avatar name={settings.profile?.name || 'GE'} size={36} />
        </button>
      </div>
    </header>
  )
}
