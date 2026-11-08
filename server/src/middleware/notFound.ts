import type { RequestHandler } from 'express'
import { AppError } from '../errors/AppError.js'

// Runs only when no route matched the request.
// It hands a 404 AppError to the error handler so the response shape stays the same.
export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'))
}
