import type { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import type { ListUsersQuery } from '../schemas/user.schema.js'

// The ONLY fields the user list returns. passwordHash is never in here.
const userListSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} satisfies Prisma.UserSelect

export async function listUsers(query: ListUsersQuery) {
  return prisma.user.findMany({
    where: { role: query.role }, // undefined = no filter
    select: userListSelect,
    // id breaks ties, so two users with the same name always come in the same order.
    // PostgreSQL puts users without a name (null) last.
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  })
}
