import { useEffect, useState } from 'react'
import api from '../api/client'
import { useToast } from '../components/Toast'
import { generatePDF } from '../utils/generatePDF'

interface PosterData {
  generated_at: string
  schedules: { day_name: string; time: string; label: string | null }[]
  busiest_days: string[]
  peak_hour: string
  total_reports_week: number
  tip: string
}

export function PosterPage() {
  const { showToast } = useToast()
  const [data, setData] = useState<PosterData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get<PosterData>('/export/poster')
      .then((r) => setData(r.data))
      .catch(() => {})
  }, [])

  const downloadPdf = async () => {
    if (!data) return
    setLoading(true)
    try {
      await generatePDF(data)
      showToast('PDF generado', 'success')
    } catch {
      showToast('Error al generar PDF', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!data) return <p className="text-gray-400 text-sm">Cargando cartelera…</p>

  const fecha = new Date(data.generated_at).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Cartelera semanal</h2>
        <button
          onClick={downloadPdf}
          disabled={loading}
          className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Generando…' : '⬇ Descargar PDF'}
        </button>
      </div>

      {/* Preview card */}
      <div className="bg-white rounded-xl shadow p-8 max-w-xl mx-auto border-t-4 border-green-600 space-y-5">
        <h1 className="text-center font-bold text-lg text-gray-800 leading-tight">
          ♻ INFORMACIÓN SEMANAL<br />ÁREA DE CONTENEDORES
        </h1>

        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Horarios de recolección
          </h3>
          <ul className="space-y-1">
            {data.schedules.map((s, i) => (
              <li key={i} className="text-sm text-gray-700">
                📅 <strong>{s.day_name}</strong> a las <strong>{s.time}</strong>
                {s.label && <span className="text-gray-400"> — {s.label}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Días más activos</p>
            <p className="font-semibold text-gray-800 text-sm">
              {data.busiest_days.join(', ') || '—'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Hora pico</p>
            <p className="font-semibold text-gray-800 text-sm">{data.peak_hour}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 col-span-2">
            <p className="text-xs text-gray-500 mb-1">Reportes esta semana</p>
            <p className="font-semibold text-gray-800 text-sm">{data.total_reports_week} reportes</p>
          </div>
        </section>

        <section className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs font-bold text-green-800 mb-1">💡 CONSEJO</p>
          <p className="text-sm text-green-900">{data.tip}</p>
        </section>

        <p className="text-center text-xs text-gray-400">
          Generado el {fecha} | App Conjunto Residencial
        </p>
      </div>
    </div>
  )
}
