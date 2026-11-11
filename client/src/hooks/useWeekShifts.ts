import { useEffect, useState } from 'react'
import { listShifts } from '../api/shifts'
import { addDays } from '../lib/dates'
import type { Shift } from '../types'

// Render's free tier can take ~50 seconds to wake up, so allow plenty of time.
const TIMEOUT_MS = 90_000

export type WeekShiftsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; shifts: Shift[] }

// A finished request, remembered together with the request it answers.
type Result = { key: string } & ({ shifts: Shift[] } | { message: string })

// Loads every shift that overlaps the week starting at weekStart (Monday 00:00 local).
// reload() fetches the same week again (Retry button, and later after saving a shift).
export function useWeekShifts(weekStart: Date): WeekShiftsState & { reload: () => void } {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)

  // Which request the screen needs right now. A number in the effect's dependencies
  // instead of the Date object: a new Date for the same week must not refetch.
  const weekStartMs = weekStart.getTime()
  const key = `${weekStartMs}:${attempt}`

  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(TIMEOUT_MS)])
    const from = new Date(weekStartMs)

    listShifts({ from, to: addDays(from, 7) }, signal)
      .then((shifts) => setResult({ key, shifts }))
      .catch((err: unknown) => {
        // Cancelled because the week changed or the component unmounted: ignore.
        if (controller.signal.aborted) return
        // A 401 has already logged the user out (see lib/api.ts); this message is never seen.
        setResult({ key, message: err instanceof Error ? err.message : 'Something went wrong' })
      })

    // Runs before the next request starts, so a slow answer for an old week
    // can never overwrite the week the user is looking at now.
    return () => controller.abort()
  }, [key, weekStartMs])

  function reload() {
    setAttempt((n) => n + 1)
  }

  // "Loading" isn't stored: it's simply "no result for the CURRENT key yet".
  // That way the effect never has to call setState synchronously to reset it.
  if (!result || result.key !== key) return { status: 'loading', reload }
  if ('message' in result) return { status: 'error', message: result.message, reload }
  return { status: 'ready', shifts: result.shifts, reload }
}
