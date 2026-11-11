// The shift form's data and rules, as pure functions (no React), so ShiftForm stays small.

import { fromDateTimeLocalValue, toDateTimeLocalValue, withTime } from '../../lib/dates'
import type { ShiftFieldErrors } from '../../lib/formErrors'
import type { CreateShiftInput, Shift, UpdateShiftInput } from '../../types'

// Everything is a string, because that's what inputs hold.
// start/end: "YYYY-MM-DDTHH:mm" in local time. employeeId: '' = open shift.
export type ShiftFormValues = {
  title: string
  start: string
  end: string
  employeeId: string
  position: string
  notes: string
}

// Edit: the shift's current values. Create: the given day, 09:00-17:00, open.
export function initialValues(shift: Shift | undefined, day: Date): ShiftFormValues {
  if (shift) {
    return {
      title: shift.title,
      start: toDateTimeLocalValue(new Date(shift.startTime)),
      end: toDateTimeLocalValue(new Date(shift.endTime)),
      employeeId: shift.employeeId === null ? '' : String(shift.employeeId),
      position: shift.position ?? '',
      notes: shift.notes ?? '',
    }
  }
  return {
    title: '',
    start: toDateTimeLocalValue(withTime(day, 9)),
    end: toDateTimeLocalValue(withTime(day, 17)),
    employeeId: '',
    position: '',
    notes: '',
  }
}

// Client-side checks, run BEFORE converting the times (fromDateTimeLocalValue throws on '').
// The server checks everything again (e.g. the 16-hour maximum).
export function validateShiftForm(values: ShiftFormValues): ShiftFieldErrors {
  const errors: ShiftFieldErrors = {}
  if (values.title.trim() === '') errors.title = 'Title is required'
  if (values.start === '') errors.start = 'Start is required'
  if (values.end === '') errors.end = 'End is required'
  // Both strings are local times, so new Date() reads them the same way.
  if (values.start && values.end && new Date(values.end) <= new Date(values.start)) {
    errors.end = 'End must be after start'
  }
  return errors
}

function toEmployeeId(value: string): number | null {
  return value === '' ? null : Number(value)
}

// POST body. Empty position/notes are LEFT OUT: the create schema doesn't accept null.
export function toCreateInput(values: ShiftFormValues): CreateShiftInput {
  const position = values.position.trim()
  const notes = values.notes.trim()
  return {
    title: values.title.trim(),
    startTime: fromDateTimeLocalValue(values.start),
    endTime: fromDateTimeLocalValue(values.end),
    employeeId: toEmployeeId(values.employeeId),
    // Spreading {} adds nothing, so the key only exists when there's a value.
    ...(position ? { position } : {}),
    ...(notes ? { notes } : {}),
  }
}

// PATCH body. Sends every field; an emptied position/notes becomes null, which clears it.
export function toUpdateInput(values: ShiftFormValues): UpdateShiftInput {
  return {
    title: values.title.trim(),
    startTime: fromDateTimeLocalValue(values.start),
    endTime: fromDateTimeLocalValue(values.end),
    employeeId: toEmployeeId(values.employeeId),
    position: values.position.trim() || null,
    notes: values.notes.trim() || null,
  }
}
