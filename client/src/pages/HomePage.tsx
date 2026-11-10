import { useAuth } from '../auth/useAuth'

export default function HomePage() {
  const { state, logout } = useAuth()
  // ProtectedRoute only renders this page when logged in; this check is for TypeScript.
  if (state.status !== 'authenticated') return null
  const { user } = state

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Hello {user.name} ({user.role})
        </h1>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        <button
          type="button"
          // After logout, ProtectedRoute sees "unauthenticated" and redirects to /login.
          onClick={logout}
          className="mt-6 rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Log out
        </button>
      </div>
    </main>
  )
}
