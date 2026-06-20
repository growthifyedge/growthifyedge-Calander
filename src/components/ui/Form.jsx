import { useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

export function Field({ label, hint, error, children, className, required }) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="label">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted/80">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-500">{error}</span>}
    </label>
  )
}

export const Input = ({ className, ...rest }) => <input className={cn('input', className)} {...rest} />

export const Textarea = ({ className, rows = 3, ...rest }) => (
  <textarea rows={rows} className={cn('input resize-y', className)} {...rest} />
)

export function Select({ className, children, ...rest }) {
  return (
    <select className={cn('input cursor-pointer appearance-none pr-9', className)} {...rest}>
      {children}
    </select>
  )
}

export function Checkbox({ checked = false, indeterminate = false, onChange, className, ...rest }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate)
  }, [indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={cn(
        'h-[18px] w-[18px] shrink-0 cursor-pointer rounded-[5px] border-2 border-border bg-surface accent-[rgb(var(--accent-600))] transition focus:outline-none focus:ring-4 focus:ring-accent-500/20',
        className,
      )}
      {...rest}
    />
  )
}

export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3"
    >
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition',
          checked ? 'bg-accent-600' : 'bg-surface-2 border border-border',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </span>
      {label && <span className="text-sm font-medium text-fg">{label}</span>}
    </button>
  )
}
