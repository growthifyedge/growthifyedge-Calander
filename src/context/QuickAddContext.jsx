import { createContext, useContext, useState, useCallback } from 'react'
import TaskModal from '../components/modals/TaskModal'
import ClientModal from '../components/modals/ClientModal'
import ProjectModal from '../components/modals/ProjectModal'
import MeetingModal from '../components/modals/MeetingModal'
import FileUploadModal from '../components/modals/FileUploadModal'
import ApprovalModal from '../components/modals/ApprovalModal'

const QuickAddContext = createContext(null)
export const useQuickAdd = () => useContext(QuickAddContext)

const MODALS = {
  task: TaskModal,
  client: ClientModal,
  project: ProjectModal,
  meeting: MeetingModal,
  file: FileUploadModal,
  approval: ApprovalModal,
}

export function QuickAddProvider({ children }) {
  const [modal, setModal] = useState(null) // { type, props }

  const open = useCallback((type, props = {}) => setModal({ type, props }), [])
  const close = useCallback(() => setModal(null), [])

  const ActiveModal = modal ? MODALS[modal.type] : null

  return (
    <QuickAddContext.Provider value={{ open, close }}>
      {children}
      {ActiveModal && <ActiveModal open onClose={close} {...modal.props} />}
    </QuickAddContext.Provider>
  )
}
