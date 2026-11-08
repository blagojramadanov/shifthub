import { AppError } from '../errors/AppError.js'
import type { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import {
  getShiftTimeError,
  type CreateShiftInput,
  type ListShiftsQuery,
  type UpdateShiftInput,
} from '../schemas/shift.schema.js'

// The ONLY User fields ever returned with a shift. Using `select` (an allow-list)
// means fields added to User later, like a password hash, stay hidden automatically.
const shiftInclude = {
  employee: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ShiftInclude

function shiftNotFound(): AppError {
  return new AppError(404, 'Shift not found', 'SHIFT_NOT_FOUND')
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

export async function listShifts(query: ListShiftsQuery) {
  const { from, to, employeeId } = query

  return prisma.shift.findMany({
    where: {
      employeeId,
      // Every shift that overlaps the from/to window, including a night shift
      // that started before "from". Prisma ignores filters set to undefined.
      endTime: from ? { gt: from } : undefined,
      startTime: to ? { lt: to } : undefined,
    },
    orderBy: { startTime: 'asc' },
    include: shiftInclude,
  })
}

export async function getShiftById(id: string) {
  const shift = await prisma.shift.findUnique({ where: { id }, include: shiftInclude })
  if (!shift) throw shiftNotFound()
  return shift
}

export async function createShift(data: CreateShiftInput) {
  // Unassigned shifts can't clash with anything.
  if (data.employeeId != null) {
    await assertNoOverlap(data.employeeId, data.startTime, data.endTime)
  }

  // A non-existent employeeId makes Prisma throw P2003, which the error handler turns into 400.
  return prisma.shift.create({ data, include: shiftInclude })
}

export async function updateShift(id: string, data: UpdateShiftInput) {
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

export async function deleteShift(id: string): Promise<void> {
  // deleteMany doesn't throw when nothing matches; it reports how many rows it removed.
  const { count } = await prisma.shift.deleteMany({ where: { id } })
  if (count === 0) throw shiftNotFound()
}
