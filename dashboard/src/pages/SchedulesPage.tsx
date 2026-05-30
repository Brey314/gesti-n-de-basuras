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
    <tr className="border-b">
      <td className="py-2 pr-4">
        <select
          value={edit.day_of_week}
          onChange={(e) => setEdit({ ...edit, day_of_week: +e.target.value })}
          className="border rounded px-2 py-1 text-sm"
        >
          {['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].map((d, i) => (
            <option key={i} value={i}>{d}</option>
          ))}
        </select>
      </td>
      <td className="py-2 pr-4">
        <input
          type="time"
          value={edit.time}
          onChange={(e) => setEdit({ ...edit, time: e.target.value })}
          className="border rounded px-2 py-1 text-sm"
        />
      </td>
      <td className="py-2 pr-4">
        <input
          type="text"
          value={edit.label}
          onChange={(e) => setEdit({ ...edit, label: e.target.value })}
          placeholder="Etiqueta"
          className="border rounded px-2 py-1 text-sm w-40"
        />
      </td>
      <td className="py-2">
        <button
          onClick={save}
          className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700"
        >
          Guardar
        </button>
      </td>
    </tr>
  )
}

export function SchedulesPage() {
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Horarios de recolección</h2>
        <button
          onClick={() => setModal(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          📢 Notificar cambio de horario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 font-medium">Día</th>
              <th className="pb-2 font-medium">Hora</th>
              <th className="pb-2 font-medium">Etiqueta</th>
              <th className="pb-2 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <ScheduleRow key={s.id} s={s} onSaved={load} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-bold text-gray-800">Notificar cambio de horario</h3>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Nuevo horario</label>
              <input
                type="time"
                value={notif.new_time}
                onChange={(e) => setNotif({ ...notif, new_time: e.target.value })}
                className="border rounded px-3 py-1.5 text-sm w-full"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Día de la semana</label>
              <input
                type="text"
                value={notif.day_name}
                placeholder="Ej: Viernes"
                onChange={(e) => setNotif({ ...notif, day_name: e.target.value })}
                className="border rounded px-3 py-1.5 text-sm w-full"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={sendNotif}
                className="flex-1 bg-blue-600 text-white py-2 rounded text-sm font-semibold hover:bg-blue-700"
              >
                Enviar
              </button>
              <button
                onClick={() => setModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded text-sm hover:bg-gray-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
