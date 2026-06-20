import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '../lib/utils'

export default function PageHeader({ title, subtitle, actions, back, className }) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="min-w-0">
        {back && (
          <Link to={back.to} className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-accent-600">
            <ChevronLeft className="h-3.5 w-3.5" />
            {back.label}
          </Link>
        )}
        <h1 className="truncate text-2xl font-extrabold tracking-tight text-fg">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
