import { z } from 'zod'

const MAX_SHIFT_HOURS = 16
const MAX_SHIFT_MS = MAX_SHIFT_HOURS * 60 * 60 * 1000

// An ISO 8601 date-time string with a timezone ("2026-11-08T09:00:00Z" or
// "2026-11-08T09:00:00+01:00"), turned into a Date after validation.
const isoDateTime = z.iso.datetime({ offset: true }).transform((value) => new Date(value))

// Shared rules for start/end times. They only run when both times are present,
// so the same function works for create (both required) and update (both optional).
function checkShiftTimes(data: { startTime?: Date; endTime?: Date }, ctx: z.RefinementCtx) {
  const { startTime, endTime } = data
  if (!startTime || !endTime) return

  const duration = endTime.getTime() - startTime.getTime()
  if (duration <= 0) {
    ctx.addIssue({ code: 'custom', message: 'endTime must be after startTime', path: ['endTime'] })
  } else if (duration > MAX_SHIFT_MS) {
    ctx.addIssue({
      code: 'custom',
      message: `A shift cannot be longer than ${MAX_SHIFT_HOURS} hours`,
      path: ['endTime'],
    })
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

// Query params always arrive as strings, so "coerce" converts them first.
export const listShiftsQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    employeeId: z.coerce.number().int().positive().optional(),
  })
  .refine((q) => !q.from || !q.to || q.from < q.to, {
    message: '"from" must be before "to"',
    path: ['to'],
  })

// TypeScript types generated from the schemas (the values AFTER parsing).
export type CreateShiftInput = z.infer<typeof createShiftSchema>
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>
export type ShiftIdParams = z.infer<typeof shiftIdParamSchema>
export type ListShiftsQuery = z.infer<typeof listShiftsQuerySchema>
