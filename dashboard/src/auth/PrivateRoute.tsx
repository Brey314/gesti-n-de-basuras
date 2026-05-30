import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

interface Props {
  roles?: string[]
  children?: React.ReactNode
}

export function PrivateRoute({ roles, children }: Props) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

  return children ? <>{children}</> : <Outlet />
}
