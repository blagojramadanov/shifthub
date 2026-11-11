import { formatWeekRange } from '../../lib/dates'

type WeekNavProps = {
  weekStart: Date
  onPrevious: () => void
  onToday: () => void
  onNext: () => void
  // Phase D (managers): the "New shift" button.
  onNewShift?: () => void
}

const navButton =
  'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100'

export function WeekNav({ weekStart, onPrevious, onToday, onNext, onNewShift }: WeekNavProps) {
  return (
    // flex-wrap: on a narrow phone the label moves to its own line instead of overflowing.
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          <button type="button" onClick={onPrevious} className={navButton}>
            <span aria-hidden="true">← </span>Previous
          </button>
          <button type="button" onClick={onToday} className={navButton}>
            Today
          </button>
          <button type="button" onClick={onNext} className={navButton}>
            Next<span aria-hidden="true"> →</span>
          </button>
        </div>
        {/* aria-live: screen readers announce the new week after Previous/Next. */}
        <h2 aria-live="polite" className="text-lg font-semibold text-slate-900">
          {formatWeekRange(weekStart)}
        </h2>
      </div>

      {onNewShift && (
        <button
          type="button"
          onClick={onNewShift}
          className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          New shift
        </button>
      )}
    </div>
  )
}
