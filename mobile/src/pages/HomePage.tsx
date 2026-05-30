import { useEffect, useRef, useState } from 'react'
import api from '../api/client'
import { useToast } from '../components/Toast'

interface CurrentReport {
  status: string | null
  alias?: string
  minutes_ago?: number
  message?: string
  warning?: string
}

const STATUS_LABELS: Record<string, string> = {
  EMPTY: 'VACÍO', HALF: 'MEDIO', FULL: 'LLENO', OVERFLOW: 'DESBORDADO',
}
const STATUS_COLORS: Record<string, string> = {
  EMPTY: '#16a34a', HALF: '#ca8a04', FULL: '#dc2626', OVERFLOW: '#991b1b',
}

const REPORT_OPTIONS = [
  { key: 'EMPTY',    emoji: '🟢', label: 'VACÍO',      color: '#16a34a' },
  { key: 'HALF',     emoji: '🟡', label: 'MEDIO',      color: '#ca8a04' },
  { key: 'FULL',     emoji: '🔴', label: 'LLENO',      color: '#dc2626' },
  { key: 'OVERFLOW', emoji: '🚨', label: 'DESBORDADO', color: '#991b1b' },
]

export function HomePage() {
  const { showToast } = useToast()
  const [report,   setReport]   = useState<CurrentReport | null>(null)
  const [sheet,    setSheet]    = useState(false)
  const sheetRef               = useRef<HTMLDivElement>(null)

  const fetchCurrent = async () => {
    try {
      const res = await api.get('/reports/current')
      setReport(res.data)
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchCurrent()
    const id = setInterval(fetchCurrent, 30_000)
    return () => clearInterval(id)
  }, [])

  // Cierra el sheet al tocar fuera
  useEffect(() => {
    if (!sheet) return
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) setSheet(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sheet])

  const handleReport = async (status: string) => {
    setSheet(false)
    try {
      await api.post('/reports/', { status })
      showToast('Reporte enviado ✓', 'success')
      fetchCurrent()
    } catch {
      showToast('Error al enviar el reporte', 'error')
    }
  }

  const status = report?.status ?? null
  const color  = status ? (STATUS_COLORS[status] ?? '#94a3b8') : '#94a3b8'
  const label  = status ? (STATUS_LABELS[status] ?? status) : 'Sin datos'

  return (
    <div className="p-5 space-y-4">
      {/* Estado actual */}
      <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estado del contenedor</p>

        {/* Círculo con pulso para OVERFLOW */}
        <div className="relative flex items-center justify-center">
          {status === 'OVERFLOW' && (
            <span
              className="absolute inline-flex rounded-full opacity-60 animate-ping"
              style={{ width: 120, height: 120, backgroundColor: color }}
            />
          )}
          <div
            className="rounded-full transition-colors duration-500"
            style={{ width: 120, height: 120, backgroundColor: color }}
          />
        </div>

        <p className="text-3xl font-black" style={{ color }}>{label}</p>

        {report?.alias && report?.minutes_ago !== undefined && (
          <p className="text-sm text-slate-400 text-center">
            Último reporte hace <strong>{report.minutes_ago}</strong> min por <strong>{report.alias}</strong>
          </p>
        )}
        {!status && report?.message && (
          <p className="text-sm text-slate-400">{report.message}</p>
        )}
        {report?.warning && (
          <div className="w-full bg-yellow-50 border-l-4 border-yellow-400 rounded-r-xl px-4 py-2">
            <p className="text-xs text-yellow-700 font-medium">⚠ {report.warning}</p>
          </div>
        )}
      </div>

      {/* Botón reportar (toque 1) */}
      <button
        onClick={() => setSheet(true)}
        className="w-full bg-green-600 text-white py-5 rounded-2xl text-lg font-black shadow-lg active:scale-[.98] transition-transform"
      >
        📣  REPORTAR ESTADO
      </button>

      {/* Bottom sheet (toque 2 → 3) */}
      {sheet && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-end">
          <div ref={sheetRef} className="w-full max-w-[430px] mx-auto bg-white rounded-t-2xl p-6 pb-10 space-y-3 animate-[slideUp_.25s_ease-out]">
            <p className="text-center font-bold text-slate-700 mb-4">¿Cómo está el contenedor?</p>
            {REPORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleReport(opt.key)}
                className="w-full flex items-center gap-4 py-4 px-5 rounded-xl border-2 font-bold text-lg active:scale-[.98] transition-transform"
                style={{ borderColor: opt.color, color: opt.color }}
              >
                <span className="text-2xl">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
