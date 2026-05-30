import { useEffect, useState } from 'react'
import api from '../api/client'

interface LogEntry {
  timestamp: string | null
  deleted_count: number | null
  status: string | null
  error_msg: string | null
}

export function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get<LogEntry[]>('/stats/admin/logs/cleanup')
      setLogs([...res.data].reverse())
    } catch { /* interceptor handles */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const parseTS = (ts: string | null) => {
    if (!ts) return { date: '—', time: '—' }
    const [datePart, timePart] = ts.split('T')
    return { date: datePart ?? '—', time: (timePart ?? '').replace('Z', '') }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h2 className="page-title">Logs de limpieza automática</h2>
        <button onClick={load} disabled={loading} className="btn btn-secondary btn-sm">
          {loading ? 'Cargando…' : '↻ Actualizar'}
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora (UTC)</th>
              <th>Eliminados</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-6">Sin registros</td>
              </tr>
            )}
            {logs.map((entry, i) => {
              const { date, time } = parseTS(entry.timestamp)
              return (
                <tr key={i}>
                  <td>{date}</td>
                  <td className="font-mono text-xs">{time}</td>
                  <td className="text-center">{entry.deleted_count ?? '—'}</td>
                  <td>
                    <span
                      title={entry.error_msg ?? undefined}
                      className={
                        entry.status === 'SUCCESS' ? 'badge-success' :
                        entry.status === 'ERROR'   ? 'badge-error cursor-help' :
                                                     'badge-neutral'
                      }
                    >
                      {entry.status ?? '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
