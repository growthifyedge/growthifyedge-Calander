import { useData } from '../context/DataContext'
import { useQuickAdd } from '../context/QuickAddContext'
import PageHeader from '../components/PageHeader'
import { Button } from '../components/ui'
import CalendarView from '../components/calendar/CalendarView'
import { Plus } from 'lucide-react'

export default function Calendar() {
  const { tasks, meetings, update } = useData()
  const { open } = useQuickAdd()

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Tasks, deadlines and meetings — drag to reschedule."
        actions={
          <Button onClick={() => open('task')}>
            <Plus className="h-4 w-4" /> New Task
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Low</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Medium</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> High</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Urgent</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent-500" /> Meeting</span>
      </div>
      <CalendarView
        tasks={tasks}
        meetings={meetings}
        onTaskClick={(t) => open('task', { record: t })}
        onMeetingClick={(m) => open('meeting', { record: m })}
        onReschedule={(id, date) => update('tasks', id, { dueDate: date })}
      />
    </div>
  )
}
