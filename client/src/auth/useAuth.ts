import { createContext, useContext } from 'react'
import type { User } from '../types'

// Where the app is in the login process.
//   loading:         a saved token is being checked with GET /api/auth/me
//   authenticated:   we know who the user is
//   unauthenticated: no (valid) token: show the login page
//   error:           the server couldn't be reached while checking the token
export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'unauthenticated' }
  | { status: 'error'; message: string }

export type AuthContextValue = {
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  retry: () => void
}

// Lives in its own file (not AuthContext.tsx) because the react-refresh lint rule
// wants component files to export only components, so hot reload keeps working.
export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
