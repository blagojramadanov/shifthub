import type { RequestHandler } from 'express'
import { AppError } from '../errors/AppError.js'
import type { Role } from '../generated/prisma/enums.js'

// Allows only callers with one of the given roles. Use it AFTER requireAuth:
//   router.post('/', requireAuth, requireRole('MANAGER'), ...)
// 401 = we don't know who you are. 403 = we know, and you're not allowed.
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      // Only happens if requireAuth was forgotten before this middleware.
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED')
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'You do not have permission to do this', 'FORBIDDEN')
    }
    next()
  }
}
