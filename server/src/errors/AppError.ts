// An error we throw on purpose, with the HTTP status the client should get.
// Example: throw new AppError(404, 'Shift not found', 'SHIFT_NOT_FOUND')
export class AppError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: unknown

  constructor(statusCode: number, message: string, code = 'APP_ERROR', details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}
