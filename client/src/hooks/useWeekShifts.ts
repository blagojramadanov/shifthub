import { useEffect, useState } from 'react'
import { listShifts } from '../api/shifts'
import { addDays } from '../lib/dates'
import type { Shift } from '../types'

// Render's free tier can take ~50 seconds to wake up, so allow plenty of time.
const TIMEOUT_MS = 90_000

export type WeekShiftsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  // refreshing: these are the week's previous shifts, a reload is still running.
  | { status: 'ready'; shifts: Shift[]; refreshing: boolean }

// A finished request, remembered together with the request it answers and its week.
type Result = { key: string; weekStartMs: number } & ({ shifts: Shift[] } | { message: string })

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
      .then((shifts) => setResult({ key, weekStartMs, shifts }))
      .catch((err: unknown) => {
        // Cancelled because the week changed or the component unmounted: ignore.
        if (controller.signal.aborted) return
        // A 401 has already logged the user out (see lib/api.ts); this message is never seen.
        setResult({ key, weekStartMs, message: err instanceof Error ? err.message : 'Something went wrong' })
      })

    // Runs before the next request starts, so a slow answer for an old week
    // can never overwrite the week the user is looking at now.
    return () => controller.abort()
  }, [key, weekStartMs])

  function reload() {
    setAttempt((n) => n + 1)
  }

  // The answer to the current request has arrived.
  if (result && result.key === key) {
    if ('message' in result) return { status: 'error', message: result.message, reload }
    return { status: 'ready', shifts: result.shifts, refreshing: false, reload }
  }

  // Reloading the SAME week (after a save): keep showing its previous shifts until the
  // new answer arrives, instead of flashing the skeleton. The new cards then simply
  // replace the old ones.
  if (result && result.weekStartMs === weekStartMs && 'shifts' in result) {
    return { status: 'ready', shifts: result.shifts, refreshing: true, reload }
  }

  // A week with no data yet (first load, another week, or Retry after an error).
  // "Loading" isn't stored: it's simply "no usable result for the CURRENT key yet".
  // That way the effect never has to call setState synchronously to reset it.
  return { status: 'loading', reload }
}
