import { useState } from 'react'
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


export function ExportPage() {
  const { showToast } = useToast()
  const [loadingCsv, setLoadingCsv] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)

  const downloadCsv = async () => {
    setLoadingCsv(true)
    try {
      const res = await api.get('/export/csv', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'reporte_mes.csv'
      a.click()
      URL.revokeObjectURL(url)
      showToast('CSV descargado', 'success')
    } catch {
      showToast('Error al descargar CSV', 'error')
    } finally {
      setLoadingCsv(false)
    }
  }

  const downloadPdf = async () => {
    setLoadingPdf(true)
    try {
      const res = await api.get<PosterData>('/export/poster')
      await generatePDF(res.data)
      showToast('PDF generado', 'success')
    } catch {
      showToast('Error al generar PDF', 'error')
    } finally {
      setLoadingPdf(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-800">Exportar</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          <h3 className="font-semibold text-gray-700">📊 Reporte mensual CSV</h3>
          <p className="text-sm text-gray-500">
            Estadísticas agregadas del último mes: reportes por día, franja pico y estado predominante.
          </p>
          <button
            onClick={downloadCsv}
            disabled={loadingCsv}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingCsv ? 'Descargando…' : '⬇ Descargar CSV'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          <h3 className="font-semibold text-gray-700">📋 Cartelera semanal PDF</h3>
          <p className="text-sm text-gray-500">
            Genera el afiche imprimible con horarios, estadísticas y consejo de la semana.
          </p>
          <button
            onClick={downloadPdf}
            disabled={loadingPdf}
            className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loadingPdf ? 'Generando…' : '⬇ Generar PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}

