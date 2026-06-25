import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  CheckSquare,
  Inbox,
  CalendarDays,
  Users,
  FolderKanban,
  FolderOpen,
  BadgeCheck,
  NotebookPen,
  BarChart3,
  Settings,
  X,
  Cloud,
  HardDrive,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { getDataSource } from '../lib/db'

const SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/tasks', label: 'Tasks', icon: CheckSquare },
      { to: '/capture', label: 'Quick Task Intake', icon: Inbox },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'Clients & Work',
    items: [
      { to: '/clients', label: 'Clients', icon: Users },
      { to: '/projects', label: 'Projects', icon: FolderKanban },
      { to: '/files', label: 'File Center', icon: FolderOpen },
      { to: '/approvals', label: 'Approvals', icon: BadgeCheck },
      { to: '/meetings', label: 'Meeting Notes', icon: NotebookPen },
    ],
  },
  {
    label: 'Insights',
    items: [{ to: '/reports', label: 'Reports', icon: BarChart3 }],
  },
]

function NavItem({ item, onNavigate }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
          isActive ? 'text-accent-700 dark:text-white' : 'text-muted hover:bg-surface-2 hover:text-fg',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-active"
              className="absolute inset-0 -z-10 rounded-xl bg-accent-500/12 dark:bg-accent-500/20"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-accent-600 dark:text-accent-400')} />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ mobileOpen, onClose }) {
  const source = getDataSource()

  const content = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-600 text-white shadow-sm shadow-accent-600/40">
            <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
              <path d="M9 21V11l7 6 7-6v10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-tight text-fg">GrowthifyEdge</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-accent-600 dark:text-accent-400">Agency OS</div>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-6 flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted/70">{section.label}</div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.to} item={item} onNavigate={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-1 border-t border-border p-3">
        <NavItem item={{ to: '/settings', label: 'Settings', icon: Settings }} onNavigate={onClose} />
        <div className="flex items-center gap-2 px-3 pt-1 text-[11px] font-medium text-muted">
          {source === 'supabase' ? <Cloud className="h-3.5 w-3.5" /> : <HardDrive className="h-3.5 w-3.5" />}
          {source === 'supabase' ? 'Cloud sync · Supabase' : 'Local · saved on this device'}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">{content}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="absolute left-0 top-0 h-full w-72 border-r border-border bg-surface shadow-pop"
          >
            {content}
          </motion.aside>
        </div>
      )}
    </>
  )
}
