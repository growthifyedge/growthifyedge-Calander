import { useEffect, useMemo, useState } from 'react'
import { Image as ImageIcon, X } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui'
import { Field, Input, Textarea, Select } from '../ui/Form'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { APPROVAL_STATUSES, statusMeta } from '../../lib/constants'
import { fileKind, fmtBytes, fmtDateTime, uid, nowISO } from '../../lib/utils'

const blank = (i = {}) => ({ title: '', clientId: '', projectId: '', status: 'draft', notes: '', ...i })

export default function ApprovalModal({ open, onClose, record, initial }) {
  const { clients, projects, files, create, update, addFile, removeFile } = useData()
  const { toast } = useToast()
  const [form, setForm] = useState(blank())
  const [pending, setPending] = useState([])
  const isEdit = Boolean(record)

  useEffect(() => {
    if (!open) return
    setForm(record ? blank(record) : blank(initial))
    setPending([])
  }, [open, record, initial])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const projectOptions = useMemo(
    () => projects.filter((p) => !form.clientId || p.clientId === form.clientId),
    [projects, form.clientId],
  )
  const media = useMemo(() => (record ? files.filter((f) => f.approvalId === record.id) : []), [files, record])

  const onPick = (e) => {
    setPending((p) => [...p, ...Array.from(e.target.files || []).map((file) => ({ tmpId: uid('tmp'), file }))])
    e.target.value = ''
  }

  const save = async () => {
    if (!form.title.trim()) return toast('Title is required', 'error')
    const base = { ...form, clientId: form.clientId || null, projectId: form.projectId || null }
    let rec = record
    if (isEdit) {
      const history = [...(record.history || [])]
      if (record.status !== form.status) history.push({ status: form.status, note: form.notes || 'Status updated', at: nowISO() })
      rec = await update('approvals', record.id, { ...base, history })
    } else {
      rec = await create('approvals', { ...base, fileIds: [], history: [{ status: form.status, note: 'Created', at: nowISO() }] })
    }
    for (const { file } of pending) {
      await addFile(
        {
          name: file.name,
          mime: file.type,
          size: file.size,
          kind: fileKind(file.type, file.name),
          approvalId: rec.id,
          clientId: base.clientId,
          projectId: base.projectId,
        },
        file,
      )
    }
    toast(isEdit ? 'Approval updated' : 'Approval item created')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit approval item' : 'New approval item'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{isEdit ? 'Save changes' : 'Create'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" required>
          <Input value={form.title} onChange={set('title')} placeholder="e.g. Summer Cold Brew — IG Carousel" autoFocus />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Client">
            <Select value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value, projectId: '' }))}>
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Project">
            <Select value={form.projectId} onChange={set('projectId')}>
              <option value="">No project</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={set('status')}>
              {APPROVAL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Approval notes" hint="Add context or the reason for a status change (logged to history).">
          <Textarea value={form.notes} onChange={set('notes')} placeholder="e.g. Client to confirm copy on slide 3" />
        </Field>

        <div>
          <span className="label">Creative (images / video)</span>
          <div className="space-y-2">
            {media.map((f) => (
              <div key={f.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                <ImageIcon className="h-4 w-4 text-muted" />
                <span className="flex-1 truncate text-fg">{f.name}</span>
                <span className="text-xs text-muted">{fmtBytes(f.size)}</span>
                <button onClick={() => removeFile(f.id)} className="text-muted hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {pending.map(({ tmpId, file }) => (
              <div key={tmpId} className="flex items-center gap-2 rounded-lg border border-dashed border-accent-400 bg-accent-50/50 px-3 py-2 text-sm dark:bg-accent-500/10">
                <ImageIcon className="h-4 w-4 text-accent-500" />
                <span className="flex-1 truncate text-fg">{file.name}</span>
                <button onClick={() => setPending((p) => p.filter((x) => x.tmpId !== tmpId))} className="text-muted hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm font-medium text-muted transition hover:border-accent-400 hover:text-accent-600">
              <ImageIcon className="h-4 w-4" />
              Upload creative
              <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={onPick} />
            </label>
          </div>
        </div>

        {isEdit && record.history?.length > 0 && (
          <div>
            <span className="label">Approval history</span>
            <ol className="relative space-y-3 border-l border-border pl-4">
              {[...record.history].reverse().map((h, i) => {
                const meta = statusMeta(APPROVAL_STATUSES, h.status)
                return (
                  <li key={i} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-surface" style={{ background: meta.dot }} />
                    <div className="text-sm font-semibold text-fg">{meta.label}</div>
                    {h.note && <div className="text-xs text-muted">{h.note}</div>}
                    <div className="text-[11px] text-muted/70">{fmtDateTime(h.at)}</div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </div>
    </Modal>
  )
}
