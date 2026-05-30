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
      <h2 className="page-title">Exportar</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card card-body space-y-3">
          <h3 className="font-semibold text-slate-700">📊 Reporte mensual CSV</h3>
          <p className="text-sm text-slate-500">
            Estadísticas del último mes: reportes por día, franja pico y estado predominante.
          </p>
          <button onClick={downloadCsv} disabled={loadingCsv} className="btn btn-blue btn-sm">
            {loadingCsv ? 'Descargando…' : '⬇ Descargar CSV'}
          </button>
        </div>

        <div className="card card-body space-y-3">
          <h3 className="font-semibold text-slate-700">📋 Cartelera semanal PDF</h3>
          <p className="text-sm text-slate-500">
            Afiche imprimible con horarios, estadísticas y consejo de la semana.
          </p>
          <button onClick={downloadPdf} disabled={loadingPdf} className="btn btn-primary btn-sm">
            {loadingPdf ? 'Generando…' : '⬇ Generar PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
