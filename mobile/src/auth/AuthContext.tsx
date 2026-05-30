import { createContext, useContext, useEffect, useState } from 'react'
import api, { setApiToken, getStoredToken } from '../api/client'

interface User { alias: string; role: string }

interface AuthContextValue {
  user: User | null
  login: (alias: string, code: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const USER_KEY = 'mb_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') }
    catch { return null }
  })

  // Sincroniza el token en memoria al arrancar
  useEffect(() => {
    const t = getStoredToken()
    if (t) setApiToken(t)
    else setUser(null)
  }, [])

  // Escucha 401 global del interceptor
  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  const login = async (alias: string, code: string) => {
    let data: { access_token: string; alias: string; role: string }
    try {
      const res = await api.post('/auth/login', { alias, code })
      data = res.data
    } catch {
      const res = await api.post('/auth/register', { alias, code })
      data = res.data
    }
    setApiToken(data.access_token)
    const u = { alias: data.alias, role: data.role }
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
  }

  const logout = () => {
    setApiToken(null)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
