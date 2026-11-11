import { daysBetween, formatTime, formatWeekdayTime } from '../../lib/dates'
import type { DayEntry } from './groupShiftsByDay'

type ShiftCardProps = {
  entry: DayEntry
  // Phase D: opens the shift (edit form for managers, read-only details for employees).
  // Without it the card is plain text, not a button.
  onClick?: () => void
}

export function ShiftCard({ entry, onClick }: ShiftCardProps) {
  const { shift, continued } = entry
  const start = new Date(shift.startTime)
  const end = new Date(shift.endTime)
  const endsLaterDay = daysBetween(start, end) // 0 = same day, 1 = ends the next day
  const isOpen = shift.employeeId === null

  const colors = isOpen
    ? 'border-dashed border-amber-400 bg-amber-50 text-amber-950'
    : 'border-slate-200 bg-white text-slate-900'
  // A continuation keeps its colours (so open stays recognisable), but faded.
  const muted = continued ? 'opacity-60' : ''
  const interactive = onClick
    ? 'cursor-pointer hover:shadow-md focus-visible:outline-2 focus-visible:outline-slate-500'
    : ''

  const content = (
    <>
      <p className="text-xs font-medium tabular-nums text-slate-600">
        {continued ? (
          <>
            <span aria-hidden="true">↳ </span>from {formatWeekdayTime(start)} – {formatTime(end)}
          </>
        ) : (
          <>
            {formatTime(start)} – {formatTime(end)}
            {endsLaterDay > 0 && (
              <sup className="ml-0.5 font-semibold" title="Ends on a later day">
                +{endsLaterDay}
              </sup>
            )}
          </>
        )}
      </p>
      <p className="mt-0.5 text-sm font-semibold break-words">{shift.title}</p>
      <p className={`text-xs break-words ${isOpen ? 'font-medium text-amber-800' : 'text-slate-600'}`}>
        {isOpen ? 'Open' : (shift.employee?.name ?? 'Unnamed employee')}
      </p>
    </>
  )

  const className = `block w-full rounded-lg border px-2.5 py-2 text-left shadow-sm ${colors} ${muted} ${interactive}`

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  )
}
