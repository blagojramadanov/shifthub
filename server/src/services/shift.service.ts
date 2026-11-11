import { AppError } from '../errors/AppError.js'
import type { Prisma } from '../generated/prisma/client.js'
import type { Role } from '../generated/prisma/enums.js'
import { prisma } from '../lib/prisma.js'
import {
  getShiftTimeError,
  type CreateShiftInput,
  type ListShiftsQuery,
  type UpdateShiftInput,
} from '../schemas/shift.schema.js'

// The ONLY User fields ever returned with a shift: what the calendar shows, nothing more.
// Using `select` (an allow-list) means fields added to User later, like a password hash,
// stay hidden automatically.
const shiftInclude = {
  employee: { select: { id: true, name: true } },
} satisfies Prisma.ShiftInclude

// Who is making the request. A plain object, so this service knows nothing about
// Express or JWTs: the controller builds it from req.user.
export type Actor = { id: number; role: Role }

function shiftNotFound(): AppError {
  return new AppError(404, 'Shift not found', 'SHIFT_NOT_FOUND')
}

function forbidden(): AppError {
  return new AppError(403, 'You do not have permission to do this', 'FORBIDDEN')
}

// Second guard behind requireRole('MANAGER') on the routes, in case a route ever forgets it.
function assertManager(actor: Actor): void {
  if (actor.role !== 'MANAGER') throw forbidden()
}

// Which shifts a caller may see. Managers see everything. Employees see their
// own shifts plus open (unassigned) ones. Spread into any `where` to apply it.
function visibleShiftsWhere(actor: Actor): Prisma.ShiftWhereInput {
  if (actor.role === 'MANAGER') return {}
  return { OR: [{ employeeId: actor.id }, { employeeId: null }] }
}

// Rule: an employee can't work two shifts at the same time.
// Two time ranges overlap when each one starts before the other one ends.
// Back-to-back shifts (one ends at 14:00, the next starts at 14:00) are allowed.
async function assertNoOverlap(
  employeeId: number,
  startTime: Date,
  endTime: Date,
  excludeShiftId?: string,
): Promise<void> {
  const conflict = await prisma.shift.findFirst({
    where: {
      employeeId,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      // On update, the shift being changed must not count as a conflict with itself.
      id: excludeShiftId ? { not: excludeShiftId } : undefined,
    },
    select: { id: true, title: true, startTime: true, endTime: true },
  })

  if (conflict) {
    throw new AppError(409, 'Employee already has a shift during this time', 'SHIFT_OVERLAP', {
      conflictingShift: conflict,
    })
  }
}

export async function listShifts(query: ListShiftsQuery, actor: Actor) {
  const { from, to, employeeId } = query

  // Employees may filter by their own id only. employeeId is already a number here
  // (validate() replaced req.query with the Zod-parsed values), so !== is safe.
  if (actor.role === 'EMPLOYEE' && employeeId !== undefined && employeeId !== actor.id) {
    throw forbidden()
  }

  return prisma.shift.findMany({
    where: {
      // Two separate conditions, both required. With AND, no filter key can ever
      // overwrite a key of the visibility rule (as spreading both into one object could).
      // An employee filtering by their own id gets only their assigned shifts (no open ones).
      AND: [
        visibleShiftsWhere(actor),
        {
          employeeId,
          // Every shift that OVERLAPS the from/to window: it starts before the window ends
          // and ends after it starts. So a Sun 22:00 - Mon 06:00 night shift is in both weeks.
          // The schema guarantees from and to come together. Prisma ignores undefined filters.
          startTime: to ? { lt: to } : undefined,
          endTime: from ? { gt: from } : undefined,
        },
      ],
    },
    orderBy: { startTime: 'asc' },
    include: shiftInclude,
  })
}

export async function getShiftById(id: string, actor: Actor) {
  // findFirst instead of findUnique, because the where also has the visibility rule.
  // A shift the employee may not see gives the same 404 as one that doesn't exist,
  // so they can't find out it exists.
  const shift = await prisma.shift.findFirst({
    where: { id, ...visibleShiftsWhere(actor) },
    include: shiftInclude,
  })
  if (!shift) throw shiftNotFound()
  return shift
}

export async function createShift(data: CreateShiftInput, actor: Actor) {
  assertManager(actor)

  // Unassigned shifts can't clash with anything.
  if (data.employeeId != null) {
    await assertNoOverlap(data.employeeId, data.startTime, data.endTime)
  }

  // A non-existent employeeId makes Prisma throw P2003, which the error handler turns into 400.
  return prisma.shift.create({ data, include: shiftInclude })
}

export async function updateShift(id: string, data: UpdateShiftInput, actor: Actor) {
  assertManager(actor)

  const existing = await prisma.shift.findUnique({ where: { id } })
  if (!existing) throw shiftNotFound()

  // The shift as it WILL look after the update: new values where sent, stored values otherwise.
  const startTime = data.startTime ?? existing.startTime
  const endTime = data.endTime ?? existing.endTime
  const employeeId = data.employeeId !== undefined ? data.employeeId : existing.employeeId

  // Zod already checked the times when both were sent. When only one is sent,
  // this is the first time we can compare it with the stored one.
  const timeError = getShiftTimeError(startTime, endTime)
  if (timeError) {
    const field = data.endTime ? 'endTime' : 'startTime'
    throw new AppError(400, timeError, 'VALIDATION_ERROR', { [field]: [timeError] })
  }

  if (employeeId !== null) {
    await assertNoOverlap(employeeId, startTime, endTime, id)
  }

  return prisma.shift.update({ where: { id }, data, include: shiftInclude })
}

export async function deleteShift(id: string, actor: Actor): Promise<void> {
  assertManager(actor)

  // deleteMany doesn't throw when nothing matches; it reports how many rows it removed.
  const { count } = await prisma.shift.deleteMany({ where: { id } })
  if (count === 0) throw shiftNotFound()
}
