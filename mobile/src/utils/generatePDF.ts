interface PosterData {
  generated_at: string
  schedules: { day_name: string; time: string; label: string | null }[]
  busiest_days: string[]
  peak_hour: string
  total_reports_week: number
  tip: string
  reports_by_day: { day_name: string; count: number }[]
}

export async function generatePDF(data: PosterData) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })

  const W = 215.9
  const H = 279.4
  const M = 14
  const CW = W - M * 2

  const fecha = new Date(data.generated_at).toLocaleDateString('es-CO', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  // ── HEADER ────────────────────────────────────────────────────────
  doc.setFillColor('#1e293b')
  doc.rect(0, 0, W, 44, 'F')

  // Decorative green bottom strip
  doc.setFillColor('#10b981')
  doc.rect(0, 41, W, 3, 'F')

  // Left accent bar in header
  doc.setFillColor('#10b981')
  doc.rect(0, 0, 5, 41, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(21)
  doc.setTextColor('#ffffff')
  doc.text('CARTELERA SEMANAL', W / 2, 16, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor('#94a3b8')
  doc.text('GESTION DE CONTENEDORES  |  CONJUNTO RESIDENCIAL', W / 2, 26, { align: 'center' })

  doc.setFontSize(7.5)
  doc.setTextColor('#64748b')
  doc.text(fecha.toUpperCase(), W / 2, 35, { align: 'center' })

  let y = 52

  // ── KPI CARDS ─────────────────────────────────────────────────────
  const cw = (CW - 8) / 3
  const ch = 28
  const kpis = [
    { label: 'REPORTES ESTA SEMANA', value: String(data.total_reports_week), accent: '#10b981' },
    {
      label: 'DIAS MAS ACTIVOS',
      value: data.busiest_days.length > 0 ? data.busiest_days.join('  /  ') : '—',
      accent: '#6366f1',
    },
    {
      label: 'HORA PICO',
      value: data.peak_hour && data.peak_hour !== 'N/A' ? data.peak_hour + 'h' : '—',
      accent: '#f59e0b',
    },
  ]

  kpis.forEach((kpi, i) => {
    const x = M + i * (cw + 4)

    // Shadow
    doc.setFillColor('#dde3ed')
    doc.roundedRect(x + 0.7, y + 0.7, cw, ch, 3, 3, 'F')

    // Card background
    doc.setFillColor('#ffffff')
    doc.roundedRect(x, y, cw, ch, 3, 3, 'F')

    // Left accent border
    doc.setFillColor(kpi.accent)
    doc.roundedRect(x, y, 3.5, ch, 1.5, 1.5, 'F')
    doc.rect(x + 1.8, y, 1.7, ch, 'F')

    // Label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.2)
    doc.setTextColor('#94a3b8')
    doc.text(kpi.label, x + cw / 2 + 1.5, y + 10, { align: 'center' })

    // Value
    const isLong = kpi.value.length > 9
    doc.setFontSize(isLong ? 9 : 15)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor('#0f172a')
    doc.text(kpi.value, x + cw / 2 + 1.5, y + 21, { align: 'center' })
  })

  y += ch + 12

  // ── HORARIOS DE RECOLECCION ────────────────────────────────────────
  // Section header
  doc.setFillColor('#1e293b')
  doc.roundedRect(M, y, CW, 9, 2, 2, 'F')
  // Small green left pip
  doc.setFillColor('#10b981')
  doc.roundedRect(M, y, 3, 9, 1, 1, 'F')
  doc.rect(M + 1.5, y, 1.5, 9, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor('#ffffff')
  doc.text('HORARIOS DE RECOLECCION', M + CW / 2, y + 6.2, { align: 'center' })
  y += 12

  // Column header row
  doc.setFillColor('#f1f5f9')
  doc.rect(M, y, CW, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor('#94a3b8')
  doc.text('DIA', M + 10, y + 5)
  doc.text('HORA', M + 72, y + 5)
  doc.text('DESCRIPCION', M + 112, y + 5)
  y += 7

  // Schedule rows
  data.schedules.forEach((s, i) => {
    doc.setFillColor(i % 2 === 0 ? '#ffffff' : '#f8fafc')
    doc.rect(M, y, CW, 9, 'F')

    // Green circle dot
    doc.setFillColor('#10b981')
    doc.circle(M + 5, y + 4.5, 1.8, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor('#1e293b')
    doc.text(s.day_name, M + 10, y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#475569')
    doc.text(s.time, M + 72, y + 6)

    const labelText = s.label || '—'
    doc.text(labelText, M + 112, y + 6)

    doc.setDrawColor('#e2e8f0')
    doc.setLineWidth(0.2)
    doc.line(M, y + 9, M + CW, y + 9)
    y += 9
  })

  y += 10

  // ── ACTIVIDAD SEMANAL ──────────────────────────────────────────────
  if (data.reports_by_day && data.reports_by_day.length > 0) {
    // Section header
    doc.setFillColor('#1e293b')
    doc.roundedRect(M, y, CW, 9, 2, 2, 'F')
    doc.setFillColor('#6366f1')
    doc.roundedRect(M, y, 3, 9, 1, 1, 'F')
    doc.rect(M + 1.5, y, 1.5, 9, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor('#ffffff')
    doc.text('ACTIVIDAD SEMANAL  (ULTIMOS 7 DIAS)', M + CW / 2, y + 6.2, { align: 'center' })
    y += 12

    const chartH = 30
    const chartPad = 10
    const n = data.reports_by_day.length
    const barAreaW = CW - chartPad * 2
    const slot = barAreaW / n
    const barW = slot * 0.55
    const maxVal = Math.max(...data.reports_by_day.map(d => d.count), 1)

    // Chart container
    doc.setFillColor('#f8fafc')
    doc.roundedRect(M, y, CW, chartH + 16, 3, 3, 'F')
    doc.setDrawColor('#e2e8f0')
    doc.setLineWidth(0.3)
    doc.roundedRect(M, y, CW, chartH + 16, 3, 3, 'S')

    // Baseline
    doc.setDrawColor('#cbd5e1')
    doc.setLineWidth(0.4)
    doc.line(M + chartPad, y + 5 + chartH, M + CW - chartPad, y + 5 + chartH)

    data.reports_by_day.forEach((day, i) => {
      const barH = (day.count / maxVal) * chartH
      const cx = M + chartPad + i * slot + slot / 2
      const barX = cx - barW / 2
      const barY = y + 5 + chartH - barH

      if (day.count > 0) {
        // Bar with gradient-like effect (lighter shade on top)
        doc.setFillColor('#34d399')
        doc.roundedRect(barX, barY, barW, barH * 0.4, 1, 1, 'F')
        doc.setFillColor('#10b981')
        doc.rect(barX, barY + barH * 0.4 - 0.5, barW, barH * 0.6 + 0.5, 'F')

        // Count label above bar
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.5)
        doc.setTextColor('#0f172a')
        doc.text(String(day.count), cx, barY - 1.5, { align: 'center' })
      } else {
        doc.setFillColor('#e2e8f0')
        doc.roundedRect(barX, y + 5 + chartH - 2, barW, 2, 0.5, 0.5, 'F')
      }

      // Day label
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor('#64748b')
      doc.text(day.day_name, cx, y + 5 + chartH + 7, { align: 'center' })
    })

    y += chartH + 20
  }

  // ── CONSEJO DE LA SEMANA ───────────────────────────────────────────
  const tipLines = doc.splitTextToSize(data.tip, CW - 14)
  const tipH = 14 + tipLines.length * 5.5

  doc.setFillColor('#ecfdf5')
  doc.roundedRect(M, y, CW, tipH, 3, 3, 'F')
  doc.setDrawColor('#a7f3d0')
  doc.setLineWidth(0.3)
  doc.roundedRect(M, y, CW, tipH, 3, 3, 'S')

  // Left green bar
  doc.setFillColor('#10b981')
  doc.roundedRect(M, y, 4, tipH, 2, 2, 'F')
  doc.rect(M + 2, y, 2, tipH, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor('#065f46')
  doc.text('CONSEJO DE LA SEMANA', M + 9, y + 8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor('#064e3b')
  doc.text(tipLines, M + 9, y + 15)

  // ── FOOTER ────────────────────────────────────────────────────────
  doc.setFillColor('#f1f5f9')
  doc.rect(0, H - 13, W, 13, 'F')
  doc.setFillColor('#10b981')
  doc.rect(0, H - 13, W, 0.8, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor('#94a3b8')
  doc.text(
    'Sistema de Gestion de Contenedores  |  ' + fecha,
    W / 2,
    H - 4.5,
    { align: 'center' },
  )

  doc.save('cartelera_semana.pdf')
}
