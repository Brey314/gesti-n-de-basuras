interface PosterData {
  generated_at: string
  schedules: { day_name: string; time: string; label: string | null }[]
  busiest_days: string[]
  peak_hour: string
  total_reports_week: number
  tip: string
  reports_by_day: { day_name: string; count: number }[]
}

// RGB helpers
type RGB = [number, number, number]
const NAVY: RGB       = [30,  41,  59]   // #1e293b
const EMERALD: RGB    = [16,  185, 129]  // #10b981
const EMERALD_L: RGB  = [52,  211, 153]  // #34d399
const EMERALD_BG: RGB = [236, 253, 245]  // #ecfdf5
const EMERALD_BD: RGB = [167, 243, 208]  // #a7f3d0
const EMERALD_DK: RGB = [6,   95,  70]   // #065f46
const EMERALD_XX: RGB = [6,   78,  59]   // #064e3b
const INDIGO: RGB     = [99,  102, 241]  // #6366f1
const AMBER: RGB      = [245, 158, 11]   // #f59e0b
const WHITE: RGB      = [255, 255, 255]
const SHADOW: RGB     = [221, 227, 237]  // #dde3ed
const LIGHT: RGB      = [248, 250, 252]  // #f8fafc
const LIGHTER: RGB    = [241, 245, 249]  // #f1f5f9
const BORDER: RGB     = [226, 232, 240]  // #e2e8f0
const BORDER_L: RGB   = [203, 213, 225]  // #cbd5e1
const TXT_DARK: RGB   = [15,  23,  42]   // #0f172a
const TXT_MID: RGB    = [71,  85,  105]  // #475569
const TXT_MUTED: RGB  = [100, 116, 139]  // #64748b
const TXT_LIGHT: RGB  = [148, 163, 184]  // #94a3b8

export async function generatePDF(data: PosterData) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })

  const W = 215.9
  const H = 279.4
  const M = 14
  const CW = W - M * 2

  const fill  = (c: RGB) => doc.setFillColor(c[0], c[1], c[2])
  const txt   = (c: RGB) => doc.setTextColor(c[0], c[1], c[2])
  const strk  = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2])

  const fecha = new Date(data.generated_at).toLocaleDateString('es-CO', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  // ── HEADER ────────────────────────────────────────────────────────
  fill(NAVY);  doc.rect(0, 0, W, 44, 'F')
  fill(EMERALD); doc.rect(0, 41, W, 3, 'F')
  fill(EMERALD); doc.rect(0, 0, 5, 41, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(21)
  txt(WHITE)
  doc.text('CARTELERA SEMANAL', W / 2, 16, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  txt(TXT_LIGHT)
  doc.text('GESTION DE CONTENEDORES  |  CONJUNTO RESIDENCIAL', W / 2, 26, { align: 'center' })

  doc.setFontSize(7.5)
  txt(TXT_MUTED)
  doc.text(fecha.toUpperCase(), W / 2, 35, { align: 'center' })

  let y = 52

  // ── KPI CARDS ─────────────────────────────────────────────────────
  const cw = (CW - 8) / 3
  const ch = 28
  const kpis: { label: string; value: string; accent: RGB }[] = [
    { label: 'REPORTES ESTA SEMANA', value: String(data.total_reports_week), accent: EMERALD },
    { label: 'DIAS MAS ACTIVOS',     value: data.busiest_days.length > 0 ? data.busiest_days.join(' / ') : '—', accent: INDIGO },
    { label: 'HORA PICO',            value: data.peak_hour && data.peak_hour !== 'N/A' ? data.peak_hour + 'h' : '—', accent: AMBER },
  ]

  kpis.forEach((kpi, i) => {
    const x = M + i * (cw + 4)
    fill(SHADOW);  doc.roundedRect(x + 0.7, y + 0.7, cw, ch, 3, 3, 'F')
    fill(WHITE);   doc.roundedRect(x, y, cw, ch, 3, 3, 'F')
    fill(kpi.accent)
    doc.roundedRect(x, y, 3.5, ch, 1.5, 1.5, 'F')
    doc.rect(x + 1.8, y, 1.7, ch, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.2)
    txt(TXT_LIGHT)
    doc.text(kpi.label, x + cw / 2 + 1.5, y + 10, { align: 'center' })

    const isLong = kpi.value.length > 9
    doc.setFontSize(isLong ? 9 : 15)
    txt(TXT_DARK)
    doc.text(kpi.value, x + cw / 2 + 1.5, y + 21, { align: 'center' })
  })

  y += ch + 12

  // ── HORARIOS DE RECOLECCION ────────────────────────────────────────
  fill(NAVY);    doc.roundedRect(M, y, CW, 9, 2, 2, 'F')
  fill(EMERALD); doc.roundedRect(M, y, 3, 9, 1, 1, 'F'); doc.rect(M + 1.5, y, 1.5, 9, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  txt(WHITE)
  doc.text('HORARIOS DE RECOLECCION', M + CW / 2, y + 6.2, { align: 'center' })
  y += 12

  fill(LIGHTER); doc.rect(M, y, CW, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  txt(TXT_LIGHT)
  doc.text('DIA', M + 10, y + 5)
  doc.text('HORA', M + 72, y + 5)
  doc.text('DESCRIPCION', M + 112, y + 5)
  y += 7

  data.schedules.forEach((s, i) => {
    if (i % 2 === 0) { fill(WHITE) } else { fill(LIGHT) }
    doc.rect(M, y, CW, 9, 'F')

    fill(EMERALD)
    doc.ellipse(M + 5, y + 4.5, 1.8, 1.8, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    txt(NAVY)
    doc.text(s.day_name, M + 10, y + 6)

    doc.setFont('helvetica', 'normal')
    txt(TXT_MID)
    doc.text(s.time, M + 72, y + 6)
    doc.text(s.label || '—', M + 112, y + 6)

    strk(BORDER); doc.setLineWidth(0.2)
    doc.line(M, y + 9, M + CW, y + 9)
    y += 9
  })

  y += 10

  // ── ACTIVIDAD SEMANAL ──────────────────────────────────────────────
  if (data.reports_by_day && data.reports_by_day.length > 0) {
    fill(NAVY);   doc.roundedRect(M, y, CW, 9, 2, 2, 'F')
    fill(INDIGO); doc.roundedRect(M, y, 3, 9, 1, 1, 'F'); doc.rect(M + 1.5, y, 1.5, 9, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    txt(WHITE)
    doc.text('ACTIVIDAD SEMANAL  (ULTIMOS 7 DIAS)', M + CW / 2, y + 6.2, { align: 'center' })
    y += 12

    const chartH = 30
    const chartPad = 10
    const n = data.reports_by_day.length
    const slot = (CW - chartPad * 2) / n
    const barW = slot * 0.55
    const maxVal = Math.max(...data.reports_by_day.map(d => d.count), 1)

    fill(LIGHT);  doc.roundedRect(M, y, CW, chartH + 16, 3, 3, 'F')
    strk(BORDER); doc.setLineWidth(0.3)
    doc.roundedRect(M, y, CW, chartH + 16, 3, 3, 'S')

    strk(BORDER_L); doc.setLineWidth(0.4)
    doc.line(M + chartPad, y + 5 + chartH, M + CW - chartPad, y + 5 + chartH)

    data.reports_by_day.forEach((day, i) => {
      const barH = (day.count / maxVal) * chartH
      const cx = M + chartPad + i * slot + slot / 2
      const bx = cx - barW / 2

      if (day.count > 0) {
        fill(EMERALD_L); doc.roundedRect(bx, y + 5 + chartH - barH, barW, barH * 0.4, 1, 1, 'F')
        fill(EMERALD);   doc.rect(bx, y + 5 + chartH - barH + barH * 0.4 - 0.5, barW, barH * 0.6 + 0.5, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.5)
        txt(TXT_DARK)
        doc.text(String(day.count), cx, y + 5 + chartH - barH - 1.5, { align: 'center' })
      } else {
        fill(BORDER); doc.roundedRect(bx, y + 5 + chartH - 2, barW, 2, 0.5, 0.5, 'F')
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      txt(TXT_MUTED)
      doc.text(day.day_name, cx, y + 5 + chartH + 7, { align: 'center' })
    })

    y += chartH + 20
  }

  // ── CONSEJO DE LA SEMANA ───────────────────────────────────────────
  const tipLines = doc.splitTextToSize(data.tip, CW - 14)
  const tipH = 14 + tipLines.length * 5.5

  fill(EMERALD_BG); doc.roundedRect(M, y, CW, tipH, 3, 3, 'F')
  strk(EMERALD_BD); doc.setLineWidth(0.3)
  doc.roundedRect(M, y, CW, tipH, 3, 3, 'S')

  fill(EMERALD); doc.roundedRect(M, y, 4, tipH, 2, 2, 'F'); doc.rect(M + 2, y, 2, tipH, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  txt(EMERALD_DK)
  doc.text('CONSEJO DE LA SEMANA', M + 9, y + 8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  txt(EMERALD_XX)
  doc.text(tipLines, M + 9, y + 15)

  // ── FOOTER ────────────────────────────────────────────────────────
  fill(LIGHTER); doc.rect(0, H - 13, W, 13, 'F')
  fill(EMERALD); doc.rect(0, H - 13, W, 0.8, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  txt(TXT_LIGHT)
  doc.text(
    'Sistema de Gestion de Contenedores  |  ' + fecha,
    W / 2, H - 4.5,
    { align: 'center' },
  )

  doc.save('cartelera_semana.pdf')
}
