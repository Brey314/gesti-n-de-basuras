import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const TABS = [
  { to: '/',          label: 'Inicio',   icon: '🏠', end: true },
  { to: '/schedules', label: 'Horarios', icon: '🗓' },
  { to: '/history',   label: 'Reportes', icon: '📋' },
  { to: '/settings',  label: 'Config',   icon: '⚙️' },
]

export function ResidentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    /* Outer wrapper: row on desktop, column on mobile */
    <div className="min-h-svh flex flex-col md:flex-row bg-slate-100">

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className="hidden md:flex w-56 bg-slate-800 flex-col shrink-0 sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">♻</span>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Gestión de Basuras</p>
              <p className="text-xs text-white/40 mt-0.5">Conjunto Residencial</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                }`
              }
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-2">
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary btn-full btn-sm justify-start gap-2"
            >
              ⚡ Panel Admin
            </button>
          )}
          <div className="flex items-center justify-between px-1 py-1">
            <div className="min-w-0">
              <p className="text-xs text-white/60 font-medium truncate">{user?.alias}</p>
              <p className="text-xs text-white/30 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-white/40 hover:text-white transition-colors ml-3 shrink-0"
            >
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content column ── */}
      <div className="
        flex flex-col flex-1
        max-w-[430px] mx-auto w-full bg-slate-50 shadow-[0_0_40px_rgba(0,0,0,.12)]
        md:max-w-none md:bg-transparent md:shadow-none
      ">
        {/* Mobile header */}
        <header className="md:hidden bg-slate-800 text-white px-4 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm tracking-wide">♻ Gestión de Basuras</span>
            <div className="flex items-center gap-2">
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-xs bg-brand hover:opacity-90 text-white px-2 py-1 rounded font-semibold transition-colors"
                >
                  Panel Admin →
                </button>
              )}
              <span className="text-xs opacity-50">{user?.alias}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 md:overflow-auto">
          <Outlet />
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-slate-200 flex z-40">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                  isActive ? 'text-brand' : 'text-slate-400'
                }`
              }
            >
              <span className="text-xl leading-none mb-0.5">{tab.icon}</span>
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
