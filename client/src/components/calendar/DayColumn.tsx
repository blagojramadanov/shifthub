import { formatDayHeader } from '../../lib/dates'
import type { Shift } from '../../types'
import type { DayEntry } from './groupShiftsByDay'
import { ShiftCard } from './ShiftCard'

type DayColumnProps = {
  day: Date
  entries: DayEntry[]
  isToday: boolean
  // Phase D (managers): the "+" button, which opens the form prefilled with this day.
  onAdd?: () => void
  // Phase D: what happens when a shift card is clicked.
  onShiftClick?: (shift: Shift) => void
}

// One day: a column on desktop, a block in the vertical list on mobile.
export function DayColumn({ day, entries, isToday, onAdd, onShiftClick }: DayColumnProps) {
  return (
    <section
      aria-label={formatDayHeader(day)}
      // min-w-0 lets a grid column shrink below its content width (long titles wrap instead).
      className={`min-w-0 rounded-xl border p-2 ${
        isToday ? 'border-slate-900 bg-slate-100' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <header className="mb-2 flex items-center justify-between gap-1">
        <h3 className={`text-sm font-semibold ${isToday ? 'text-slate-900' : 'text-slate-600'}`}>
          {formatDayHeader(day)}
          {isToday && (
            <span className="ml-1.5 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white">
              Today
            </span>
          )}
        </h3>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            aria-label={`Add shift on ${formatDayHeader(day)}`}
            className="rounded-md px-2 text-lg leading-none text-slate-500 hover:bg-slate-200 hover:text-slate-900"
          >
            +
          </button>
        )}
      </header>

      {entries.length === 0 ? (
        <p className="py-1 text-xs text-slate-400">No shifts</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            // The same shift can't appear twice in one day, so its id is a stable key.
            <li key={entry.shift.id}>
              <ShiftCard
                entry={entry}
                onClick={onShiftClick ? () => onShiftClick(entry.shift) : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
