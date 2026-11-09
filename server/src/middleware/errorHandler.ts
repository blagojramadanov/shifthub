import type { ErrorRequestHandler } from 'express'
import { z, ZodError } from 'zod'
import { AppError } from '../errors/AppError.js'
import { Prisma } from '../generated/prisma/client.js'

// Every error response has this shape.
type ErrorBody = {
  error: { message: string; code: string; details?: unknown }
}

const isProduction = process.env.NODE_ENV === 'production'

// True when details carry real information. undefined, null, {} and [] don't.
function hasContent(details: unknown): boolean {
  if (details === undefined || details === null) return false
  if (Array.isArray(details)) return details.length > 0
  if (typeof details === 'object') return Object.keys(details).length > 0
  return true
}

// Builds the error body, adding the "details" key only when it has content.
function errorBody(message: string, code: string, details?: unknown): ErrorBody {
  const body: ErrorBody = { error: { message, code } }
  if (hasContent(details)) body.error.details = details
  return body
}

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
    // fieldErrors: problems with one field. formErrors: problems with the whole
    // object (e.g. an empty update body), shown as the message.
    const { formErrors, fieldErrors } = z.flattenError(err)
    const message = formErrors.length > 0 ? formErrors.join('; ') : 'Validation failed'
    res.status(400).json(errorBody(message, 'VALIDATION_ERROR', fieldErrors))
    return
  }

  // Errors we threw on purpose.
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorBody(err.message, err.code, err.details))
    return
  }

  // Known database errors from Prisma.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: the record to update/delete/find does not exist.
    if (err.code === 'P2025') {
      res.status(404).json(errorBody('Resource not found', 'NOT_FOUND'))
      return
    }
    // P2003: a foreign key points to a row that does not exist (e.g. unknown employeeId).
    if (err.code === 'P2003') {
      res.status(400).json(errorBody('Related resource does not exist', 'INVALID_REFERENCE'))
      return
    }
  }

  // Anything else is a bug or an outage: log it on the server, hide the details from the client.
  console.error(err)
  const details =
    !isProduction && err instanceof Error ? { message: err.message, stack: err.stack } : undefined
  res.status(500).json(errorBody('Internal server error', 'INTERNAL_ERROR', details))
}
