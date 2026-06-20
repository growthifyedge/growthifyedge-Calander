import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn, initials, colorFromString } from '../../lib/utils'

// ── Buttons ────────────────────────────────────────────────────────────────
export function Button({ variant = 'primary', className, children, as: As = 'button', ...rest }) {
  const variants = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
    subtle: 'btn-subtle',
    danger:
      'btn bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/30',
  }
  return (
    <As className={cn(variants[variant], className)} {...rest}>
      {children}
    </As>
  )
}

export function IconButton({ className, children, label, ...rest }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({ className, children, hover = false, ...rest }) {
  return (
    <div className={cn('card', hover && 'transition hover:shadow-card hover:-translate-y-0.5', className)} {...rest}>
      {children}
    </div>
  )
}

// ── Stat card (dashboard) ───────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, tone = 'accent', sub, onClick }) {
  const tones = {
    accent: 'bg-accent-500/10 text-accent-600 dark:text-accent-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  }
  return (
    <motion.button
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className="card flex items-center gap-4 p-4 text-left"
    >
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
        {Icon && <Icon className="h-5 w-5" />}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-none text-fg">{value}</div>
        <div className="mt-1 truncate text-xs font-medium text-muted">{label}</div>
        {sub && <div className="mt-0.5 text-[11px] text-muted/80">{sub}</div>}
      </div>
    </motion.button>
  )
}

// ── Progress bar ────────────────────────────────────────────────────────────
export function ProgressBar({ value = 0, className, showLabel = false, tone = 'accent' }) {
  const v = Math.max(0, Math.min(100, value))
  const tones = { accent: 'bg-accent-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500' }
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div className={cn('h-full rounded-full transition-all duration-500', tones[tone])} style={{ width: `${v}%` }} />
      </div>
      {showLabel && <span className="w-9 text-right text-xs font-semibold text-muted">{v}%</span>}
    </div>
  )
}

// ── Avatar ──────────────────────────────────────────────────────────────────
export function Avatar({ name = '', size = 36, className }) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: colorFromString(name) }}
    >
      {initials(name)}
    </span>
  )
}

// ── Empty state ─────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-muted">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ── Spinner / full-page loader ──────────────────────────────────────────────
export const Spinner = ({ className }) => <Loader2 className={cn('h-5 w-5 animate-spin', className)} />

export function PageLoader({ label = 'Loading your workspace…' }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-bg text-muted">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-600 text-white shadow-pop">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

// ── Section header ──────────────────────────────────────────────────────────
export function SectionHeader({ title, count, action, className }) {
  return (
    <div className={cn('mb-3 flex items-center justify-between', className)}>
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
        {title}
        {count != null && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">{count}</span>
        )}
      </h2>
      {action}
    </div>
  )
}
