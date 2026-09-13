import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, getStoredUserId, setStoredUserId } from '../lib/api'
import type { User } from '../types'

interface RegisterPayload {
  phone: string
  password: string
  nickname: string
  school: string
  grade: string
  major: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (phone: string, password: string) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  certify: (payload: { school: string; grade: string; major: string }) => Promise<User>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const stored = getStoredUserId()
    if (!stored) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const response = await api.get<{ user: User }>('/me')
      setUser(response.user)
    } catch {
      setStoredUserId(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      const stored = getStoredUserId()
      if (stored) {
        await refresh()
        return
      }
      try {
        const response = await api.post<{ user: User }>('/auth/demo')
        setStoredUserId(response.user.id)
        setUser(response.user)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    void bootstrap()
  }, [refresh])

  const login = async (phone: string, password: string) => {
    const response = await api.post<{ user: User }>('/auth/login', { phone, password })
    setStoredUserId(response.user.id)
    setUser(response.user)
    return response.user
  }

  const register = async (payload: RegisterPayload) => {
    const response = await api.post<{ user: User }>('/auth/register', payload)
    setStoredUserId(response.user.id)
    setUser(response.user)
    return response.user
  }

  const certify = async (payload: { school: string; grade: string; major: string }) => {
    const response = await api.post<{ user: User }>('/auth/certify', payload)
    setUser(response.user)
    return response.user
  }

  const logout = () => {
    setStoredUserId(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, loading, login, register, certify, logout, refresh }),
    [user, loading, refresh],
  )

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <div className="flex flex-col items-center gap-3">
            <img src="/assets/logo-mark.svg" alt="" className="size-12 animate-pulse rounded-2xl" />
            <p className="text-sm font-semibold text-slate-500">正在进入校园集市...</p>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

