import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button, ProgressBar } from '../ui'
import { Field, Input, Textarea, Select } from '../ui/Form'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { PROJECT_STATUSES } from '../../lib/constants'
import { toDateInput } from '../../lib/utils'

const blank = (i = {}) => ({
  name: '',
  clientId: '',
  description: '',
  status: 'planning',
  dueDate: '',
  progress: 0,
  ...i,
})

export default function ProjectModal({ open, onClose, record, initial }) {
  const { clients, create, update } = useData()
  const { toast } = useToast()
  const [form, setForm] = useState(blank())
  const isEdit = Boolean(record)

  useEffect(() => {
    if (!open) return
    setForm(
      record
        ? blank({ ...record, dueDate: toDateInput(record.dueDate) })
        : blank({ ...initial, dueDate: initial?.dueDate ? toDateInput(initial.dueDate) : '' }),
    )
  }, [open, record, initial])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    if (!form.name.trim()) return toast('Project name is required', 'error')
    const payload = {
      ...form,
      progress: Number(form.progress) || 0,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      clientId: form.clientId || null,
    }
    if (isEdit) await update('projects', record.id, payload)
    else await create('projects', payload)
    toast(isEdit ? 'Project updated' : 'Project created')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit project' : 'New project'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{isEdit ? 'Save changes' : 'Create project'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Project name" required>
          <Input value={form.name} onChange={set('name')} placeholder="e.g. Q3 Instagram Content" autoFocus />
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
          <Field label="Status">
            <Select value={form.status} onChange={set('status')}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Description">
          <Textarea value={form.description} onChange={set('description')} placeholder="Scope and goals…" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Due date">
            <Input type="date" value={form.dueDate} onChange={set('dueDate')} />
          </Field>
          <Field label={`Progress — ${form.progress}%`}>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={form.progress}
              onChange={set('progress')}
              className="mt-2 w-full accent-[rgb(var(--accent-600))]"
            />
            <ProgressBar value={Number(form.progress)} className="mt-2" />
          </Field>
        </div>
      </div>
    </Modal>
  )
}
