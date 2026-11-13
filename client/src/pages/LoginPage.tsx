import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { AuthLayout } from '../components/auth/AuthLayout'
import { FormField } from '../components/shifts/FormField'
import { inputClass } from '../components/shifts/inputClass'

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
    <AuthLayout
      subtitle="Sign in to see your shifts"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-slate-900 underline-offset-2 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault() // stop the browser's full-page form submit
          void handleSubmit()
        }}
        className="space-y-4"
      >
        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <FormField id="login-email" label="Email">
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass(false)}
          />
        </FormField>

        <FormField id="login-password" label="Password">
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass(false)}
          />
        </FormField>

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
    </AuthLayout>
  )
}
