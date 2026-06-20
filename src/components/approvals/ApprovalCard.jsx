import { Paperclip } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useQuickAdd } from '../../context/QuickAddContext'
import FileThumb from '../files/FileThumb'
import { relativeTime } from '../../lib/utils'

export default function ApprovalCard({ approval, onDragStart, draggable }) {
  const { files, clientById } = useData()
  const { open } = useQuickAdd()
  const media = files.filter((f) => f.approvalId === approval.id)

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={() => open('approval', { record: approval })}
      className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-surface shadow-soft transition hover:shadow-card hover:-translate-y-0.5"
    >
      <div className="aspect-video w-full overflow-hidden bg-surface-2">
        {media[0] ? (
          <FileThumb file={media[0]} rounded="rounded-none" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">No creative</div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-fg">{approval.title}</p>
        <p className="truncate text-xs text-muted">{clientById[approval.clientId]?.company || 'Internal'}</p>
        {approval.notes && <p className="mt-1.5 line-clamp-2 text-xs text-muted/90">{approval.notes}</p>}
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
          <span>Updated {relativeTime(approval.updatedAt || approval.createdAt)}</span>
          {media.length > 0 && <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" /> {media.length}</span>}
        </div>
      </div>
    </div>
  )
}
