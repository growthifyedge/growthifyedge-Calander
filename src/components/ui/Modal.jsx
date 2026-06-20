import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './index'

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={cn(
              'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-pop sm:rounded-2xl',
              sizes[size],
            )}
          >
            {(title || onClose) && (
              <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div>
                  {title && <h2 className="text-lg font-bold text-fg">{title}</h2>}
                  {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="-mr-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-border bg-surface-2/50 px-5 py-3.5">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Delete', danger = true }) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex gap-4">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
            danger ? 'bg-red-500/10 text-red-500' : 'bg-accent-500/10 text-accent-500',
          )}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-fg">{title}</h3>
          {message && <p className="mt-1 text-sm text-muted">{message}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant={danger ? 'danger' : 'primary'}
              onClick={() => {
                onConfirm?.()
                onClose?.()
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
