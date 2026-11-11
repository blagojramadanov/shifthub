import { useAuth } from '../auth/useAuth'
import { WeekCalendar } from '../components/calendar/WeekCalendar'

export default function HomePage() {
  const { state, logout } = useAuth()
  // ProtectedRoute only renders this page when logged in; this check is for TypeScript.
  if (state.status !== 'authenticated') return null
  const { user } = state

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="text-xl font-bold tracking-tight text-slate-900">ShiftHub</span>
          <div className="flex min-w-0 items-center gap-3">
            {/* name can be null in the database; the email is always there. */}
            <span className="truncate text-sm font-medium text-slate-700">
              {user.name ?? user.email}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {user.role === 'MANAGER' ? 'Manager' : 'Employee'}
            </span>
            <button
              type="button"
              // After logout, ProtectedRoute sees "unauthenticated" and redirects to /login.
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <WeekCalendar canEdit={user.role === 'MANAGER'} />
      </main>
    </div>
  )
}
