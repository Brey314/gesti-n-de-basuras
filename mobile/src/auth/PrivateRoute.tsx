import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

interface Props {
  children?: React.ReactNode
  roles?: string[]
}

export function PrivateRoute({ children, roles }: Props) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role))
    return <Navigate to={user.role === 'ADMIN' ? '/dashboard' : '/'} replace />
  return children ? <>{children}</> : <Outlet />
}
