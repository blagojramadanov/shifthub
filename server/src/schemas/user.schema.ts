import { z } from 'zod'
import { Role } from '../generated/prisma/enums.js'

// GET /api/users?role=EMPLOYEE. Without role, every user is returned.
// z.enum(Role) uses the Prisma enum, so a new role in schema.prisma is accepted automatically.
export const listUsersQuerySchema = z.object({
  role: z.enum(Role).optional(),
})

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>
