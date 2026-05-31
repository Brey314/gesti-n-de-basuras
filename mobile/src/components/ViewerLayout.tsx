import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const LINKS = [
  { to: '/dashboard',    label: '📊 Dashboard', end: true },
  { to: '/admin/export', label: '📤 Exportar' },
]

export function ViewerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col min-h-svh bg-slate-100 md:flex-row">

      {/* ── Mobile: compact top bar + scrollable nav tabs ── */}
      <div className="md:hidden bg-white shadow-sm shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-bold text-slate-800 text-sm">♻ Observador</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{user?.alias}</span>
            <button onClick={handleLogout} className="text-xs text-red-500 font-medium">
              Salir
            </button>
          </div>
        </div>
        <nav className="flex overflow-x-auto px-4 pb-2 gap-1">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `whitespace-nowrap text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                  isActive ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 bg-white shadow-md flex-col shrink-0 sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">♻</span>
            <div>
              <p className="font-bold text-slate-800 text-sm leading-tight">Observador</p>
              <p className="text-xs text-slate-400 mt-0.5">Conjunto Residencial</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-2 shrink-0">
          <div className="flex items-center justify-between px-1 pt-0.5">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{user?.alias}</p>
              <p className="text-xs text-slate-400">Observador comunitario</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors ml-2 shrink-0"
            >
              Salir
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
