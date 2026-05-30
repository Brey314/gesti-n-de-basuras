import { createContext, useContext, useEffect, useState } from 'react'
import api, { setApiToken } from '../api/client'

interface User {
  alias: string
  role: string
}

interface AuthContextValue {
  user: User | null
  login: (alias: string, code: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const logout = () => {
    setUser(null)
    setApiToken(null)
  }

  const login = async (alias: string, code: string) => {
    const res = await api.post('/auth/login', { alias, code })
    setApiToken(res.data.access_token)
    setUser({ alias: res.data.alias, role: res.data.role })
  }

  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
