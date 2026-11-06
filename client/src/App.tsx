import { useEffect, useState } from 'react'
import { fetchHealth } from './api'

// Render's free tier can take ~50 seconds to wake up, so allow plenty of time.
const TIMEOUT_MS = 90_000
// After this long, explain why it's taking a while.
const SLOW_AFTER_SECONDS = 5

type Status =
  | { state: 'loading' }
  | { state: 'connected' }
  | { state: 'error'; message: string }

function App() {
  const [status, setStatus] = useState<Status>({ state: 'loading' })
  const [elapsed, setElapsed] = useState(0)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(TIMEOUT_MS)])
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000)

    fetchHealth(signal)
      .then(() => setStatus({ state: 'connected' }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return // component unmounted
        const message =
          err instanceof DOMException && err.name === 'TimeoutError'
            ? `No response after ${TIMEOUT_MS / 1000} seconds`
            : err instanceof Error
              ? err.message
              : 'Unknown error'
        setStatus({ state: 'error', message })
      })
      .finally(() => clearInterval(timer))

    return () => {
      controller.abort()
      clearInterval(timer)
    }
  }, [attempt])

  function retry() {
    setStatus({ state: 'loading' })
    setElapsed(0)
    setAttempt((n) => n + 1)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          ShiftHub
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Shift scheduling made simple
        </p>

        <section
          aria-label="API status"
          aria-live="polite"
          className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
            API status
          </h2>

          {status.state === 'loading' && (
            <>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400" />
                <span className="text-slate-700">Connecting…</span>
              </div>
              {elapsed >= SLOW_AFTER_SECONDS && (
                <p className="mt-2 text-sm text-slate-500">
                  The server may be waking up. This can take up to a minute ({elapsed}s).
                </p>
              )}
            </>
          )}

          {status.state === 'connected' && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-slate-700">API connected</span>
            </div>
          )}

          {status.state === 'error' && (
            <>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-slate-700">{status.message}</span>
              </div>
              <button
                type="button"
                onClick={retry}
                className="mt-4 rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Retry
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
