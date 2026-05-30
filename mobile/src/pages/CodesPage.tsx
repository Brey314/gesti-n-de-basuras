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
      <div className="page-header">
        <div>
          <h2 className="page-title">Códigos de acceso</h2>
          {data && (
            <p className="text-sm text-slate-500 mt-0.5">
              {data.summary.active} activos / {data.summary.total} total
            </p>
          )}
        </div>
        <button onClick={generate} className="btn btn-primary">
          ＋ Generar código
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Estado</th>
              <th>Creado</th>
              <th>Usado el</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.codes.map((c) => (
              <tr key={c.id}>
                <td className="font-mono font-bold">{c.code}</td>
                <td><CodeStatusChip status={c.status} /></td>
                <td className="text-slate-500 text-xs">
                  {new Date(c.created_at).toLocaleDateString('es-CO')}
                </td>
                <td className="text-slate-500 text-xs">
                  {c.used_at ? new Date(c.used_at).toLocaleDateString('es-CO') : '—'}
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => patchStatus(c.id, 'SUSPENDED')}
                      disabled={c.status !== 'ACTIVE'}
                      className="btn btn-warning btn-sm"
                    >
                      Suspender
                    </button>
                    <button
                      onClick={() => patchStatus(c.id, 'REVOKED')}
                      disabled={c.status === 'REVOKED'}
                      className="btn btn-danger btn-sm"
                    >
                      Revocar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="card card-body w-full max-w-xs shadow-xl text-center space-y-4">
            <h3 className="font-bold text-slate-800">Código generado</h3>
            <p className="font-mono text-3xl font-bold text-brand tracking-widest">{newCode}</p>
            <div className="flex gap-2">
              <button onClick={copy} className="btn btn-secondary flex-1">
                📋 Copiar
              </button>
              <button onClick={() => setShowModal(false)} className="btn btn-primary flex-1">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
