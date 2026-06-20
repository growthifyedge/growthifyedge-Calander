import { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { uid } from '../lib/utils'

const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}
const COLORS = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-accent-500',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback(
    (message, type = 'success', ttl = 3200) => {
      const id = uid('toast')
      setToasts((t) => [...t, { id, message, type }])
      if (ttl) setTimeout(() => dismiss(id), ttl)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type] || Info
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="card flex items-start gap-3 p-3.5 shadow-pop"
              >
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${COLORS[t.type] || ''}`} />
                <p className="flex-1 text-sm font-medium text-fg">{t.message}</p>
                <button onClick={() => dismiss(t.id)} className="text-muted hover:text-fg">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
