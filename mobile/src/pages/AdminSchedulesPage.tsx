import { useEffect, useState } from 'react'
import api from '../api/client'
import { useToast } from '../components/Toast'

interface Schedule {
  id: string
  day_of_week: number
  day_name: string
  time: string
  label: string | null
}

interface EditState {
  day_of_week: number
  time: string
  label: string
}

function ScheduleRow({ s, onSaved }: { s: Schedule; onSaved: () => void }) {
  const { showToast } = useToast()
  const [edit, setEdit] = useState<EditState>({
    day_of_week: s.day_of_week,
    time: s.time,
    label: s.label ?? '',
  })

  const save = async () => {
    try {
      await api.put(`/schedules/${s.id}`, edit)
      showToast('Horario actualizado', 'success')
      onSaved()
    } catch {
      showToast('Error al actualizar', 'error')
    }
  }

  return (
    <tr>
      <td>
        <select
          value={edit.day_of_week}
          onChange={(e) => setEdit({ ...edit, day_of_week: +e.target.value })}
          className="field-select"
        >
          {['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].map((d, i) => (
            <option key={i} value={i}>{d}</option>
          ))}
        </select>
      </td>
      <td>
        <input
          type="time"
          value={edit.time}
          onChange={(e) => setEdit({ ...edit, time: e.target.value })}
          className="field-time"
        />
      </td>
      <td>
        <input
          type="text"
          value={edit.label}
          onChange={(e) => setEdit({ ...edit, label: e.target.value })}
          placeholder="Etiqueta"
          className="field-select w-40"
        />
      </td>
      <td>
        <button onClick={save} className="btn btn-primary btn-sm">
          Guardar
        </button>
      </td>
    </tr>
  )
}

export function AdminSchedulesPage() {
  const { showToast } = useToast()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [modal, setModal] = useState(false)
  const [notif, setNotif] = useState({ new_time: '', day_name: '' })

  const load = async () => {
    const res = await api.get('/schedules/')
    setSchedules(res.data)
  }

  useEffect(() => { load() }, [])

  const sendNotif = async () => {
    try {
      const res = await api.post('/admin/notify/schedule-change', notif)
      showToast(`Enviado a ${res.data.sent} dispositivos`, 'success')
      setModal(false)
    } catch {
      showToast('Error al notificar', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h2 className="page-title">Horarios de recolección</h2>
        <button onClick={() => setModal(true)} className="btn btn-blue">
          📢 Notificar cambio
        </button>
      </div>

      <div className="card overflow-x-auto">
        <div className="card-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>Día</th>
                <th>Hora</th>
                <th>Etiqueta</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <ScheduleRow key={s.id} s={s} onSaved={load} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="card card-body w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-bold text-slate-800">Notificar cambio de horario</h3>
            <div>
              <label className="field-label">Nuevo horario</label>
              <input
                type="time"
                value={notif.new_time}
                onChange={(e) => setNotif({ ...notif, new_time: e.target.value })}
                className="field-time w-full"
              />
            </div>
            <div>
              <label className="field-label">Día de la semana</label>
              <input
                type="text"
                value={notif.day_name}
                placeholder="Ej: Viernes"
                onChange={(e) => setNotif({ ...notif, day_name: e.target.value })}
                className="field-input"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={sendNotif} className="btn btn-blue flex-1">Enviar</button>
              <button onClick={() => setModal(false)} className="btn btn-secondary flex-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
