import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../components/Toast'

interface UserData {
  alias: string; role: string; created_at: string
  total_reports: number
  notif_preferences: Record<string, boolean>
}

const PREFS = [
  { key: 'push01', label: 'Recordatorio antes del camión',  sub: '30 min antes de la recolección' },
  { key: 'push02', label: 'Aviso: contenedor lleno',         sub: 'Cuando hay muchos reportes LLENO' },
  { key: 'push03', label: 'Aviso urgente: desbordado',       sub: 'Siempre activo', locked: true },
  { key: 'push04', label: 'Camión pasó — contenedor libre',  sub: 'Recolección confirmada' },
  { key: 'push05', label: 'Cambios de horario',              sub: 'Actualizaciones del calendario' },
  { key: 'push06', label: 'Consejo semanal',                 sub: 'Tips de gestión de residuos' },
]

function Toggle({ on, onChange, disabled }: { on: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${on ? 'bg-brand' : 'bg-slate-200'} disabled:opacity-60`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'left-6' : 'left-0.5'}`} />
    </button>
  )
}

export function SettingsPage() {
  const { logout } = useAuth()
  const navigate   = useNavigate()
  const { showToast } = useToast()
  const [data,    setData]    = useState<UserData | null>(null)
  const [prefs,   setPrefs]   = useState<Record<string, boolean>>({})
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    api.get('/me/data').then((r) => {
      setData(r.data)
      setPrefs(r.data.notif_preferences)
    }).catch(() => {})
  }, [])

  const togglePref = async (key: string, val: boolean) => {
    setPrefs((p) => ({ ...p, [key]: val }))
    try {
      await api.patch('/notifications/preferences', { [key]: val })
    } catch {
      setPrefs((p) => ({ ...p, [key]: !val }))
      showToast('No se pudo actualizar', 'error')
    }
  }

  const deleteAccount = async () => {
    try {
      await api.delete('/me')
      logout()
      navigate('/login', { replace: true })
    } catch {
      showToast('Error al eliminar la cuenta', 'error')
    }
  }

  return (
    <div className="page-container pb-8">

      {/* Notificaciones */}
      <section>
        <p className="section-label mb-3">Notificaciones</p>
        <div className="card divide-y divide-slate-100">
          {PREFS.map((p) => (
            <div key={p.key} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{p.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{p.sub}</p>
              </div>
              <Toggle
                on={p.locked ? true : (prefs[p.key] ?? false)}
                onChange={p.locked ? undefined : (v) => togglePref(p.key, v)}
                disabled={p.locked}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Mis datos */}
      <section>
        <p className="section-label mb-3">Mis datos</p>
        <div className="card divide-y divide-slate-100">
          {[
            { label: 'Alias',        value: data?.alias ?? '—' },
            { label: 'Rol',          value: data?.role  ?? '—' },
            { label: 'Registrado',   value: data ? new Date(data.created_at).toLocaleDateString('es-CO') : '—' },
            { label: 'Mis reportes', value: String(data?.total_reports ?? '—') },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-slate-500">{row.label}</span>
              <span className="text-sm font-bold text-slate-800">{row.value}</span>
            </div>
          ))}
        </div>

        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            className="btn btn-danger btn-full mt-3"
          >
            🗑 Eliminar mi cuenta y datos
          </button>
        ) : (
          <div className="mt-3 card card-body space-y-3 border-red-200">
            <p className="text-sm font-bold text-red-700 text-center">Esta acción es irreversible</p>
            <p className="text-xs text-red-500 text-center">Se eliminarán todos tus reportes y datos</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(false)}
                className="btn btn-outline flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={deleteAccount}
                className="btn btn-danger flex-1"
              >
                Eliminar todo
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Información */}
      <section>
        <p className="section-label mb-3">Información</p>
        <div className="card divide-y divide-slate-100">
          <Link to="/policy" className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
            <span className="text-sm text-slate-700">📄 Política de tratamiento de datos</span>
            <span className="text-slate-400">›</span>
          </Link>
          <div className="px-5 py-4">
            <span className="text-xs text-slate-400">Versión 1.0.0</span>
          </div>
        </div>
      </section>
    </div>
  )
}
