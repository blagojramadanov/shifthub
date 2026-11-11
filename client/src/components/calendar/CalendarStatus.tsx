import { useEffect, useState } from 'react'

// After this long, explain why loading takes a while (Render free tier cold start).
const SLOW_AFTER_MS = 5000

// The 7-day layout used by the real calendar, shared so the skeleton looks the same.
export const weekGridClass = 'flex flex-col gap-3 md:grid md:grid-cols-7 md:gap-2'

// Grey placeholder blocks in the shape of the calendar while the week loads.
// It's mounted fresh for every load, so the 5 s timer starts over each time.
export function CalendarSkeleton() {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div aria-busy="true">
      <p className="sr-only">Loading shifts…</p>
      {slow && (
        <p aria-live="polite" className="mb-3 text-sm text-slate-500">
          Server may be waking up… This can take up to a minute.
        </p>
      )}
      <div className={weekGridClass}>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-2">
            <div className="mb-3 h-4 w-20 rounded bg-slate-200" />
            <div className="h-14 rounded-lg bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CalendarError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p className="font-medium">Could not load shifts</p>
      <p className="mt-1">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-1.5 font-medium text-red-800 hover:bg-red-100"
      >
        Retry
      </button>
    </div>
  )
}
