import { useState } from 'react'
import { useAuth } from '../auth/useAuth'

// After this long, explain why signing in is taking a while (Render cold start).
const SLOW_AFTER_MS = 5000

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [slow, setSlow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    const slowTimer = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    try {
      // On success there's nothing else to do: PublicOnlyRoute sees the new
      // "authenticated" state and redirects to /.
      await login(email, password)
    } catch (err) {
      // ApiError carries the server's message, e.g. "Invalid email or password".
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      clearTimeout(slowTimer)
      setSubmitting(false)
      setSlow(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">ShiftHub</h1>
          <p className="mt-2 text-slate-600">Sign in to see your shifts</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault() // stop the browser's full-page form submit
            void handleSubmit()
          }}
          className="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          {slow && (
            <p aria-live="polite" className="text-center text-sm text-slate-500">
              The server may be waking up. This can take up to a minute.
            </p>
          )}
        </form>
      </div>
    </main>
  )
}
