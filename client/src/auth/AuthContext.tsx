import { useEffect, useState, type ReactNode } from 'react'
import * as api from '../lib/api'
import { AuthContext, type AuthState } from './useAuth'

// Render's free tier can take ~50 seconds to wake up, so allow plenty of time.
const CHECK_TIMEOUT_MS = 90_000

// Holds who is logged in and shares it with the whole app through context.
export function AuthProvider({ children }: { children: ReactNode }) {
  // With a saved token we start in "loading" until /me answers. Without one,
  // we already know the answer. (The function form runs only on the first render.)
  const [state, setState] = useState<AuthState>(() =>
    api.getToken() ? { status: 'loading' } : { status: 'unauthenticated' },
  )
  // Bumped by retry() to run the token check again.
  const [checkAttempt, setCheckAttempt] = useState(0)

  // Any API call that sent a token and got a 401 lands here: the session is over.
  // api.ts has already cleared the token; we update React state so the
  // route guards send the user to /login.
  useEffect(() => {
    api.setUnauthorizedHandler(() => setState({ status: 'unauthenticated' }))
    return () => api.setUnauthorizedHandler(null)
  }, [])

  // On app start (and on retry): if a token is saved, ask the server who it belongs to.
  useEffect(() => {
    if (!api.getToken()) return

    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(CHECK_TIMEOUT_MS)])

    api
      .getMe(signal)
      .then((user) => setState({ status: 'authenticated', user }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return // unmounted (or StrictMode's test re-run)
        // 401: the unauthorized handler already logged us out.
        if (err instanceof api.ApiError && err.status === 401) return
        // Anything else (server asleep, network): keep the token, offer a retry.
        const message = err instanceof Error ? err.message : 'Something went wrong'
        setState({ status: 'error', message })
      })

    return () => controller.abort()
  }, [checkAttempt])

  // Login and register both answer with { token, user }: save the token, we're logged in.
  function startSession({ token, user }: api.AuthResponse) {
    api.setToken(token)
    setState({ status: 'authenticated', user })
  }

  async function login(email: string, password: string) {
    // Throws ApiError on failure (e.g. INVALID_CREDENTIALS): the login form shows it.
    startSession(await api.login(email, password))
  }

  async function register(name: string, email: string, password: string) {
    // Throws ApiError on failure (e.g. EMAIL_TAKEN, VALIDATION_ERROR): the register form shows it.
    startSession(await api.register(name, email, password))
  }

  function logout() {
    // JWTs are stateless, so there is nothing to tell the server: forgetting the token is enough.
    api.clearToken()
    setState({ status: 'unauthenticated' })
  }

  function retry() {
    setState({ status: 'loading' })
    setCheckAttempt((n) => n + 1)
  }

  // React 19: a context can be rendered directly as its own provider.
  return <AuthContext value={{ state, login, register, logout, retry }}>{children}</AuthContext>
}
