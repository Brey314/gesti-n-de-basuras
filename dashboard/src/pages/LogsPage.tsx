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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Logs de limpieza automática</h2>
        <button
          onClick={load}
          disabled={loading}
          className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? 'Cargando…' : '↻ Actualizar'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Hora (UTC)</th>
              <th className="px-4 py-3 font-medium">Eliminados</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Sin registros
                </td>
              </tr>
            )}
            {logs.map((entry, i) => {
              const { date, time } = parseTS(entry.timestamp)
              return (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3">{date}</td>
                  <td className="px-4 py-3 font-mono text-xs">{time}</td>
                  <td className="px-4 py-3 text-center">{entry.deleted_count ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      title={entry.error_msg ?? undefined}
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        entry.status === 'SUCCESS'
                          ? 'bg-green-100 text-green-800'
                          : entry.status === 'ERROR'
                          ? 'bg-red-100 text-red-800 cursor-help'
                          : 'bg-gray-100 text-gray-600'
                      }`}
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
