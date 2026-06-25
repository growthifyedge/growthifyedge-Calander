import { useEffect, useMemo, useState } from 'react'
import { Paperclip, X, Tag, Repeat, Link2, Plus, Bell, Download } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui'
import { Field, Input, Textarea, Select } from '../ui/Form'
import FileThumb from '../files/FileThumb'
import FilePreviewModal from '../files/FilePreviewModal'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { TASK_STATUSES, TASK_PRIORITIES, TASK_CATEGORIES, RECURRENCE_OPTIONS, REMINDER_OPTIONS } from '../../lib/constants'
import { toDateTimeInput, toDateInput, fileKind, fmtBytes, uid, reminderFireTime, downloadBlob } from '../../lib/utils'
import { db } from '../../lib/db'

const blank = (initial = {}) => ({
  title: '',
  description: '',
  clientId: '',
  projectId: '',
  category: 'General',
  priority: 'medium',
  status: 'pending',
  dueDate: '',
  notes: '',
  tags: [],
  dependencies: [],
  recurrence: 'none',
  recurrenceInterval: 7,
  recurrenceUntil: '',
  reminder: 'none',
  reminderCustomAt: '',
  ...initial,
})

export default function TaskModal({ open, onClose, record, initial }) {
  const { clients, projects, tasks, files, taskById, create, update, addFile, removeFile, getFileUrl } = useData()
  const { toast } = useToast()
  const [form, setForm] = useState(blank())
  const [pending, setPending] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [depPick, setDepPick] = useState('')
  const [previewFile, setPreviewFile] = useState(null)
  const isEdit = Boolean(record)

  // Download a linked attachment (object URL locally, signed URL on Supabase).
  const downloadAttachment = async (f) => {
    try {
      const blob = await db.getBlob(f.storagePath || f.id)
      if (blob) return downloadBlob(blob, f.name)
      const url = await getFileUrl(f)
      if (url) window.open(url, '_blank')
      else toast('Could not open this file', 'error')
    } catch {
      toast('Could not open this file', 'error')
    }
  }

  useEffect(() => {
    if (!open) return
    const src = record || initial || {}
    setForm(
      blank({
        ...src,
        tags: src.tags || [],
        dependencies: src.dependencies || [],
        recurrence: src.recurrence || 'none',
        recurrenceInterval: src.recurrenceInterval || 7,
        reminder: src.reminder || 'none',
        dueDate: src.dueDate ? toDateTimeInput(src.dueDate) : '',
        recurrenceUntil: src.recurrenceUntil ? toDateInput(src.recurrenceUntil) : '',
        reminderCustomAt: src.reminderCustomAt ? toDateTimeInput(src.reminderCustomAt) : '',
      }),
    )
    setPending([])
    setTagInput('')
    setDepPick('')
  }, [open, record, initial])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const projectOptions = useMemo(() => projects.filter((p) => !form.clientId || p.clientId === form.clientId), [projects, form.clientId])
  const existingAttachments = useMemo(() => (record ? files.filter((f) => f.taskId === record.id) : []), [files, record])
  const dependencyOptions = useMemo(
    () => tasks.filter((t) => t.id !== record?.id && !form.dependencies.includes(t.id)),
    [tasks, record, form.dependencies],
  )

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) setForm((f) => ({ ...f, tags: [...f.tags, t] }))
    setTagInput('')
  }
  const addDep = (id) => {
    if (id && !form.dependencies.includes(id)) setForm((f) => ({ ...f, dependencies: [...f.dependencies, id] }))
    setDepPick('')
  }
  const onPick = (e) => {
    setPending((p) => [...p, ...Array.from(e.target.files || []).map((file) => ({ tmpId: uid('tmp'), file }))])
    e.target.value = ''
  }

  const save = async () => {
    if (!form.title.trim()) return toast('Task title is required', 'error')
    const payload = {
      ...form,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      clientId: form.clientId || null,
      projectId: form.projectId || null,
      recurrenceInterval: form.recurrence === 'custom' ? Number(form.recurrenceInterval) || 1 : null,
      recurrenceUntil: form.recurrence !== 'none' && form.recurrenceUntil ? new Date(form.recurrenceUntil).toISOString() : null,
      reminderCustomAt:
        form.reminder === 'custom' && form.reminderCustomAt ? new Date(form.reminderCustomAt).toISOString() : null,
    }
    let task = record
    if (isEdit) await update('tasks', record.id, payload)
    else {
      // Note: file attachments live in the `files` table (linked by taskId),
      // not on the task row — the tasks table has no `attachments` column.
      task = await create('tasks', payload)
      if (!task) return // save failed — error already shown; keep modal open
    }
    for (const { file } of pending) {
      await addFile(
        { name: file.name, mime: file.type, size: file.size, kind: fileKind(file.type, file.name), taskId: task.id, clientId: payload.clientId, projectId: payload.projectId },
        file,
      )
    }
    toast(isEdit ? 'Task updated' : 'Task created')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'New task'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>{isEdit ? 'Save changes' : 'Create task'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" required>
          <Input value={form.title} onChange={set('title')} placeholder="e.g. Schedule 6 Instagram reels" autoFocus />
        </Field>
        <Field label="Description">
          <Textarea value={form.description} onChange={set('description')} placeholder="What needs to get done?" />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Client">
            <Select value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value, projectId: '' }))}>
              <option value="">No client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
            </Select>
          </Field>
          <Field label="Project">
            <Select value={form.projectId} onChange={set('projectId')}>
              <option value="">No project</option>
              {projectOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={set('category')}>
              {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Due date">
            <Input type="datetime-local" value={form.dueDate} onChange={set('dueDate')} />
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={set('priority')}>
              {TASK_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={set('status')}>
              {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </Field>
        </div>

        {/* Tags */}
        <Field label="Tags">
          <div className="flex flex-wrap gap-1.5">
            {form.tags.map((t) => (
              <span key={t} className="chip bg-accent-500/10 text-accent-600 dark:text-accent-300">
                <Tag className="h-3 w-3" />
                {t}
                <button onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))} className="ml-0.5 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add a tag and press Enter…"
            />
            <Button variant="ghost" onClick={addTag} className="shrink-0 px-3"><Plus className="h-4 w-4" /></Button>
          </div>
        </Field>

        {/* Recurrence */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Repeat" className="sm:col-span-1">
            <Select value={form.recurrence} onChange={set('recurrence')}>
              {RECURRENCE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          </Field>
          {form.recurrence === 'custom' && (
            <Field label="Every N days">
              <Input type="number" min="1" value={form.recurrenceInterval} onChange={set('recurrenceInterval')} />
            </Field>
          )}
          {form.recurrence !== 'none' && (
            <Field label="Repeat until (optional)">
              <Input type="date" value={form.recurrenceUntil} onChange={set('recurrenceUntil')} />
            </Field>
          )}
        </div>
        {form.recurrence !== 'none' && (
          <p className="-mt-2 flex items-center gap-1.5 text-xs text-muted">
            <Repeat className="h-3.5 w-3.5" /> When this task is completed, the next occurrence is created automatically.
          </p>
        )}

        {/* Reminder */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Reminder">
            <Select value={form.reminder} onChange={set('reminder')}>
              {REMINDER_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          </Field>
          {form.reminder === 'custom' && (
            <Field label="Remind me at">
              <Input type="datetime-local" value={form.reminderCustomAt} onChange={set('reminderCustomAt')} />
            </Field>
          )}
        </div>
        {form.reminder !== 'none' &&
          (() => {
            const fire = reminderFireTime({
              reminder: form.reminder,
              dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
              reminderCustomAt: form.reminderCustomAt ? new Date(form.reminderCustomAt).toISOString() : null,
            })
            return (
              <p className="-mt-2 flex items-center gap-1.5 text-xs text-muted">
                <Bell className="h-3.5 w-3.5" />
                {fire
                  ? `You'll be notified on ${fire.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.`
                  : form.reminder === 'custom'
                    ? 'Pick a reminder time above.'
                    : 'Set a due date so the reminder can be scheduled.'}
              </p>
            )
          })()}

        {/* Dependencies */}
        <Field label="Depends on (blocked until these are done)">
          <div className="space-y-1.5">
            {form.dependencies.map((id) => (
              <div key={id} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                <Link2 className="h-4 w-4 text-muted" />
                <span className="flex-1 truncate text-fg">{taskById[id]?.title || 'Unknown task'}</span>
                {taskById[id] && taskById[id].status !== 'done' && (
                  <span className="chip bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Open</span>
                )}
                <button onClick={() => setForm((f) => ({ ...f, dependencies: f.dependencies.filter((x) => x !== id) }))} className="text-muted hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Select value={depPick} onChange={(e) => addDep(e.target.value)}>
              <option value="">+ Add a dependency…</option>
              {dependencyOptions.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </Select>
          </div>
        </Field>

        <Field label="Notes">
          <Textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Internal notes…" />
        </Field>

        {/* Attachments */}
        <div>
          <span className="label">Attachments</span>
          <div className="space-y-2">
            {existingAttachments.map((f) => {
              const kind = f.kind || fileKind(f.mime, f.name)
              return (
                <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 p-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setPreviewFile(f)}
                    className="h-11 w-11 shrink-0 overflow-hidden rounded-lg"
                    title="Preview"
                  >
                    <FileThumb file={f} rounded="rounded-lg" />
                  </button>
                  <button type="button" onClick={() => setPreviewFile(f)} className="min-w-0 flex-1 text-left">
                    <div className="truncate font-medium text-fg">{f.name}</div>
                    <div className="text-xs text-muted">{kind} · {fmtBytes(f.size)}</div>
                  </button>
                  <button onClick={() => downloadAttachment(f)} className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-surface hover:text-fg" title="Download">
                    <Download className="h-4 w-4" />
                  </button>
                  <button onClick={() => removeFile(f.id)} className="shrink-0 rounded-lg p-1.5 text-muted hover:text-red-500" title="Remove">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
            {pending.map(({ tmpId, file }) => (
              <div key={tmpId} className="flex items-center gap-2 rounded-lg border border-dashed border-accent-400 bg-accent-50/50 px-3 py-2 text-sm dark:bg-accent-500/10">
                <Paperclip className="h-4 w-4 text-accent-500" />
                <span className="flex-1 truncate text-fg">{file.name}</span>
                <span className="text-xs text-muted">{fmtBytes(file.size)}</span>
                <button onClick={() => setPending((p) => p.filter((x) => x.tmpId !== tmpId))} className="text-muted hover:text-red-500"><X className="h-4 w-4" /></button>
              </div>
            ))}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm font-medium text-muted transition hover:border-accent-400 hover:text-accent-600">
              <Paperclip className="h-4 w-4" />
              Attach files
              <input type="file" multiple className="hidden" onChange={onPick} />
            </label>
          </div>
        </div>
      </div>

      <FilePreviewModal file={previewFile} open={Boolean(previewFile)} onClose={() => setPreviewFile(null)} />
    </Modal>
  )
}
