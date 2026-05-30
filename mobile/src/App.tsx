import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { PrivateRoute } from './auth/PrivateRoute'
import { ToastProvider } from './components/Toast'
import { Layout } from './components/Layout'
import { Login }        from './pages/Login'
import { HomePage }     from './pages/HomePage'
import { SchedulesPage } from './pages/SchedulesPage'
import { HistoryPage }  from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'
import { PolicyPage }   from './pages/PolicyPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login"  element={<Login />} />
            <Route path="/policy" element={<PolicyPage />} />

            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route index        element={<HomePage />} />
                <Route path="schedules" element={<SchedulesPage />} />
                <Route path="history"   element={<HistoryPage />} />
                <Route path="settings"  element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
