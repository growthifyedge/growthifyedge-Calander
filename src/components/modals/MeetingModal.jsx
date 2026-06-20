import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui'
import { Field, Input, Textarea, Select } from '../ui/Form'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { toDateTimeInput, uid } from '../../lib/utils'

const blank = (i = {}) => ({ title: '', clientId: '', date: '', notes: '', decisions: '', actionItems: [], ...i })

export default function MeetingModal({ open, onClose, record, initial }) {
  const { clients, create, update } = useData()
  const { toast } = useToast()
  const [form, setForm] = useState(blank())
  const [newItem, setNewItem] = useState('')
  const isEdit = Boolean(record)

  useEffect(() => {
    if (!open) return
    setForm(
      record
        ? blank({ ...record, date: toDateTimeInput(record.date) })
        : blank({ ...initial, date: toDateTimeInput(initial?.date || new Date()) }),
    )
    setNewItem('')
  }, [open, record, initial])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const addItem = () => {
    if (!newItem.trim()) return
    setForm((f) => ({ ...f, actionItems: [...f.actionItems, { id: uid('ai'), text: newItem.trim(), done: false, taskId: null }] }))
    setNewItem('')
  }

  const save = async () => {
    if (!form.title.trim()) return toast('Meeting title is required', 'error')
    const payload = {
      ...form,
      date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
      clientId: form.clientId || null,
    }
    if (isEdit) await update('meetings', record.id, payload)
    else await create('meetings', payload)
    toast(isEdit ? 'Meeting updated' : 'Meeting note saved')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit meeting note' : 'New meeting note'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{isEdit ? 'Save changes' : 'Save note'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Meeting title" required>
          <Input value={form.title} onChange={set('title')} placeholder="e.g. Lumen — Q3 strategy kickoff" autoFocus />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Client">
            <Select value={form.clientId} onChange={set('clientId')}>
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date & time">
            <Input type="datetime-local" value={form.date} onChange={set('date')} />
          </Field>
        </div>
        <Field label="Notes">
          <Textarea value={form.notes} onChange={set('notes')} rows={4} placeholder="Discussion summary…" />
        </Field>
        <Field label="Decisions">
          <Textarea value={form.decisions} onChange={set('decisions')} rows={2} placeholder="What was decided…" />
        </Field>

        <div>
          <span className="label">Action items</span>
          <div className="space-y-2">
            {form.actionItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                <span className="flex-1 text-fg">{item.text}</span>
                {item.taskId && <span className="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Task</span>}
                <button
                  onClick={() => setForm((f) => ({ ...f, actionItems: f.actionItems.filter((x) => x.id !== item.id) }))}
                  className="text-muted hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
                placeholder="Add an action item…"
              />
              <Button variant="ghost" onClick={addItem} className="shrink-0 px-3">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
