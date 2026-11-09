import bcrypt from 'bcryptjs'
import { AppError } from '../errors/AppError.js'
import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { signToken } from '../lib/jwt.js'
import type { LoginInput, RegisterInput } from '../schemas/auth.schema.js'

// How slow hashing is: each +1 doubles the work. 10 takes roughly 50-100 ms,
// cheap for one login, expensive for an attacker trying billions of guesses.
const SALT_ROUNDS = 10

// The ONLY User fields the API ever returns. passwordHash is never in here.
const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect

// Compared against when the email doesn't exist, so "unknown email" takes as
// long as "wrong password". Otherwise response times would reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', SALT_ROUNDS)

function invalidCredentials(): AppError {
  // Same message for unknown email and wrong password, on purpose.
  return new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')
}

export async function register(data: RegisterInput) {
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)

  try {
    // role is not passed: the database default (EMPLOYEE) applies.
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash },
      select: publicUserSelect,
    })
    return { token: signToken(user), user }
  } catch (err) {
    // P2002 = unique constraint failed. Catching it here (instead of checking
    // first) also covers two sign-ups with the same email at the same moment.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(409, 'An account with this email already exists', 'EMAIL_TAKEN')
    }
    throw err
  }
}

export async function login(data: LoginInput) {
  const found = await prisma.user.findUnique({
    where: { email: data.email },
    select: { ...publicUserSelect, passwordHash: true },
  })

  const passwordOk = await bcrypt.compare(data.password, found?.passwordHash ?? DUMMY_HASH)
  if (!found || !passwordOk) throw invalidCredentials()

  // Take passwordHash out before the user object leaves the service.
  const { passwordHash: _passwordHash, ...user } = found
  return { token: signToken(user), user }
}

export async function getCurrentUser(id: number) {
  const user = await prisma.user.findUnique({ where: { id }, select: publicUserSelect })
  // The token is valid, but the account was deleted since it was issued.
  if (!user) throw new AppError(401, 'User no longer exists', 'UNAUTHORIZED')
  return user
}
