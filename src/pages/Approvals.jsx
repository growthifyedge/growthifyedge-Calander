import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useQuickAdd } from '../context/QuickAddContext'
import PageHeader from '../components/PageHeader'
import { Button } from '../components/ui'
import ApprovalCard from '../components/approvals/ApprovalCard'
import { APPROVAL_STATUSES } from '../lib/constants'
import { nowISO, cn } from '../lib/utils'

export default function Approvals() {
  const { approvals, update } = useData()
  const { open } = useQuickAdd()
  const [dragId, setDragId] = useState(null)
  const [overCol, setOverCol] = useState(null)

  const drop = (status) => {
    const item = approvals.find((a) => a.id === dragId)
    if (item && item.status !== status) {
      const history = [...(item.history || []), { status, note: 'Moved to ' + status, at: nowISO() }]
      update('approvals', item.id, { status, history })
    }
    setDragId(null)
    setOverCol(null)
  }

  return (
    <div>
      <PageHeader
        title="Content Approvals"
        subtitle="Track creative from draft to approved — drag cards across the pipeline."
        actions={<Button onClick={() => open('approval')}><Plus className="h-4 w-4" /> New Item</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {APPROVAL_STATUSES.map((col) => {
          const items = approvals.filter((a) => a.status === col.value)
          return (
            <div
              key={col.value}
              onDragOver={(e) => {
                e.preventDefault()
                setOverCol(col.value)
              }}
              onDragLeave={() => setOverCol((c) => (c === col.value ? null : c))}
              onDrop={() => drop(col.value)}
              className={cn('flex max-h-[calc(100vh-200px)] flex-col rounded-2xl border bg-surface-2/40 transition', overCol === col.value ? 'border-accent-400 bg-accent-50/40 dark:bg-accent-500/5' : 'border-border')}
            >
              <div className="flex items-center justify-between px-3.5 pt-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.dot }} />
                  <span className="text-sm font-bold text-fg">{col.label}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">{items.length}</span>
                </div>
                <button onClick={() => open('approval', { initial: { status: col.value } })} className="text-muted hover:text-accent-600"><Plus className="h-4 w-4" /></button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-3.5">
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-muted">Drop items here</div>
                ) : (
                  items.map((a) => <ApprovalCard key={a.id} approval={a} draggable onDragStart={() => setDragId(a.id)} />)
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
