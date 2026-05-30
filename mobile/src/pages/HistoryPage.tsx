import { useEffect, useState } from 'react'
import api from '../api/client'

interface Report { id: string; status: string; created_at: string; days_until_expiry: number }

const STATUS_LABELS: Record<string, string> = {
  EMPTY: 'Vacío', HALF: 'Medio', FULL: 'Lleno', OVERFLOW: 'Desbordado',
}
const STATUS_DOT: Record<string, string> = {
  EMPTY: 'status-dot-empty', HALF: 'status-dot-half',
  FULL: 'status-dot-full',  OVERFLOW: 'status-dot-overflow',
}
const STATUS_TEXT: Record<string, string> = {
  EMPTY: 'text-status-empty', HALF: 'text-status-half',
  FULL: 'text-status-full',  OVERFLOW: 'text-status-overflow',
}

export function HistoryPage() {
  const [reports,    setReports]    = useState<Report[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const res = await api.get('/reports/mine')
      setReports(res.data)
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (reports.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <span className="text-6xl mb-4">♻</span>
      <p className="font-bold text-slate-700 text-lg">Aún no has hecho ningún reporte</p>
      <p className="text-sm text-slate-400 mt-2">Usa el botón de Inicio para reportar el estado</p>
    </div>
  )

  return (
    <div className="page-container">
      <div className="page-header">
        <p className="section-label">Tus reportes — últimos 30 días</p>
        <button
          onClick={() => { setRefreshing(true); load() }}
          className="btn btn-ghost btn-sm"
        >
          {refreshing ? '…' : '↻ Actualizar'}
        </button>
      </div>

      <div className="space-y-2">
        {reports.map((r) => {
          const dotClass  = STATUS_DOT[r.status]  ?? 'status-dot-empty'
          const textClass = STATUS_TEXT[r.status] ?? 'text-slate-500'
          const date = new Date(r.created_at).toLocaleString('es-CO', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
          })
          return (
            <div key={r.id} className="card px-5 py-4 flex items-center gap-4">
              <div className={dotClass} />
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${textClass}`}>
                  {STATUS_LABELS[r.status] ?? r.status}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{date}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-black text-slate-700">{r.days_until_expiry}</p>
                <p className="text-xs text-slate-400">días</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
