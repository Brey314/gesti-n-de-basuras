import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [alias, setAlias] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(alias, code)
      navigate('/', { replace: true })
    } catch {
      setError('Alias o código incorrecto. Verifica e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-800 mb-2 text-center">
          ♻ Gestión de Basuras
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">Panel administrativo</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alias</label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de acceso</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              maxLength={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Entrando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
