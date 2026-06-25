import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './routes/ProtectedRoute'
import { useData } from './context/DataContext'
import { PageLoader } from './components/ui'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Calendar from './pages/Calendar'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Files from './pages/Files'
import Approvals from './pages/Approvals'
import Meetings from './pages/Meetings'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import QuickCapture from './pages/QuickCapture'
import AgentDashboard from './pages/AgentDashboard'

function AppShell() {
  const { loading } = useData()
  if (loading) return <PageLoader />
  return (
    <Routes>
      {/* Limited Agent Dashboard — standalone (no admin sidebar/nav), behind login.
          Intentionally NOT added to the Sidebar (unlinked) for Phase 1. */}
      <Route path="agent" element={<AgentDashboard />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="capture" element={<QuickCapture />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="files" element={<Files />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
