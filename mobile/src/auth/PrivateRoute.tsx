import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function PrivateRoute({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children ? <>{children}</> : <Outlet />
}
