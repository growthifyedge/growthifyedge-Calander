import { cn } from '../../lib/utils'

export function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-border no-scrollbar', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'relative whitespace-nowrap px-4 py-2.5 text-sm font-semibold transition',
            active === t.id ? 'text-accent-600 dark:text-accent-400' : 'text-muted hover:text-fg',
          )}
        >
          <span className="flex items-center gap-1.5">
            {t.label}
            {t.count != null && (
              <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', active === t.id ? 'bg-accent-500/15 text-accent-600' : 'bg-surface-2 text-muted')}>
                {t.count}
              </span>
            )}
          </span>
          {active === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent-600" />}
        </button>
      ))}
    </div>
  )
}
