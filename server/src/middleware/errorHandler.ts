import type { ErrorRequestHandler } from 'express'
import { z, ZodError } from 'zod'
import { AppError } from '../errors/AppError.js'
import { Prisma } from '../generated/prisma/client.js'

// Every error response has this shape.
type ErrorBody = {
  error: { message: string; code: string; details?: unknown }
}

const isProduction = process.env.NODE_ENV === 'production'

// Express recognises an error handler by its 4 parameters (err, req, res, next).
// In Express 5, errors thrown inside async route handlers land here automatically.
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  // If the response has already started, let Express close the connection.
  if (res.headersSent) {
    next(err)
    return
  }

  // Invalid request data (from a Zod schema .parse()).
  if (err instanceof ZodError) {
    const body: ErrorBody = {
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: z.flattenError(err).fieldErrors,
      },
    }
    res.status(400).json(body)
    return
  }

  // Errors we threw on purpose.
  if (err instanceof AppError) {
    const body: ErrorBody = { error: { message: err.message, code: err.code } }
    if (err.details !== undefined) body.error.details = err.details
    res.status(err.statusCode).json(body)
    return
  }

  // Known database errors from Prisma.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: the record to update/delete/find does not exist.
    if (err.code === 'P2025') {
      const body: ErrorBody = { error: { message: 'Resource not found', code: 'NOT_FOUND' } }
      res.status(404).json(body)
      return
    }
    // P2003: a foreign key points to a row that does not exist (e.g. unknown employeeId).
    if (err.code === 'P2003') {
      const body: ErrorBody = {
        error: { message: 'Related resource does not exist', code: 'INVALID_REFERENCE' },
      }
      res.status(400).json(body)
      return
    }
  }

  // Anything else is a bug or an outage: log it on the server, hide the details from the client.
  console.error(err)
  const body: ErrorBody = { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } }
  if (!isProduction && err instanceof Error) {
    body.error.details = { message: err.message, stack: err.stack }
  }
  res.status(500).json(body)
}
