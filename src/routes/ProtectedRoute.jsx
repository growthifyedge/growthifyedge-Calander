import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from '../components/ui'

export default function ProtectedRoute({ children }) {
  const { status } = useAuth()
  if (status === 'loading') return <PageLoader label="Checking your session…" />
  if (status === 'anon') return <Navigate to="/login" replace />
  return children
}
