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
      const role = await login(alias.trim(), code.trim())
      navigate(role === 'ADMIN' ? '/dashboard' : '/', { replace: true })
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
    <div className="min-h-svh flex flex-col items-center justify-center p-6 bg-slate-100">
      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-6xl">♻</span>
          <h1 className="text-2xl font-bold text-slate-800 mt-3">Gestión de Basuras</h1>
          <p className="text-sm text-slate-500 mt-1">Conjunto Residencial</p>
        </div>

        <div className="card card-body space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Alias</label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="ej. vecino_42"
                autoCapitalize="none"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Código de acceso</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="8 caracteres"
                maxLength={8}
                className="field-input font-mono tracking-widest"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full btn-lg"
            >
              {loading ? 'Verificando…' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6">
          <Link to="/policy" className="text-sm text-brand hover:underline">
            Política de tratamiento de datos
          </Link>
        </p>
      </div>
    </div>
  )
}
