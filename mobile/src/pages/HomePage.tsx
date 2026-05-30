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
const STATUS_BG: Record<string, string> = {
  EMPTY: 'bg-status-empty', HALF: 'bg-status-half',
  FULL: 'bg-status-full',  OVERFLOW: 'bg-status-overflow',
}
const STATUS_TEXT: Record<string, string> = {
  EMPTY: 'text-status-empty', HALF: 'text-status-half',
  FULL: 'text-status-full',  OVERFLOW: 'text-status-overflow',
}
const STATUS_DOT: Record<string, string> = {
  EMPTY: 'status-dot-empty', HALF: 'status-dot-half',
  FULL: 'status-dot-full',  OVERFLOW: 'status-dot-overflow',
}

const REPORT_OPTIONS = [
  { key: 'EMPTY',    emoji: '🟢', label: 'VACÍO',      textClass: 'text-status-empty',    borderClass: 'border-status-empty' },
  { key: 'HALF',     emoji: '🟡', label: 'MEDIO',      textClass: 'text-status-half',     borderClass: 'border-status-half' },
  { key: 'FULL',     emoji: '🔴', label: 'LLENO',      textClass: 'text-status-full',     borderClass: 'border-status-full' },
  { key: 'OVERFLOW', emoji: '🚨', label: 'DESBORDADO', textClass: 'text-status-overflow', borderClass: 'border-status-overflow' },
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

  const status    = report?.status ?? null
  const bgClass   = status ? (STATUS_BG[status]   ?? 'bg-slate-300')  : 'bg-slate-300'
  const textClass = status ? (STATUS_TEXT[status] ?? 'text-slate-400') : 'text-slate-400'
  const dotClass  = status ? (STATUS_DOT[status]  ?? 'status-dot-empty') : ''
  const label     = status ? (STATUS_LABELS[status] ?? status) : 'Sin datos'

  return (
    <div className="page-container">
      {/* Estado actual */}
      <div className="card card-body flex flex-col items-center gap-4">
        <p className="section-label">Estado del contenedor</p>

        {/* Círculo con pulso para OVERFLOW */}
        <div className="relative flex items-center justify-center">
          {status === 'OVERFLOW' && (
            <span
              className={`absolute inline-flex rounded-full opacity-60 animate-ping ${bgClass}`}
              style={{ width: 120, height: 120 }}
            />
          )}
          <div
            className={`rounded-full transition-colors duration-500 ${bgClass}`}
            style={{ width: 120, height: 120 }}
          />
        </div>

        <p className={`text-3xl font-black ${textClass}`}>{label}</p>

        {report?.alias && report?.minutes_ago !== undefined && (
          <p className="text-sm text-slate-400 text-center">
            Último reporte hace <strong>{report.minutes_ago}</strong> min por <strong>{report.alias}</strong>
          </p>
        )}
        {!status && report?.message && (
          <p className="text-sm text-slate-400">{report.message}</p>
        )}
        {report?.warning && (
          <div className="w-full bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-4 py-2">
            <p className="text-xs text-amber-700 font-medium">⚠ {report.warning}</p>
          </div>
        )}
      </div>

      {/* Botón reportar */}
      <button
        onClick={() => setSheet(true)}
        className="btn btn-primary btn-full btn-lg shadow-md"
      >
        📣 REPORTAR ESTADO
      </button>

      {/* Bottom sheet */}
      {sheet && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-end">
          <div ref={sheetRef} className="w-full max-w-[430px] mx-auto bg-white rounded-t-2xl p-6 pb-10 space-y-3 animate-[slideUp_.25s_ease-out]">
            <p className="text-center font-bold text-slate-700 mb-4">¿Cómo está el contenedor?</p>
            {REPORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleReport(opt.key)}
                className={`w-full flex items-center gap-4 py-4 px-5 rounded-xl border-2 font-bold text-lg active:scale-[.98] transition-transform ${opt.textClass} ${opt.borderClass}`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop: indicator dot below button for extra context */}
      {status && (
        <div className="hidden md:flex items-center gap-3 px-1">
          <div className={dotClass} />
          <span className="text-sm text-slate-500">
            Último estado registrado: <span className={`font-semibold ${textClass}`}>{label}</span>
          </span>
        </div>
      )}
    </div>
  )
}
