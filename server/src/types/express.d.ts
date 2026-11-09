import type { AuthUser } from '../lib/jwt.js'

// Adds "user" to Express's Request type (declaration merging).
// requireAuth sets it; it's undefined on routes without requireAuth.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export {}
