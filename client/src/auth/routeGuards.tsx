import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from './useAuth'

// A centered message for the "checking your login" and "can't reach the server" screens.
function FullPageMessage({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center text-slate-700">{children}</div>
    </main>
  )
}

// Shown while a saved token is checked, or when that check couldn't reach the server.
// Returns null when the status is settled and the guard can decide.
function AuthPending() {
  const { state, retry } = useAuth()

  if (state.status === 'loading') {
    return (
      <FullPageMessage>
        <div className="flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400" />
          <span>Loading…</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          The server may be waking up. This can take up to a minute.
        </p>
      </FullPageMessage>
    )
  }

  if (state.status === 'error') {
    return (
      <FullPageMessage>
        <p>{state.message}</p>
        <button
          type="button"
          onClick={retry}
          className="mt-4 rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Retry
        </button>
      </FullPageMessage>
    )
  }

  return null
}

// Only for logged-in users. Everyone else is sent to /login.
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { state } = useAuth()
  if (state.status === 'loading' || state.status === 'error') return <AuthPending />
  if (state.status === 'unauthenticated') return <Navigate to="/login" replace />
  return children
}

// Only for logged-out users (the login page). Logged-in users are sent to /.
// This is also what moves the user to / right after a successful login.
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { state } = useAuth()
  if (state.status === 'loading' || state.status === 'error') return <AuthPending />
  if (state.status === 'authenticated') return <Navigate to="/" replace />
  return children
}
