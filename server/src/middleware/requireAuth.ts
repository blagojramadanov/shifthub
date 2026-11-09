import type { RequestHandler } from 'express'
import { AppError } from '../errors/AppError.js'
import { verifyToken } from '../lib/jwt.js'

// Lets the request through only with a valid "Authorization: Bearer <token>" header,
// and puts the caller's { id, role } on req.user.
// It trusts the token and doesn't query the database (fast, stateless). A role change
// therefore takes effect when the user's current token expires.
export const requireAuth: RequestHandler = (req, _res, next) => {
  const match = req.headers.authorization?.match(/^Bearer\s+(\S+)$/i)
  if (!match) {
    throw new AppError(401, 'Missing or malformed Authorization header', 'UNAUTHORIZED')
  }

  req.user = verifyToken(match[1]) // throws a 401 AppError if the token is bad
  next()
}
