import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { PrivateRoute } from './auth/PrivateRoute'
import { ToastProvider } from './components/Toast'
import { ResidentLayout }    from './components/ResidentLayout'
import { AdminLayout }       from './components/AdminLayout'
import { ResearcherLayout }  from './components/ResearcherLayout'
import { ViewerLayout }      from './components/ViewerLayout'
import { Login }             from './pages/Login'
import { HomePage }          from './pages/HomePage'
import { SchedulesPage }     from './pages/SchedulesPage'
import { HistoryPage }       from './pages/HistoryPage'
import { SettingsPage }      from './pages/SettingsPage'
import { PolicyPage }        from './pages/PolicyPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { CodesPage }         from './pages/CodesPage'
import { AdminSchedulesPage } from './pages/AdminSchedulesPage'
import { ExportPage }        from './pages/ExportPage'
import { LogsPage }          from './pages/LogsPage'

function RoleAwareRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'RESIDENT') return <Navigate to="/" replace />
  return <Navigate to="/dashboard" replace />  // ADMIN, RESEARCHER, VIEWER
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/login"  element={<Login />} />
            <Route path="/policy" element={<PolicyPage />} />

            {/* Resident routes — ADMIN can also visit these */}
            <Route element={<PrivateRoute roles={['RESIDENT', 'ADMIN']} />}>
              <Route element={<ResidentLayout />}>
                <Route index            element={<HomePage />} />
                <Route path="schedules" element={<SchedulesPage />} />
                <Route path="history"   element={<HistoryPage />} />
                <Route path="settings"  element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Admin routes */}
            <Route element={<PrivateRoute roles={['ADMIN']} />}>
              <Route element={<AdminLayout />}>
                <Route path="dashboard"       element={<AdminDashboardPage />} />
                <Route path="admin/codes"     element={<CodesPage />} />
                <Route path="admin/schedules" element={<AdminSchedulesPage />} />
                <Route path="admin/export"    element={<ExportPage />} />
                <Route path="admin/logs"      element={<LogsPage />} />
              </Route>
            </Route>

            {/* Researcher routes — dashboard, export, logs (read-only) */}
            <Route element={<PrivateRoute roles={['RESEARCHER']} />}>
              <Route element={<ResearcherLayout />}>
                <Route path="dashboard"    element={<AdminDashboardPage />} />
                <Route path="admin/export" element={<ExportPage />} />
                <Route path="admin/logs"   element={<LogsPage />} />
              </Route>
            </Route>

            {/* Viewer routes — dashboard and poster export only */}
            <Route element={<PrivateRoute roles={['VIEWER']} />}>
              <Route element={<ViewerLayout />}>
                <Route path="dashboard"    element={<AdminDashboardPage />} />
                <Route path="admin/export" element={<ExportPage />} />
              </Route>
            </Route>

            {/* Role-aware fallback */}
            <Route path="*" element={<RoleAwareRedirect />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
