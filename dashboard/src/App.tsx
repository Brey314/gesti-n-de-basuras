import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { PrivateRoute } from './auth/PrivateRoute'
import { ToastProvider } from './components/Toast'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { DashboardPage } from './pages/DashboardPage'
import { SchedulesPage } from './pages/SchedulesPage'
import { CodesPage } from './pages/CodesPage'
import { ExportPage } from './pages/ExportPage'
import { LogsPage } from './pages/LogsPage'
import { PosterPage } from './pages/PosterPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route
                  path="schedules"
                  element={
                    <PrivateRoute roles={['ADMIN']}>
                      <SchedulesPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="codes"
                  element={
                    <PrivateRoute roles={['ADMIN']}>
                      <CodesPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="export"
                  element={
                    <PrivateRoute roles={['ADMIN', 'RESEARCHER']}>
                      <ExportPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="logs"
                  element={
                    <PrivateRoute roles={['ADMIN', 'RESEARCHER']}>
                      <LogsPage />
                    </PrivateRoute>
                  }
                />
                <Route path="poster" element={<PosterPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
