import { daysBetween } from '../../lib/dates'
import type { Shift } from '../../types'

// One card in a day column. continued = the shift started before this week
// (e.g. Sun 22:00 - Mon 06:00) and is shown on Monday as a muted "continuation".
export type DayEntry = { shift: Shift; continued: boolean }

// Splits a week's shifts into 7 lists, Monday to Sunday.
// A shift belongs to the day of its LOCAL start time. A shift that started before
// the week (the API returns it because it overlaps) goes to Monday as a continuation.
// The API sorts by startTime, so continuations come first on Monday automatically.
export function groupShiftsByDay(shifts: Shift[], weekStart: Date): DayEntry[][] {
  const days: DayEntry[][] = [[], [], [], [], [], [], []]

  for (const shift of shifts) {
    const start = new Date(shift.startTime)
    if (start < weekStart) {
      days[0].push({ shift, continued: true })
      continue
    }
    const dayIndex = daysBetween(weekStart, start)
    // Always 0-6 for what the API returns; the check guards against surprises.
    if (dayIndex >= 0 && dayIndex < 7) {
      days[dayIndex].push({ shift, continued: false })
    }
  }

  return days
}
