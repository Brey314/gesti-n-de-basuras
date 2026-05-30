import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const ADMIN_LINKS = [
  { to: '/dashboard',       label: '📊 Dashboard',  end: true },
  { to: '/admin/schedules', label: '🗓 Horarios' },
  { to: '/admin/codes',     label: '🔑 Códigos' },
  { to: '/admin/export',    label: '📤 Exportar' },
  { to: '/admin/logs',      label: '🪵 Logs' },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col min-h-svh bg-gray-100 md:flex-row">
      {/* Mobile: compact top bar + horizontal scrollable nav */}
      <div className="md:hidden bg-white shadow-sm shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-bold text-gray-800 text-sm">♻ Admin</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-blue-600 font-medium border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50 transition-colors"
            >
              ← Vista residente
            </button>
            <span className="text-xs text-gray-400">{user?.alias}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-red-600 font-medium"
            >
              Salir
            </button>
          </div>
        </div>
        <nav className="flex overflow-x-auto px-4 pb-2 gap-1">
          {ADMIN_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `whitespace-nowrap text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                  isActive ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-white shadow-md flex-col shrink-0">
        <div className="p-4 border-b">
          <span className="font-bold text-gray-800 text-sm">Conjunto Residencial ♻</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {ADMIN_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t">
          <button
            onClick={() => navigate('/')}
            className="w-full text-xs text-blue-600 border border-blue-200 rounded px-3 py-2 hover:bg-blue-50 transition-colors font-medium"
          >
            ← Vista residente
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop header */}
        <header className="hidden md:flex bg-white shadow-sm px-6 py-3 items-center justify-between shrink-0">
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
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
