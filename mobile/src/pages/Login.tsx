import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [alias,   setAlias]   = useState('')
  const [code,    setCode]    = useState('')
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (alias.length < 3) { setError('El alias debe tener al menos 3 caracteres.'); return }
    if (code.length !== 8) { setError('El código debe tener exactamente 8 caracteres.'); return }
    setError(null)
    setLoading(true)
    try {
      await login(alias.trim(), code.trim())
      navigate('/', { replace: true })
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (detail === 'Alias no disponible') setError('Ese alias ya está en uso. Elige otro.')
      else if (detail?.includes('Código')) setError('Código inválido o ya utilizado.')
      else setError('No se pudo iniciar sesión. Verifica alias y código.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center p-6 bg-slate-50">
      <span className="text-6xl mb-3">♻</span>
      <h1 className="text-2xl font-bold text-slate-800">Gestión de Basuras</h1>
      <p className="text-sm text-slate-500 mb-8">Conjunto Residencial</p>

      <form onSubmit={handleSubmit} className="w-full bg-white rounded-2xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Alias</label>
          <input
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="ej. vecino_42"
            autoCapitalize="none"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Código de acceso</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="8 caracteres"
            maxLength={8}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base font-mono tracking-widest bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-4 rounded-xl text-base font-bold disabled:opacity-50 active:scale-[.98] transition-transform"
        >
          {loading ? 'Verificando…' : 'Ingresar'}
        </button>
      </form>

      <Link to="/policy" className="mt-6 text-sm text-blue-500 underline">
        Política de tratamiento de datos
      </Link>
    </div>
  )
}
