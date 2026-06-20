import { useEffect, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui'
import { useData } from '../../context/DataContext'
import { fileKind, fmtBytes, fmtDateTime, downloadBlob } from '../../lib/utils'
import { db } from '../../lib/db'

export default function FilePreviewModal({ file, open, onClose }) {
  const { getFileUrl, clientById, projectById } = useData()
  const [url, setUrl] = useState(null)
  const kind = file ? file.kind || fileKind(file.mime, file.name) : 'file'

  useEffect(() => {
    if (!open || !file) return
    let u
    let alive = true
    getFileUrl(file).then((res) => {
      if (alive) {
        u = res
        setUrl(res)
      }
    })
    return () => {
      alive = false
      if (u && u.startsWith?.('blob:')) URL.revokeObjectURL(u)
      setUrl(null)
    }
  }, [open, file, getFileUrl])

  const download = async () => {
    const blob = await db.getBlob(file.storagePath || file.id)
    if (blob) downloadBlob(blob, file.name)
    else if (url) window.open(url, '_blank')
  }

  if (!file) return null

  return (
    <Modal open={open} onClose={onClose} title={file.name} subtitle={`${kind} · ${fmtBytes(file.size)} · ${fmtDateTime(file.createdAt)}`} size="xl"
      footer={<><Button variant="ghost" onClick={onClose}>Close</Button><Button onClick={download}><Download className="h-4 w-4" /> Download</Button></>}
    >
      <div className="flex min-h-[40vh] items-center justify-center rounded-xl bg-surface-2/50 p-2">
        {!url ? (
          <div className="py-20 text-sm text-muted">Loading preview…</div>
        ) : kind === 'image' ? (
          <img src={url} alt={file.name} className="max-h-[65vh] rounded-lg object-contain" />
        ) : kind === 'video' ? (
          <video src={url} controls className="max-h-[65vh] w-full rounded-lg" />
        ) : kind === 'pdf' ? (
          <iframe src={url} title={file.name} className="h-[65vh] w-full rounded-lg" />
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-muted">
            <FileText className="h-12 w-12" />
            <p className="text-sm">No inline preview for this file type.</p>
            <Button onClick={download}><Download className="h-4 w-4" /> Download to view</Button>
          </div>
        )}
      </div>
      {(clientById[file.clientId] || projectById[file.projectId]) && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {clientById[file.clientId] && <span className="chip bg-surface-2 text-muted">Client: {clientById[file.clientId].company}</span>}
          {projectById[file.projectId] && <span className="chip bg-surface-2 text-muted">Project: {projectById[file.projectId].name}</span>}
        </div>
      )}
    </Modal>
  )
}
