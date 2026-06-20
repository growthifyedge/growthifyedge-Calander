import { useEffect, useMemo, useState } from 'react'
import { UploadCloud, X, FileText } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui'
import { Field, Select } from '../ui/Form'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { fileKind, fmtBytes, uid } from '../../lib/utils'

export default function FileUploadModal({ open, onClose, initial }) {
  const { clients, projects, tasks, addFile } = useData()
  const { toast } = useToast()
  const [picked, setPicked] = useState([]) // {tmpId, file}
  const [link, setLink] = useState({ clientId: '', projectId: '', taskId: '' })
  const [drag, setDrag] = useState(false)

  useEffect(() => {
    if (open) {
      setPicked([])
      setLink({ clientId: initial?.clientId || '', projectId: initial?.projectId || '', taskId: initial?.taskId || '' })
    }
  }, [open, initial])

  const addFiles = (list) =>
    setPicked((p) => [...p, ...Array.from(list).map((file) => ({ tmpId: uid('tmp'), file }))])

  const projectOptions = useMemo(
    () => projects.filter((p) => !link.clientId || p.clientId === link.clientId),
    [projects, link.clientId],
  )
  const taskOptions = useMemo(
    () => tasks.filter((t) => (!link.clientId || t.clientId === link.clientId) && (!link.projectId || t.projectId === link.projectId)),
    [tasks, link.clientId, link.projectId],
  )

  const save = async () => {
    if (!picked.length) return toast('Choose at least one file', 'error')
    for (const { file } of picked) {
      await addFile(
        {
          name: file.name,
          mime: file.type,
          size: file.size,
          kind: fileKind(file.type, file.name),
          clientId: link.clientId || null,
          projectId: link.projectId || null,
          taskId: link.taskId || null,
        },
        file,
      )
    }
    toast(`${picked.length} file${picked.length > 1 ? 's' : ''} uploaded`)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload files"
      subtitle="Images, videos, PDFs and documents — stored locally on your device."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Upload {picked.length ? `(${picked.length})` : ''}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            addFiles(e.dataTransfer.files)
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
            drag ? 'border-accent-500 bg-accent-50/60 dark:bg-accent-500/10' : 'border-border hover:border-accent-400'
          }`}
        >
          <UploadCloud className="h-8 w-8 text-accent-500" />
          <p className="text-sm font-semibold text-fg">Drag & drop files here</p>
          <p className="text-xs text-muted">or click to browse</p>
          <input type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        </label>

        {picked.length > 0 && (
          <div className="space-y-2">
            {picked.map(({ tmpId, file }) => (
              <div key={tmpId} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                <FileText className="h-4 w-4 text-muted" />
                <span className="flex-1 truncate text-fg">{file.name}</span>
                <span className="text-xs text-muted">{fmtBytes(file.size)}</span>
                <button onClick={() => setPicked((p) => p.filter((x) => x.tmpId !== tmpId))} className="text-muted hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Link to client">
            <Select value={link.clientId} onChange={(e) => setLink({ clientId: e.target.value, projectId: '', taskId: '' })}>
              <option value="">None</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Link to project">
            <Select value={link.projectId} onChange={(e) => setLink((l) => ({ ...l, projectId: e.target.value, taskId: '' }))}>
              <option value="">None</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Link to task">
            <Select value={link.taskId} onChange={(e) => setLink((l) => ({ ...l, taskId: e.target.value }))}>
              <option value="">None</option>
              {taskOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  )
}
