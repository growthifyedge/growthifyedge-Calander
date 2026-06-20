import {
  format,
  formatDistanceToNow,
  isToday,
  isPast,
  isThisWeek,
  parseISO,
  differenceInCalendarDays,
} from 'date-fns'
import { clsx } from 'clsx'

export const cn = (...args) => clsx(...args)

// ── IDs ──────────────────────────────────────────────────────────────────────
export const uid = (prefix = 'id') => {
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + performance.now().toString(36).replace('.', '')
  return `${prefix}_${rand}`
}

export const nowISO = () => new Date().toISOString()

// ── Dates ────────────────────────────────────────────────────────────────────
export const toDate = (d) => {
  if (!d) return null
  if (d instanceof Date) return d
  try {
    return typeof d === 'string' ? parseISO(d) : new Date(d)
  } catch {
    return null
  }
}

export const fmtDate = (d, f = 'MMM d, yyyy') => {
  const dt = toDate(d)
  return dt ? format(dt, f) : '—'
}

export const fmtDateTime = (d) => fmtDate(d, "MMM d, yyyy · h:mm a")

export const fmtTime = (d) => fmtDate(d, 'h:mm a')

export const relativeTime = (d) => {
  const dt = toDate(d)
  return dt ? formatDistanceToNow(dt, { addSuffix: true }) : ''
}

export const isOverdue = (task) => {
  if (!task?.dueDate || task.status === 'done') return false
  const dt = toDate(task.dueDate)
  return dt && isPast(dt) && !isToday(dt)
}

export const isDueToday = (d) => {
  const dt = toDate(d)
  return dt ? isToday(dt) : false
}

// Effective time a task's reminder should fire (Date), or null if no reminder.
const REMINDER_OFFSETS = { at_due: 0, '15m': 15, '30m': 30, '1h': 60, '1d': 1440 }
export const reminderFireTime = (task) => {
  if (!task || !task.reminder || task.reminder === 'none') return null
  if (task.reminder === 'custom') return task.reminderCustomAt ? toDate(task.reminderCustomAt) : null
  if (!task.dueDate) return null
  const off = REMINDER_OFFSETS[task.reminder]
  if (off == null) return null
  const due = toDate(task.dueDate)
  return due ? new Date(due.getTime() - off * 60000) : null
}

export const isDueThisWeek = (d) => {
  const dt = toDate(d)
  return dt ? isThisWeek(dt, { weekStartsOn: 1 }) : false
}

export const daysUntil = (d) => {
  const dt = toDate(d)
  return dt ? differenceInCalendarDays(dt, new Date()) : null
}

export const dueLabel = (d) => {
  const dt = toDate(d)
  if (!dt) return 'No due date'
  const diff = differenceInCalendarDays(dt, new Date())
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff <= 7) return `In ${diff} days`
  return fmtDate(dt)
}

// For <input type="date"> / "datetime-local"
export const toDateInput = (d) => {
  const dt = toDate(d)
  if (!dt) return ''
  const off = dt.getTimezoneOffset()
  const local = new Date(dt.getTime() - off * 60000)
  return local.toISOString().slice(0, 10)
}
export const toDateTimeInput = (d) => {
  const dt = toDate(d)
  if (!dt) return ''
  const off = dt.getTimezoneOffset()
  const local = new Date(dt.getTime() - off * 60000)
  return local.toISOString().slice(0, 16)
}

// ── Misc ─────────────────────────────────────────────────────────────────────
export const fmtBytes = (bytes = 0) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '?'

export const fileKind = (mime = '', name = '') => {
  const m = mime.toLowerCase()
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (m.startsWith('image/')) return 'image'
  if (m.startsWith('video/')) return 'video'
  if (m === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (['doc', 'docx', 'txt', 'rtf', 'md', 'csv', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext))
    return 'document'
  return 'file'
}

export const truncate = (s = '', n = 80) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

// Deterministic colour from a string (for client avatars)
export const colorFromString = (str = '') => {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  const hue = Math.abs(h) % 360
  return `hsl(${hue} 65% 55%)`
}

export const sum = (arr, fn = (x) => x) => arr.reduce((a, b) => a + fn(b), 0)

export const groupBy = (arr, keyFn) =>
  arr.reduce((acc, item) => {
    const k = keyFn(item)
    ;(acc[k] = acc[k] || []).push(item)
    return acc
  }, {})

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
