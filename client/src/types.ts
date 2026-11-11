// Shapes of the data the ShiftHub API sends and accepts.
// Dates arrive as ISO strings in UTC ("2026-11-17T07:00:00.000Z"): JSON has no Date type.

export type Role = 'MANAGER' | 'EMPLOYEE'

// The logged-in user, from /api/auth/login and /api/auth/me (publicUserSelect on the server).
// name can be null: the database column is optional, even though register requires it.
export type User = {
  id: number
  name: string | null
  email: string
  role: Role
  createdAt: string
}

// One entry of GET /api/users (managers only).
export type UserSummary = Pick<User, 'id' | 'name' | 'email' | 'role'>

// The assigned employee inside a shift (shiftInclude on the server).
export type ShiftEmployee = {
  id: number
  name: string | null
}

export type Shift = {
  id: string // uuid
  title: string
  startTime: string
  endTime: string
  position: string | null
  notes: string | null
  employeeId: number | null // null = open shift
  employee: ShiftEmployee | null
  createdAt: string
  updatedAt: string
}

// POST /api/shifts. position/notes must be LEFT OUT when empty: create doesn't accept null.
export type CreateShiftInput = {
  title: string
  startTime: string // ISO, from fromDateTimeLocalValue()
  endTime: string
  employeeId?: number | null
  position?: string
  notes?: string
}

// PATCH /api/shifts/:id. Send only what changes; null clears position/notes/employee.
export type UpdateShiftInput = {
  title?: string
  startTime?: string
  endTime?: string
  employeeId?: number | null
  position?: string | null
  notes?: string | null
}
