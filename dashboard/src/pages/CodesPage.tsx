import { useEffect, useState } from 'react'
import api from '../api/client'
import { CodeStatusChip } from '../components/CodeStatusChip'
import { useToast } from '../components/Toast'

interface Code {
  id: string
  code: string
  status: string
  created_at: string
  used_at: string | null
}

interface CodesResponse {
  codes: Code[]
  summary: { total: number; active: number; used: number; suspended: number; revoked: number }
}

export function CodesPage() {
  const { showToast } = useToast()
  const [data, setData] = useState<CodesResponse | null>(null)
  const [newCode, setNewCode] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    const res = await api.get<CodesResponse>('/codes/')
    setData(res.data)
  }

  useEffect(() => { load() }, [])

  const generate = async () => {
    try {
      const res = await api.post('/codes/')
      setNewCode(res.data.code)
      setShowModal(true)
      await load()
    } catch {
      showToast('Error al generar código', 'error')
    }
  }

  const patchStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/codes/${id}`, { status })
      showToast(`Código ${status.toLowerCase()}`, 'success')
      await load()
    } catch {
      showToast('Error al actualizar estado', 'error')
    }
  }

  const copy = () => {
    if (newCode) navigator.clipboard.writeText(newCode)
    showToast('Código copiado', 'success')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Códigos de acceso</h2>
          {data && (
            <p className="text-sm text-gray-500 mt-0.5">
              {data.summary.active} activos / {data.summary.total} total
            </p>
          )}
        </div>
        <button
          onClick={generate}
          className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700"
        >
          ＋ Generar código
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Creado</th>
              <th className="px-4 py-3 font-medium">Usado el</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.codes.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                <td className="px-4 py-3"><CodeStatusChip status={c.status} /></td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(c.created_at).toLocaleDateString('es-CO')}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {c.used_at ? new Date(c.used_at).toLocaleDateString('es-CO') : '—'}
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => patchStatus(c.id, 'SUSPENDED')}
                    disabled={c.status !== 'ACTIVE'}
                    className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200 disabled:opacity-40"
                  >
                    Suspender
                  </button>
                  <button
                    onClick={() => patchStatus(c.id, 'REVOKED')}
                    disabled={c.status === 'REVOKED'}
                    className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-40"
                  >
                    Revocar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nuevo código */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl p-6 w-full max-w-xs shadow-xl text-center space-y-4">
            <h3 className="font-bold text-gray-800">Código generado</h3>
            <p className="font-mono text-3xl font-bold text-green-700 tracking-widest">{newCode}</p>
            <div className="flex gap-2">
              <button
                onClick={copy}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded text-sm hover:bg-gray-200"
              >
                📋 Copiar
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-semibold hover:bg-green-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
