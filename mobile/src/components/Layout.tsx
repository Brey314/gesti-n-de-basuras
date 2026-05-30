import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const TABS = [
  { to: '/',          label: 'Inicio',    icon: '🏠', end: true },
  { to: '/schedules', label: 'Horarios',  icon: '🗓' },
  { to: '/history',   label: 'Reportes',  icon: '📋' },
  { to: '/settings',  label: 'Config',    icon: '⚙️' },
]

export function Layout() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col min-h-svh">
      {/* Header */}
      <header className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <span className="font-bold text-sm tracking-wide">♻ Gestión de Basuras</span>
        <span className="text-xs opacity-60">{user?.alias}</span>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 flex z-40">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-green-600' : 'text-gray-400'
              }`
            }
          >
            <span className="text-xl leading-none mb-0.5">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
