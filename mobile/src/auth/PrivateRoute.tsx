import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

interface Props {
  children?: React.ReactNode
  roles?: string[]
}

export function PrivateRoute({ children, roles }: Props) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    const dest = user.role === 'RESIDENT' ? '/' : '/dashboard'
    return <Navigate to={dest} replace />
  }
  return children ? <>{children}</> : <Outlet />
}
