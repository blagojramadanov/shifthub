import { formatDayHeader, formatTime, isSameDay } from '../../lib/dates'
import type { Shift } from '../../types'

type ShiftDetailsProps = {
  shift: Shift
  onClose: () => void
}

// Read-only view of a shift, for employees. No form and no /api/users call.
export function ShiftDetails({ shift, onClose }: ShiftDetailsProps) {
  const start = new Date(shift.startTime)
  const end = new Date(shift.endTime)
  // A night shift shows the end date too: "Sun 15 Nov, 22:00 – Mon 16 Nov, 06:00".
  const time = isSameDay(start, end)
    ? `${formatDayHeader(start)}, ${formatTime(start)} – ${formatTime(end)}`
    : `${formatDayHeader(start)}, ${formatTime(start)} – ${formatDayHeader(end)}, ${formatTime(end)}`

  const rows: [label: string, value: string][] = [
    ['Title', shift.title],
    ['Time', time],
    ['Position', shift.position ?? '—'],
    ['Assigned to', shift.employee ? (shift.employee.name ?? 'Unnamed employee') : 'Open shift'],
    ['Notes', shift.notes ?? '—'],
  ]

  return (
    <div>
      <dl className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
            {/* pre-wrap keeps the line breaks someone typed into the notes. */}
            <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Close
        </button>
      </div>
    </div>
  )
}
