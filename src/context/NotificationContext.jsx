import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useData } from './DataContext'
import { reminderFireTime, toDate, fmtDateTime } from '../lib/utils'

const NotificationContext = createContext(null)
export const useNotifications = () => useContext(NotificationContext)

const KEY_FIRED = 'ge_fired_notifs'
const KEY_ENABLED = 'ge_notif_enabled'
const KEY_ASKED = 'ge_notif_asked'
const POLL_MS = 30000
const ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%236366f1'/%3E%3Cpath d='M9 21V11l7 6 7-6v10' stroke='white' stroke-width='2.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"

const supported = typeof window !== 'undefined' && 'Notification' in window

export function NotificationProvider({ children }) {
  const { tasks, clientById } = useData()
  const [permission, setPermission] = useState(supported ? Notification.permission : 'unsupported')
  const [enabled, setEnabled] = useState(() => localStorage.getItem(KEY_ENABLED) !== 'false')

  const firedRef = useRef(new Set(JSON.parse(localStorage.getItem(KEY_FIRED) || '[]')))
  const lastCheckRef = useRef(Date.now())

  const persistFired = () => {
    let arr = [...firedRef.current]
    if (arr.length > 600) arr = arr.slice(-400) // prune
    firedRef.current = new Set(arr)
    localStorage.setItem(KEY_FIRED, JSON.stringify(arr))
  }

  const requestPermission = useCallback(async () => {
    if (!supported) return 'unsupported'
    try {
      const p = await Notification.requestPermission()
      setPermission(p)
      return p
    } catch {
      return Notification.permission
    }
  }, [])

  const setEnabledPersist = useCallback((v) => {
    setEnabled(v)
    localStorage.setItem(KEY_ENABLED, v ? 'true' : 'false')
  }, [])

  const show = useCallback((title, body, tag) => {
    if (!supported || Notification.permission !== 'granted') return false
    try {
      new Notification(title, { body, tag, icon: ICON, badge: ICON })
      return true
    } catch {
      return false
    }
  }, [])

  // Manual "test notification" used from Settings
  const sendTest = useCallback(() => show('GrowthifyEdge OS Reminder', 'Notifications are working ✓\nYou\'ll be reminded about your tasks here.', 'ge-test'), [show])

  // Request permission once on first launch
  useEffect(() => {
    if (!supported) return
    if (Notification.permission === 'default' && !localStorage.getItem(KEY_ASKED)) {
      localStorage.setItem(KEY_ASKED, '1')
      Notification.requestPermission().then(setPermission).catch(() => {})
    }
  }, [])

  // Scheduler: poll for tasks crossing their reminder / due / overdue moments.
  useEffect(() => {
    if (!supported) return

    const fireOnce = (key, title, body) => {
      if (firedRef.current.has(key)) return
      firedRef.current.add(key)
      persistFired()
      show(title, body, key)
    }
    const crossed = (time, since, now) => time != null && time > since && time <= now

    const check = () => {
      const now = Date.now()
      const since = lastCheckRef.current
      if (!enabled || Notification.permission !== 'granted') {
        lastCheckRef.current = now
        return
      }
      for (const t of tasks) {
        if (t.status === 'done' || !t.dueDate) continue
        const due = toDate(t.dueDate)?.getTime()
        if (!due) continue
        const client = clientById[t.clientId]?.company || 'Internal'
        const body = `${t.title}\n${client}\nDue ${fmtDateTime(t.dueDate)}`

        const rt = reminderFireTime(t)?.getTime()
        if (crossed(rt, since, now)) fireOnce(`${t.id}|reminder|${rt}`, 'GrowthifyEdge OS Reminder', body)
        if (crossed(due, since, now)) fireOnce(`${t.id}|due|${due}`, '⏰ Task due now', body)
        // Overdue fires a minute after the due moment so it is distinct from "due".
        if (crossed(due + 60000, since, now)) fireOnce(`${t.id}|overdue|${due}`, '⚠️ Task overdue', body)
      }
      lastCheckRef.current = now
    }

    check()
    const id = setInterval(check, POLL_MS)

    // Dev-only test seam (stripped from production builds).
    if (import.meta.env.DEV) {
      window.__geNotif = { check, setLastCheck: (t) => (lastCheckRef.current = t) }
    }
    return () => clearInterval(id)
  }, [tasks, clientById, enabled, show])

  const value = {
    supported,
    permission,
    enabled,
    requestPermission,
    setEnabled: setEnabledPersist,
    sendTest,
  }
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
