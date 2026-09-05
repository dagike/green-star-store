// Mock auth: no passwords or sessions, just a name+email the shopper types in once so
// the order-history page has something to query by. Persisted the same way cart/wishlist
// are, so a "signed in" shopper stays signed in across reloads.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface AuthUser {
  name: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  signIn: (user: AuthUser) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'gss:auth'

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // storage unavailable (private mode, quota) - sign-in still works for the session
    }
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signIn: setUser,
      signOut: () => setUser(null),
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook live together by convention
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
