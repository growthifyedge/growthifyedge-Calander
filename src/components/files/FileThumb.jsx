import { useEffect, useState } from 'react'
import { FileText, FileVideo, FileImage, File as FileIcon } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { fileKind, cn } from '../../lib/utils'

const ICONS = { image: FileImage, video: FileVideo, pdf: FileText, document: FileText, file: FileIcon }
const TONES = {
  image: 'text-violet-500 bg-violet-500/10',
  video: 'text-rose-500 bg-rose-500/10',
  pdf: 'text-red-500 bg-red-500/10',
  document: 'text-blue-500 bg-blue-500/10',
  file: 'text-slate-500 bg-slate-500/10',
}

export default function FileThumb({ file, className, rounded = 'rounded-xl' }) {
  const { getFileUrl } = useData()
  const [url, setUrl] = useState(null)
  const kind = file.kind || fileKind(file.mime, file.name)
  const Icon = ICONS[kind] || FileIcon

  useEffect(() => {
    let revoke
    if (kind === 'image') {
      let alive = true
      getFileUrl(file).then((u) => {
        if (alive) {
          setUrl(u)
          revoke = u
        }
      })
      return () => {
        alive = false
        if (revoke && revoke.startsWith('blob:')) URL.revokeObjectURL(revoke)
      }
    }
  }, [file, kind, getFileUrl])

  if (kind === 'image' && url) {
    return <img src={url} alt={file.name} className={cn('h-full w-full object-cover', rounded, className)} />
  }
  return (
    <div className={cn('flex h-full w-full items-center justify-center', rounded, TONES[kind], className)}>
      <Icon className="h-7 w-7" />
    </div>
  )
}
