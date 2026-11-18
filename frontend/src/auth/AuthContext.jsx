import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/me')
      // GET /me returns the user directly; login/register return { user }.
      const nextUser = data?.user ?? data ?? null
      setUser(nextUser)
      return nextUser
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    const handlePasswordChange = () => navigate('/change-password', { state: { forced: true } })

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    window.addEventListener('auth:password-change-required', handlePasswordChange)
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
      window.removeEventListener('auth:password-change-required', handlePasswordChange)
    }
  }, [navigate])

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/login', credentials)
    const nextUser = data?.user ?? null
    setUser(nextUser)
    return nextUser
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/register', payload)
    const nextUser = data?.user ?? null
    setUser(nextUser)
    return nextUser
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } finally {
      setUser(null)
    }
  }, [])

  const updateUser = useCallback((changes) => {
    setUser((current) => (current ? { ...current, ...changes } : current))
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refresh,
      updateUser,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      isEditor: user?.role === 'editor' || user?.role === 'admin',
      isReader: Boolean(user),
    }),
    [user, loading, login, register, logout, refresh, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
