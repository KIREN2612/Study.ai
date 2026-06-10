import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authAPI } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)  // checking stored token

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const email = localStorage.getItem('user_email')
    if (token && email) {
      setUser({ email, token })
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login(email, password)
    const { access_token } = res.data
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('user_email', email)
    setUser({ email, token: access_token })
    return res.data
  }, [])

  const register = useCallback(async (email, password) => {
    const res = await authAPI.register(email, password)
    return res.data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_email')
    setUser(null)
  }, [])

  const isAuthenticated = Boolean(user?.token)

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
