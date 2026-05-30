interface PosterData {
  generated_at: string
  schedules: { day_name: string; time: string; label: string | null }[]
  busiest_days: string[]
  peak_hour: string
  total_reports_week: number
  tip: string
}

export async function generatePDF(data: PosterData) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  let y = 20

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMACION SEMANAL - AREA DE CONTENEDORES', 105, y, { align: 'center' })
  y += 12

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('HORARIOS DE RECOLECCION:', 15, y)
  y += 6
  for (const s of data.schedules) {
    doc.text(`- ${s.day_name} a las ${s.time}${s.label ? ' - ' + s.label : ''}`, 20, y)
    y += 5
  }
  y += 4

  doc.setFont('helvetica', 'bold')
  doc.text('DIAS DE MAYOR ACTIVIDAD:', 15, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.busiest_days.join(', ') || '-', 70, y)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.text('HORA PICO:', 15, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.peak_hour, 45, y)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.text('ACTIVIDAD DE LA SEMANA:', 15, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.total_reports_week} reportes`, 75, y)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.text('CONSEJO:', 15, y)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(data.tip, 160)
  doc.text(lines, 15, y + 5)
  y += 5 + lines.length * 5 + 10

  doc.setFontSize(8)
  doc.setTextColor(150)
  const fecha = new Date(data.generated_at).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  doc.text(`Generado el ${fecha} | App Conjunto Residencial`, 105, 265, { align: 'center' })

  doc.save('cartelera_semana.pdf')
}
