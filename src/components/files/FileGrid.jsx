import { useState } from 'react'
import { Download, Trash2, Eye, MoreHorizontal } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { ConfirmDialog } from '../ui/Modal'
import FileThumb from './FileThumb'
import FilePreviewModal from './FilePreviewModal'
import { fmtBytes, relativeTime, downloadBlob } from '../../lib/utils'
import { db } from '../../lib/db'

export default function FileGrid({ files }) {
  const { removeFile, clientById } = useData()
  const [preview, setPreview] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [menuId, setMenuId] = useState(null)

  const download = async (file) => {
    const blob = await db.getBlob(file.storagePath || file.id)
    if (blob) downloadBlob(blob, file.name)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {files.map((f) => (
          <div key={f.id} className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-soft transition hover:shadow-card">
            <button onClick={() => setPreview(f)} className="block aspect-[4/3] w-full overflow-hidden bg-surface-2">
              <FileThumb file={f} rounded="rounded-none" />
            </button>
            <div className="flex items-start gap-2 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-fg" title={f.name}>{f.name}</p>
                <p className="truncate text-xs text-muted">
                  {fmtBytes(f.size)} · {relativeTime(f.createdAt)}
                </p>
                {clientById[f.clientId] && <p className="mt-1 truncate text-[11px] text-accent-600 dark:text-accent-400">{clientById[f.clientId].company}</p>}
              </div>
              <div className="relative">
                <button onClick={() => setMenuId(menuId === f.id ? null : f.id)} onBlur={() => setTimeout(() => setMenuId((m) => (m === f.id ? null : m)), 150)} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuId === f.id && (
                  <div className="absolute right-0 top-8 z-20 w-32 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-pop">
                    <button onClick={() => setPreview(f)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2"><Eye className="h-3.5 w-3.5" /> Preview</button>
                    <button onClick={() => download(f)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2"><Download className="h-3.5 w-3.5" /> Download</button>
                    <button onClick={() => setConfirm(f)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <FilePreviewModal file={preview} open={Boolean(preview)} onClose={() => setPreview(null)} />
      <ConfirmDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={() => removeFile(confirm.id)} title="Delete file?" message={`“${confirm?.name}” will be permanently removed.`} />
    </>
  )
}
