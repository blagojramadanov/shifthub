import { formatDayHeader, formatWeekdayShort } from '../../lib/dates'
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
  // "Thu 12 Nov" or "Thu 12 Nov, today": the full text for screen readers.
  const label = isToday ? `${formatDayHeader(day)}, today` : formatDayHeader(day)

  return (
    <section
      aria-label={label}
      // aria-current="date": the standard way to mark today's date for assistive technology.
      aria-current={isToday ? 'date' : undefined}
      // min-w-0 lets a grid column shrink below its content width (long titles wrap instead).
      className={`min-w-0 rounded-xl border p-2 ${
        isToday ? 'border-slate-300 bg-slate-100' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <header className="mb-2 flex items-start justify-between gap-1">
        {/* Two short lines (weekday, date number) fit even the narrowest 7-column layout.
            The month is in the week title above, and in the sr-only label. */}
        <h3>
          <span className="sr-only">{label}</span>
          <span aria-hidden="true" className="flex flex-col items-start">
            <span
              className={`text-xs font-medium uppercase tracking-wide ${
                isToday ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              {formatWeekdayShort(day)}
            </span>
            {/* Same h-7 w-7 box on every day, so all headers have the same height and the
                cards line up across columns. Only today's is filled. */}
            <span
              className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                isToday ? 'bg-slate-900 text-white' : 'text-slate-700'
              }`}
            >
              {day.getDate()}
            </span>
          </span>
        </h3>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            aria-label={`Add shift on ${formatDayHeader(day)}`}
            // shrink-0: the button never squeezes the heading.
            className="shrink-0 rounded-md px-2 text-lg leading-none text-slate-500 hover:bg-slate-200 hover:text-slate-900"
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
