import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const ADMIN_RES_LINKS = [
  { to: '/',          label: '📊 Dashboard',  end: true },
  { to: '/schedules', label: '🗓 Horarios' },
  { to: '/codes',     label: '🔑 Códigos' },
  { to: '/export',    label: '📤 Exportar' },
  { to: '/logs',      label: '🪵 Logs' },
  { to: '/poster',    label: '📋 Cartelera' },
]

const VIEWER_LINKS = [
  { to: '/',       label: '📊 Dashboard', end: true },
  { to: '/poster', label: '📋 Cartelera' },
]

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = user?.role === 'VIEWER' ? VIEWER_LINKS : ADMIN_RES_LINKS

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <span className="font-bold text-gray-800 text-sm">Conjunto Residencial ♻</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={'end' in l ? l.end : false}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Sesión: <strong>{user?.alias}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:underline"
          >
            Cerrar sesión
          </button>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
