import { createContext, useContext, useState, type ReactNode } from 'react'

export type AccountTier = 'government' | 'operator' | 'resident'

export interface FakeUser {
  name: string
  employeeId: string
  phone: string
  company: string
  tier: AccountTier
}

interface AuthContextValue {
  user: FakeUser | null
  login: (tier?: AccountTier) => void
  logout: () => void
}

const DEMO_USER: FakeUser = {
  name: 'Jordan Whitfield',
  employeeId: 'EMP-48213',
  phone: '(571) 555-0148',
  company: 'Helion Cloud Infrastructure',
  tier: 'operator',
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FakeUser | null>(null)

  const login = () => {
    // Demo login: always resolves to the full-feature business/operator account
    setUser(DEMO_USER)
  }
  const logout = () => setUser(null)

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
