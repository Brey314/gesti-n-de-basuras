import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { KpiCard } from '../components/KpiCard'

interface Kpis {
  reports_today: number
  active_users: number
  current_status: string | null
  critical_days: number
}
interface DailyRow  { date: string; count: number }
interface HourlyRow { slot: string; count: number; pct: number }
interface RecentRow { alias: string; status: string; created_at: string; minutes_ago: number }

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function getShortDay(dateStr: string) {
  return DAY_SHORT[new Date(dateStr + 'T12:00:00').getDay()]
}

function formatSlot(slot: string) {
  const [a, b] = slot.split('-')
  return `${a}:00-${b}:00`
}

const STATUS_LABELS: Record<string, string> = {
  EMPTY: 'Vacío', HALF: 'Medio', FULL: 'Lleno', OVERFLOW: 'Desbordado',
}
const STATUS_COLORS: Record<string, string> = {
  EMPTY: 'bg-green-500', HALF: 'bg-yellow-400',
  FULL: 'bg-red-500',   OVERFLOW: 'bg-red-600',
}

// ── Horizontal bar chart (daily) ──────────────────────────────────────────────
function DailyChart({ data }: { data: DailyRow[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const avg = data.length
    ? (data.reduce((s, d) => s + d.count, 0) / data.length).toFixed(1)
    : '0'

  return (
    <div>
      <div className="space-y-1.5">
        {data.map(d => {
          const pct = (d.count / max) * 100
          return (
            <div key={d.date} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-7 text-right shrink-0">
                {getShortDay(d.date)}
              </span>
              <div className="flex-1 bg-gray-200 rounded h-5 overflow-hidden">
                <div
                  className="bg-slate-700 h-5 rounded transition-all duration-500"
                  style={{ width: `${pct}%`, minWidth: d.count > 0 ? '4px' : '0' }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-6 text-right shrink-0">
                {d.count}
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3">Promedio diario: {avg} reportes</p>
    </div>
  )
}

// ── Heatmap horizontal bars (similar style to daily) ─────────────────────────
function HeatmapChart({ data }: { data: HourlyRow[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const peak = data.reduce(
    (a, b) => (b.count > a.count ? b : a),
    { slot: '', count: 0, pct: 0 },
  )

  return (
    <div>
      <div className="space-y-1.5">
        {data.map(row => {
          const barPct = (row.count / max) * 100
          const barColor =
            row.pct >= 70 ? 'bg-red-500'
            : row.pct >= 40 ? 'bg-amber-400'
            : 'bg-slate-700'

          return (
            <div key={row.slot} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-10 text-right shrink-0 font-mono">
                {row.slot}
              </span>
              <div className="flex-1 bg-gray-200 rounded h-5 overflow-hidden">
                <div
                  className={`${barColor} h-5 rounded transition-all duration-500`}
                  style={{ width: `${barPct}%`, minWidth: row.count > 0 ? '4px' : '0' }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-14 text-right shrink-0">
                {row.pct.toFixed(0)}%{row.pct >= 70 ? ' ⚠' : ''}
              </span>
            </div>
          )
        })}
      </div>
      {peak.count > 0 && (
        <p className="text-xs text-gray-400 mt-3">
          Pico crítico: {formatSlot(peak.slot)}
        </p>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuth()
  const [kpis,   setKpis]   = useState<Kpis | null>(null)
  const [daily,  setDaily]  = useState<DailyRow[]>([])
  const [hourly, setHourly] = useState<HourlyRow[]>([])
  const [recent, setRecent] = useState<RecentRow[]>([])

  const loadAll = async () => {
    try {
      const [k, d, h, r] = await Promise.all([
        api.get('/stats/kpis'),
        api.get('/stats/daily'),
        api.get('/stats/hourly'),
        api.get('/stats/recent'),
      ])
      setKpis(k.data)
      setDaily(d.data)
      setHourly(h.data)
      setRecent(r.data)
    } catch { /* interceptor handles 401 */ }
  }

  useEffect(() => {
    loadAll()
    const id = setInterval(loadAll, 60_000)
    return () => clearInterval(id)
  }, [])

  // Derived values for KPI subtitles
  const todayCount     = daily.at(-1)?.count ?? 0
  const yesterdayCount = daily.at(-2)?.count ?? 0
  const pctChange = yesterdayCount > 0
    ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100)
    : null

  const lastMinutesAgo = recent[0]?.minutes_ago ?? null

  const busiestDays = [...daily]
    .filter(d => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 2)
    .map(d => getShortDay(d.date))
    .join(' y ')

  const currentStatus = kpis?.current_status ?? null
  const statusLabel   = currentStatus ? (STATUS_LABELS[currentStatus] ?? currentStatus) : '—'
  const statusColor   = currentStatus ? (STATUS_COLORS[currentStatus] ?? 'bg-gray-400') : 'bg-gray-300'

  return (
    <div>
      {/* ── Page title bar ── */}
      <div className="-mx-6 -mt-6 mb-5 bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold tracking-widest text-sm uppercase">
          <span>♻</span> Dashboard Administrativo
        </div>
        <span className="text-xs opacity-60">
          Conjunto Residencial | Sesión: {user?.alias}
        </span>
      </div>

      <div className="space-y-5">
        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Reportes hoy"
            value={kpis?.reports_today ?? '—'}
            subtitle={
              pctChange !== null
                ? `${pctChange >= 0 ? '↑' : '↓'} ${Math.abs(pctChange)}% vs ayer`
                : 'primer día con datos'
            }
          />
          <KpiCard
            title="Usuarios activos"
            value={kpis?.active_users ?? '—'}
            subtitle="activos en últimas 24h"
          />
          <KpiCard
            title="Estado actual"
            value={
              <span className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full shrink-0 ${statusColor}${currentStatus === 'OVERFLOW' ? ' animate-pulse' : ''}`}
                />
                {statusLabel}
              </span>
            }
            subtitle={
              lastMinutesAgo !== null
                ? `última act. ${lastMinutesAgo} min`
                : 'sin actividad reciente'
            }
          />
          <KpiCard
            title="Días críticos / mes"
            value={kpis?.critical_days ?? '—'}
            subtitle={busiestDays || '—'}
          />
        </div>

        {/* ── Charts (side by side) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily */}
          <div className="bg-white rounded shadow overflow-hidden">
            <div className="bg-slate-700 text-white px-4 py-2 text-xs font-bold flex items-center gap-2 tracking-wider">
              📋 ACTIVIDAD SEMANAL
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-400 mb-3">Reportes por día (últimos 7 días)</p>
              <DailyChart data={daily} />
            </div>
          </div>

          {/* Heatmap */}
          <div className="bg-white rounded shadow overflow-hidden">
            <div className="bg-slate-700 text-white px-4 py-2 text-xs font-bold flex items-center gap-2 tracking-wider">
              ⏰ MAPA DE CALOR HORARIO
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-400 mb-3">Llenado por franja horaria</p>
              <HeatmapChart data={hourly} />
            </div>
          </div>
        </div>

        {/* ── Recent activity ── */}
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="bg-slate-700 text-white px-4 py-2 text-xs font-bold flex items-center gap-2 tracking-wider">
            📋 Actividad reciente (últimos reportes)
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white text-xs">
                <th className="px-4 py-2.5 text-left font-medium">Hora</th>
                <th className="px-4 py-2.5 text-left font-medium">Alias</th>
                <th className="px-4 py-2.5 text-left font-medium">Reporte</th>
                <th className="px-4 py-2.5 text-center font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                    Sin actividad reciente
                  </td>
                </tr>
              )}
              {recent.map((r, i) => (
                <tr key={i} className={`border-b last:border-0 ${i % 2 ? 'bg-gray-50' : ''}`}>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-600">
                    {new Date(r.created_at).toLocaleTimeString('es-CO', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-gray-800">{r.alias}</td>
                  <td className="px-4 py-2.5 text-gray-700">
                    {STATUS_LABELS[r.status] ?? r.status}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${STATUS_COLORS[r.status] ?? 'bg-gray-400'}${r.status === 'OVERFLOW' ? ' animate-pulse' : ''}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 px-4 py-2 border-t">
            Los reportes individuales se eliminan automáticamente a los 30 días.
          </p>
        </div>
      </div>
    </div>
  )
}
