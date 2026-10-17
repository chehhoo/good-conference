import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getToken, getPerson, setAuth, clearAuth, type StoredPerson } from './auth'
import { conferenceApi } from './api/client'

interface AuthState {
  token: string | null
  person: StoredPerson | null
  login: (token: string, person: StoredPerson) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [token, setToken] = useState<string | null>(getToken)
  const [person, setPerson] = useState<StoredPerson | null>(getPerson)

  // Refresh person (including canSwitch) from the server on load
  useEffect(() => {
    if (!token) return
    conferenceApi.me().then(fresh => {
      const updated = { ...getPerson()!, ...fresh }
      setAuth(token, updated)
      setPerson(updated)
    }).catch(() => {})
  }, [token])

  const login = useCallback((tok: string, p: StoredPerson) => {
    setAuth(tok, p)
    setToken(tok)
    setPerson(p)
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setToken(null)
    setPerson(null)
    qc.clear()
  }, [qc])

  return (
    <AuthContext.Provider value={{ token, person, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
