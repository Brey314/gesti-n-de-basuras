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
const STATUS_DOT: Record<string, string> = {
  EMPTY: 'status-dot-empty', HALF: 'status-dot-half',
  FULL: 'status-dot-full',  OVERFLOW: 'status-dot-overflow',
}

// ── Chart components ───────────────────────────────────────────────────────

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
              <span className="text-xs text-slate-500 w-7 text-right shrink-0">
                {getShortDay(d.date)}
              </span>
              <div className="flex-1 bg-slate-200 rounded h-5 overflow-hidden">
                <div
                  className="bg-slate-700 h-5 rounded transition-all duration-500"
                  style={{ width: `${pct}%`, minWidth: d.count > 0 ? '4px' : '0' }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-700 w-6 text-right shrink-0">
                {d.count}
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-slate-400 mt-3">Promedio diario: {avg} reportes</p>
    </div>
  )
}

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
              <span className="text-xs text-slate-500 w-10 text-right shrink-0 font-mono">
                {row.slot}
              </span>
              <div className="flex-1 bg-slate-200 rounded h-5 overflow-hidden">
                <div
                  className={`${barColor} h-5 rounded transition-all duration-500`}
                  style={{ width: `${barPct}%`, minWidth: row.count > 0 ? '4px' : '0' }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-700 w-14 text-right shrink-0">
                {row.pct.toFixed(0)}%{row.pct >= 70 ? ' ⚠' : ''}
              </span>
            </div>
          )
        })}
      </div>
      {peak.count > 0 && (
        <p className="text-xs text-slate-400 mt-3">
          Pico crítico: {formatSlot(peak.slot)}
        </p>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
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

  const todayCount     = daily[daily.length - 1]?.count ?? 0
  const yesterdayCount = daily[daily.length - 2]?.count ?? 0
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
  const dotClass      = currentStatus ? (STATUS_DOT[currentStatus] ?? 'status-dot-empty') : 'w-3 h-3 rounded-full shrink-0 bg-slate-300'

  return (
    <div>
      {/* Full-bleed page banner */}
      <div className="page-banner">
        <div className="flex items-center gap-2 font-bold tracking-widest text-sm uppercase">
          <span>♻</span> Dashboard Administrativo
        </div>
        <span className="text-xs opacity-60 hidden sm:inline">
          Conjunto Residencial | {user?.alias}
        </span>
      </div>

      <div className="space-y-5">
        {/* KPIs */}
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
                <span className={`${dotClass}${currentStatus === 'OVERFLOW' ? ' animate-pulse' : ''}`} />
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card overflow-hidden">
            <div className="card-section-header">📋 Actividad semanal</div>
            <div className="card-body">
              <p className="text-xs text-slate-400 mb-3">Reportes por día (últimos 7 días)</p>
              <DailyChart data={daily} />
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="card-section-header">⏰ Mapa de calor horario</div>
            <div className="card-body">
              <p className="text-xs text-slate-400 mb-3">Llenado por franja horaria</p>
              <HeatmapChart data={hourly} />
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card overflow-hidden">
          <div className="card-section-header">📋 Actividad reciente</div>
          <div className="overflow-x-auto">
            <table className="data-table data-table-dark">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Alias</th>
                  <th>Reporte</th>
                  <th className="text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-slate-400 py-6">
                      Sin actividad reciente
                    </td>
                  </tr>
                )}
                {recent.map((r, i) => (
                  <tr key={i}>
                    <td className="font-mono text-xs">
                      {new Date(r.created_at).toLocaleTimeString('es-CO', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td>{r.alias}</td>
                    <td>{STATUS_LABELS[r.status] ?? r.status}</td>
                    <td className="text-center">
                      <span
                        className={`inline-block ${STATUS_DOT[r.status] ?? 'status-dot-empty'}${r.status === 'OVERFLOW' ? ' animate-pulse' : ''}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 px-4 py-2 border-t border-slate-100">
            Los reportes individuales se eliminan automáticamente a los 30 días.
          </p>
        </div>
      </div>
    </div>
  )
}
