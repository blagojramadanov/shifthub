import { z } from 'zod'

const MAX_SHIFT_HOURS = 16
const MAX_SHIFT_MS = MAX_SHIFT_HOURS * 60 * 60 * 1000

// An ISO 8601 date-time string with a timezone ("2026-11-08T09:00:00Z" or
// "2026-11-08T09:00:00+01:00"), turned into a Date after validation.
const isoDateTime = z.iso.datetime({ offset: true }).transform((value) => new Date(value))

// The time rules for a shift, as a plain function: returns an error message,
// or null if the times are fine. Used by the schemas below AND by the shift
// service (for updates that change only one of the two times).
export function getShiftTimeError(startTime: Date, endTime: Date): string | null {
  const duration = endTime.getTime() - startTime.getTime()
  if (duration <= 0) return 'endTime must be after startTime'
  if (duration > MAX_SHIFT_MS) return `A shift cannot be longer than ${MAX_SHIFT_HOURS} hours`
  return null
}

// Zod wrapper around getShiftTimeError. It only runs when both times are present,
// so the same function works for create (both required) and update (both optional).
function checkShiftTimes(data: { startTime?: Date; endTime?: Date }, ctx: z.RefinementCtx) {
  const { startTime, endTime } = data
  if (!startTime || !endTime) return

  const message = getShiftTimeError(startTime, endTime)
  if (message) {
    ctx.addIssue({ code: 'custom', message, path: ['endTime'] })
  }
}

const positionField = z.string().trim().max(50)
const notesField = z.string().trim().max(500)

// Field rules shared by create and update.
const shiftFields = {
  title: z.string().trim().min(1).max(100),
  startTime: isoDateTime,
  endTime: isoDateTime,
  position: positionField.optional(),
  notes: notesField.optional(),
  // null means "unassigned"
  employeeId: z.number().int().positive().nullable().optional(),
}

export const createShiftSchema = z.object(shiftFields).superRefine(checkShiftTimes)

// On update, position and notes may also be null, which clears them.
export const updateShiftSchema = z
  .object({ ...shiftFields, position: positionField.nullable(), notes: notesField.nullable() })
  .partial()
  .superRefine(checkShiftTimes)
  // Unknown fields are stripped before this runs, so { foo: 1 } is also "empty".
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Request body must contain at least one field to update',
  })

export const shiftIdParamSchema = z.object({
  id: z.uuid(),
})

// The longest window GET /api/shifts accepts (6 weeks, enough for a month view).
const MAX_RANGE_DAYS = 42
const MAX_RANGE_MS = MAX_RANGE_DAYS * 24 * 60 * 60 * 1000

// A UTC date-time that must end in "Z" ("2026-11-08T23:00:00.000Z"). Without a timezone,
// "2026-11-09T00:00" would be read in the SERVER's local time, which differs between
// a dev PC and Render. The client sends date.toISOString(), which always ends in Z.
const utcDateTime = z.iso.datetime().transform((value) => new Date(value))

// Query params always arrive as strings, so "coerce" converts employeeId first.
export const listShiftsQuerySchema = z
  .object({
    from: utcDateTime.optional(),
    to: utcDateTime.optional(),
    employeeId: z.coerce.number().int().positive().optional(),
  })
  // No path: an object-level problem, so the error handler shows it as the message.
  .refine((q) => (q.from === undefined) === (q.to === undefined), {
    message: '"from" and "to" must be given together',
  })
  .refine((q) => !q.from || !q.to || q.from < q.to, {
    message: '"from" must be before "to"',
    path: ['to'],
  })
  .refine((q) => !q.from || !q.to || q.to.getTime() - q.from.getTime() <= MAX_RANGE_MS, {
    message: `The range from "from" to "to" can be at most ${MAX_RANGE_DAYS} days`,
    path: ['to'],
  })

// TypeScript types generated from the schemas (the values AFTER parsing).
export type CreateShiftInput = z.infer<typeof createShiftSchema>
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>
export type ShiftIdParams = z.infer<typeof shiftIdParamSchema>
export type ListShiftsQuery = z.infer<typeof listShiftsQuerySchema>
