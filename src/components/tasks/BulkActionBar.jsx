import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, Tag, Trash2, X } from 'lucide-react'
import { Button } from '../ui'
import { Input } from '../ui/Form'
import { TASK_STATUSES, TASK_PRIORITIES } from '../../lib/constants'

// Floating toolbar shown when one or more tasks are selected.
// Purely presentational — all mutations are handled by the parent via callbacks.
export default function BulkActionBar({ count, onStatus, onPriority, onDueDate, onAddTags, onDelete, onClear }) {
  const [panel, setPanel] = useState(null) // 'due' | 'tags' | null
  const [dueVal, setDueVal] = useState('')
  const [tagVal, setTagVal] = useState('')

  const togglePanel = (p) => setPanel((cur) => (cur === p ? null : p))

  const applyDue = (clear) => {
    onDueDate(clear || !dueVal ? null : new Date(dueVal).toISOString())
    setPanel(null)
    setDueVal('')
  }
  const applyTags = () => {
    const arr = [...new Set(tagVal.split(',').map((s) => s.trim()).filter(Boolean))]
    if (arr.length) onAddTags(arr)
    setTagVal('')
    setPanel(null)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="pointer-events-auto w-full max-w-3xl"
      >
        <div className="card flex items-center gap-2 p-2 shadow-pop">
        <span className="chip shrink-0 bg-accent-600 px-3 py-1.5 text-white">{count} selected</span>

        <div className="flex flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
          {/* Status */}
          <select
            value=""
            onChange={(e) => e.target.value && onStatus(e.target.value)}
            className="input h-9 w-auto shrink-0 cursor-pointer py-0 text-sm"
            aria-label="Set status"
          >
            <option value="">Set status…</option>
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Priority */}
          <select
            value=""
            onChange={(e) => e.target.value && onPriority(e.target.value)}
            className="input h-9 w-auto shrink-0 cursor-pointer py-0 text-sm"
            aria-label="Set priority"
          >
            <option value="">Set priority…</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          {/* Due date */}
          <div className="relative shrink-0">
            <button onClick={() => togglePanel('due')} className={`btn-ghost h-9 ${panel === 'due' ? 'border-accent-400 text-accent-600' : ''}`}>
              <CalendarClock className="h-4 w-4" />
              <span className="hidden sm:inline">Due date</span>
            </button>
            {panel === 'due' && (
              <div className="absolute bottom-full right-0 z-10 mb-2 w-64 rounded-xl border border-border bg-surface p-3 shadow-pop">
                <span className="label">Set due date for {count} task{count > 1 ? 's' : ''}</span>
                <Input type="datetime-local" value={dueVal} onChange={(e) => setDueVal(e.target.value)} />
                <div className="mt-2 flex gap-2">
                  <Button onClick={() => applyDue(false)} className="flex-1 py-2">Apply</Button>
                  <Button variant="ghost" onClick={() => applyDue(true)} className="py-2">Clear due</Button>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="relative shrink-0">
            <button onClick={() => togglePanel('tags')} className={`btn-ghost h-9 ${panel === 'tags' ? 'border-accent-400 text-accent-600' : ''}`}>
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Add tags</span>
            </button>
            {panel === 'tags' && (
              <div className="absolute bottom-full right-0 z-10 mb-2 w-64 rounded-xl border border-border bg-surface p-3 shadow-pop">
                <span className="label">Add tags to {count} task{count > 1 ? 's' : ''}</span>
                <Input
                  value={tagVal}
                  onChange={(e) => setTagVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyTags())}
                  placeholder="e.g. urgent, q3"
                  autoFocus
                />
                <div className="mt-1 text-[11px] text-muted">Separate multiple tags with commas.</div>
                <Button onClick={applyTags} className="mt-2 w-full py-2">Add tags</Button>
              </div>
            )}
          </div>
        </div>

        {/* Delete */}
        <Button variant="danger" onClick={onDelete} className="shrink-0 px-3">
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Delete</span>
        </Button>

        {/* Clear selection */}
          <button onClick={onClear} className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-fg" aria-label="Clear selection">
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
