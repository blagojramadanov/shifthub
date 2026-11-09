import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { env } from '../config/env.js'
import { AppError } from '../errors/AppError.js'
import { Role } from '../generated/prisma/enums.js'

// What a verified token tells us about the caller. Stored on req.user.
export type AuthUser = { id: number; role: Role }

// One fixed algorithm. Verifying with an explicit list stops a token from
// choosing a different (weaker) algorithm for itself.
const ALGORITHM = 'HS256'

// The token payload, checked again after verifying. The signature proves WE
// signed it, this proves it has the shape the rest of the code expects.
const payloadSchema = z.object({
  sub: z.string().regex(/^\d+$/), // "subject": the user id, as a string by JWT convention
  role: z.enum(Role),
})

export function signToken(user: AuthUser): string {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: ALGORITHM,
  })
}

// Returns the user from a valid token, or throws a 401 AppError.
export function verifyToken(token: string): AuthUser {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] })
    const payload = payloadSchema.parse(decoded)
    return { id: Number(payload.sub), role: payload.role }
  } catch (err) {
    // TokenExpiredError is a subclass of JsonWebTokenError, so check it first.
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'Token expired', 'UNAUTHORIZED')
    }
    // Bad signature, malformed token, wrong payload shape: all just "invalid".
    throw new AppError(401, 'Invalid token', 'UNAUTHORIZED')
  }
}
