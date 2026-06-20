import { useMemo, useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  addWeeks,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  set,
} from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { TASK_PRIORITIES, statusMeta } from '../../lib/constants'
import { toDate, cn } from '../../lib/utils'

const VIEWS = ['Month', 'Week', 'Day']

export default function CalendarView({ tasks = [], meetings = [], onTaskClick, onMeetingClick, onReschedule, showMeetings = true }) {
  const [view, setView] = useState('Month')
  const [cursor, setCursor] = useState(() => new Date())
  const [dragId, setDragId] = useState(null)

  const events = useMemo(() => {
    const t = tasks
      .filter((x) => x.dueDate)
      .map((x) => ({
        id: x.id,
        kind: 'task',
        title: x.title,
        date: toDate(x.dueDate),
        color: statusMeta(TASK_PRIORITIES, x.priority).dot,
        done: x.status === 'done',
        raw: x,
      }))
    const m = showMeetings
      ? meetings.filter((x) => x.date).map((x) => ({ id: x.id, kind: 'meeting', title: x.title, date: toDate(x.date), color: '#6366f1', raw: x }))
      : []
    return [...t, ...m]
  }, [tasks, meetings, showMeetings])

  const eventsOn = (day) => events.filter((e) => isSameDay(e.date, day)).sort((a, b) => a.date - b.date)

  const move = (dir) => {
    if (view === 'Month') setCursor((c) => addMonths(c, dir))
    else if (view === 'Week') setCursor((c) => addWeeks(c, dir))
    else setCursor((c) => addDays(c, dir))
  }

  const handleDrop = (day) => {
    if (!dragId) return
    const ev = events.find((e) => e.id === dragId && e.kind === 'task')
    if (ev) {
      const orig = ev.date
      const next = set(day, { hours: orig.getHours(), minutes: orig.getMinutes() })
      onReschedule?.(dragId, next.toISOString())
    }
    setDragId(null)
  }

  const EventChip = ({ e, withTime }) => (
    <button
      draggable={e.kind === 'task'}
      onDragStart={() => e.kind === 'task' && setDragId(e.id)}
      onClick={(ev) => {
        ev.stopPropagation()
        e.kind === 'task' ? onTaskClick?.(e.raw) : onMeetingClick?.(e.raw)
      }}
      className={cn(
        'flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium transition hover:opacity-80',
        e.kind === 'meeting' ? 'bg-accent-500/15 text-accent-700 dark:text-accent-300' : 'bg-surface-2 text-fg',
        e.done && 'opacity-50 line-through',
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: e.color }} />
      {withTime && <span className="shrink-0 text-muted">{format(e.date, 'HH:mm')}</span>}
      <span className="truncate">{e.title}</span>
    </button>
  )

  // ── Month ──────────────────────────────────────────────────────────────────
  const renderMonth = () => {
    const days = eachDayOfInterval({
      start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
    })
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="grid grid-cols-7 border-b border-border bg-surface-2/40">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-muted">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = eventsOn(day)
            const inMonth = isSameMonth(day, cursor)
            return (
              <div
                key={day.toISOString()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(day)}
                className={cn(
                  'min-h-[96px] border-b border-r border-border p-1.5 transition last:border-r-0',
                  !inMonth && 'bg-surface-2/30',
                )}
              >
                <div className="mb-1 flex justify-end">
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                      isToday(day) ? 'bg-accent-600 text-white' : inMonth ? 'text-fg' : 'text-muted/50',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((e) => (
                    <EventChip key={e.kind + e.id} e={e} />
                  ))}
                  {dayEvents.length > 3 && <div className="px-1.5 text-[10px] font-medium text-muted">+{dayEvents.length - 3} more</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Week ────────────────────────────────────────────────────────────────────
  const renderWeek = () => {
    const days = eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(cursor, { weekStartsOn: 1 }) })
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
        {days.map((day) => {
          const dayEvents = eventsOn(day)
          return (
            <div
              key={day.toISOString()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(day)}
              className="flex min-h-[140px] flex-col rounded-2xl border border-border bg-surface p-2"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{format(day, 'EEE')}</span>
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold', isToday(day) ? 'bg-accent-600 text-white' : 'text-fg')}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="flex-1 space-y-1">
                {dayEvents.length === 0 ? <div className="px-1 text-[11px] text-muted/60">—</div> : dayEvents.map((e) => <EventChip key={e.kind + e.id} e={e} withTime />)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Day ──────────────────────────────────────────────────────────────────────
  const renderDay = () => {
    const dayEvents = eventsOn(cursor)
    return (
      <div className="rounded-2xl border border-border bg-surface p-4">
        {dayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted">
            <CalendarDays className="mb-2 h-8 w-8" />
            <p className="text-sm font-medium">Nothing scheduled for {format(cursor, 'EEEE, MMM d')}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {dayEvents.map((e) => (
              <li key={e.kind + e.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <span className="w-14 shrink-0 text-sm font-semibold text-muted">{format(e.date, 'HH:mm')}</span>
                <span className="h-8 w-1 rounded-full" style={{ background: e.color }} />
                <button onClick={() => (e.kind === 'task' ? onTaskClick?.(e.raw) : onMeetingClick?.(e.raw))} className="flex-1 text-left">
                  <p className={cn('text-sm font-semibold text-fg', e.done && 'text-muted line-through')}>{e.title}</p>
                  <p className="text-xs capitalize text-muted">{e.kind}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const headerLabel = view === 'Day' ? format(cursor, 'EEEE, MMMM d, yyyy') : format(cursor, 'MMMM yyyy')

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => move(-1)} className="rounded-lg border border-border p-2 text-muted hover:bg-surface-2 hover:text-fg">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => move(1)} className="rounded-lg border border-border p-2 text-muted hover:bg-surface-2 hover:text-fg">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={() => setCursor(new Date())} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-fg hover:bg-surface-2">
            Today
          </button>
          <h2 className="ml-2 text-base font-bold text-fg">{headerLabel}</h2>
        </div>
        <div className="inline-flex rounded-xl border border-border bg-surface-2/50 p-1">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition', view === v ? 'bg-surface text-fg shadow-soft' : 'text-muted hover:text-fg')}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'Month' && renderMonth()}
      {view === 'Week' && renderWeek()}
      {view === 'Day' && renderDay()}

      <p className="mt-3 text-center text-xs text-muted">Tip: drag a task to another day to reschedule it.</p>
    </div>
  )
}
