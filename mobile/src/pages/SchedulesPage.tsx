import { useEffect, useState } from 'react'
import api from '../api/client'
import { useToast } from '../components/Toast'

interface Schedule { id: string; day_of_week: number; day_name: string; time: string; label: string | null }

function getNextText(schedules: Schedule[]): string {
  if (!schedules.length) return 'Sin horarios'
  const now    = new Date()
  const curDay = now.getDay()
  const curMin = now.getHours() * 60 + now.getMinutes()

  const sorted = schedules
    .map((s) => {
      const [h, m] = s.time.split(':').map(Number)
      const schMin = h * 60 + m
      let d = s.day_of_week - curDay
      if (d < 0) d += 7
      if (d === 0 && schMin <= curMin) d = 7
      return { ...s, minutesUntil: d * 1440 + schMin - curMin }
    })
    .sort((a, b) => a.minutesUntil - b.minutesUntil)

  const next = sorted[0]
  const days = Math.floor(next.minutesUntil / 1440)
  if (days === 0) return `Hoy a las ${next.time}`
  if (days === 1) return `Mañana a las ${next.time}`
  return `${next.day_name} a las ${next.time}`
}

export function SchedulesPage() {
  const { showToast } = useToast()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [push01,    setPush01]    = useState(false)

  useEffect(() => {
    Promise.all([api.get('/schedules/'), api.get('/me/data')])
      .then(([s, me]) => {
        setSchedules(s.data)
        setPush01(me.data.notif_preferences.push01 ?? false)
      })
      .catch(() => {})
  }, [])

  const toggleReminder = async (val: boolean) => {
    setPush01(val)
    try {
      await api.patch('/notifications/preferences', { push01: val })
      showToast(val ? 'Recordatorio activado' : 'Recordatorio desactivado', 'info')
    } catch {
      setPush01(!val)
      showToast('No se pudo actualizar', 'error')
    }
  }

  return (
    <div className="page-container">
      {/* Próximo horario */}
      <div className="bg-slate-800 text-white rounded-2xl p-5">
        <p className="text-xs font-bold text-brand uppercase tracking-wider mb-1">Próximo</p>
        <p className="text-xl font-bold">{getNextText(schedules)}</p>
      </div>

      {/* Toggle recordatorio */}
      <div className="card card-body flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">Recordatorio 30 min antes</p>
          <p className="text-xs text-slate-400 mt-0.5">Notificación antes de cada recolección</p>
        </div>
        <button
          role="switch"
          aria-checked={push01}
          onClick={() => toggleReminder(!push01)}
          className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${push01 ? 'bg-brand' : 'bg-slate-200'}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${push01 ? 'left-6' : 'left-0.5'}`}
          />
        </button>
      </div>

      {/* Lista de horarios */}
      <div>
        <p className="section-label mb-3">Horarios de recolección</p>
        <div className="space-y-2">
          {schedules.map((s) => (
            <div key={s.id} className="card px-5 py-4 flex justify-between items-center">
              <span className="font-semibold text-slate-800">🗓 {s.day_name}</span>
              <div className="text-right">
                <p className="text-lg font-black text-brand">{s.time}</p>
                {s.label && <p className="text-xs text-slate-400">{s.label}</p>}
              </div>
            </div>
          ))}
          {schedules.length === 0 && (
            <p className="text-center text-slate-400 py-8">Sin horarios configurados</p>
          )}
        </div>
      </div>
    </div>
  )
}
