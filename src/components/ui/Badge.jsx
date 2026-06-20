import { Bell } from 'lucide-react'
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  PROJECT_STATUSES,
  APPROVAL_STATUSES,
  REMINDER_SHORT,
  TONE,
  statusMeta,
} from '../../lib/constants'
import { cn, reminderFireTime, relativeTime } from '../../lib/utils'

export function StatusBadge({ list, value, className }) {
  const meta = statusMeta(list, value)
  return (
    <span className={cn('chip', TONE[meta.color] || TONE.slate, className)}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  )
}

export const TaskStatusBadge = ({ value, className }) => (
  <StatusBadge list={TASK_STATUSES} value={value} className={className} />
)
export const ProjectStatusBadge = ({ value, className }) => (
  <StatusBadge list={PROJECT_STATUSES} value={value} className={className} />
)
export const ApprovalStatusBadge = ({ value, className }) => (
  <StatusBadge list={APPROVAL_STATUSES} value={value} className={className} />
)

export function PriorityBadge({ value, className }) {
  const meta = statusMeta(TASK_PRIORITIES, value)
  const tone =
    { low: TONE.slate, medium: TONE.blue, high: TONE.amber, urgent: TONE.red }[value] || TONE.slate
  return (
    <span className={cn('chip', tone, className)}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  )
}

export const PriorityDot = ({ value, className }) => {
  const meta = statusMeta(TASK_PRIORITIES, value)
  return (
    <span
      className={cn('inline-block h-2.5 w-2.5 rounded-full', className)}
      style={{ background: meta.dot }}
      title={`${meta.label} priority`}
    />
  )
}

export const CategoryBadge = ({ value, className }) =>
  value ? (
    <span className={cn('chip bg-surface-2 text-muted border border-border', className)}>{value}</span>
  ) : null

// Shows a task's reminder time + status (scheduled / passed). Renders nothing
// when the task has no reminder or is already done.
export function ReminderChip({ task, withStatus = true, className }) {
  if (!task || task.status === 'done') return null
  const fire = reminderFireTime(task)
  if (!fire) return null
  const upcoming = fire.getTime() > Date.now()
  const label = REMINDER_SHORT[task.reminder] || 'Reminder'
  const status = upcoming ? relativeTime(fire) : 'passed'
  return (
    <span
      className={cn('chip', upcoming ? 'bg-accent-500/10 text-accent-600 dark:text-accent-300' : 'bg-surface-2 text-muted', className)}
      title={`Reminder ${upcoming ? 'scheduled' : 'time'}: ${fire.toLocaleString()} (${status})`}
    >
      <Bell className="h-2.5 w-2.5" />
      {label}
      {withStatus && <span className="font-normal opacity-70">· {status}</span>}
    </span>
  )
}
