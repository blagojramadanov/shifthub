// Turns an API error into what a form shows: messages under individual fields,
// and/or one banner at the top of the form. Used by the shift form and the register form.

import { ApiError } from './api'
import { formatDayHeader, formatTime } from './dates'

// One error message per form field. F is the form's own field names.
export type FieldErrors<F extends string> = Partial<Record<F, string>>

export type FormErrors<F extends string> = { fieldErrors: FieldErrors<F>; banner: string | null }

// The shift form's field names. Two differ from the API's: startTime -> start, endTime -> end.
export type ShiftField = 'title' | 'start' | 'end' | 'employeeId' | 'position' | 'notes'

export type ShiftFieldErrors = FieldErrors<ShiftField>

const SHIFT_API_TO_FORM_FIELD: Record<string, ShiftField> = {
  title: 'title',
  startTime: 'start',
  endTime: 'end',
  employeeId: 'employeeId',
  position: 'position',
  notes: 'notes',
}

// The register form's field names. confirmPassword is checked only in the browser.
export type RegisterField = 'name' | 'email' | 'password' | 'confirmPassword'

const REGISTER_API_TO_FORM_FIELD: Record<string, RegisterField> = {
  name: 'name',
  email: 'email',
  password: 'password',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// 400 VALIDATION_ERROR: details is { fieldName: ["message", ...] } (z.flattenError on the server).
// apiToFormField says which form field shows the message for each API field.
function fromValidationError<F extends string>(
  err: ApiError,
  apiToFormField: Record<string, F>,
): FormErrors<F> {
  const fieldErrors: FieldErrors<F> = {}
  const unmatched: string[] = []

  if (isRecord(err.details)) {
    for (const [apiField, messages] of Object.entries(err.details)) {
      if (!Array.isArray(messages) || typeof messages[0] !== 'string') continue
      const formField = apiToFormField[apiField]
      if (formField) fieldErrors[formField] = messages[0]
      else unmatched.push(messages[0]) // a field the form doesn't have: still show it
    }
  }

  // "Validation failed" is just the generic summary. Any other message is an
  // object-level problem (no field), so it goes in the banner, unless it's the same
  // text already shown under a field (the PATCH time check in the service sends both).
  const fieldMessages: string[] = Object.values(fieldErrors)
  const messages = [...unmatched]
  const isGeneric = err.message === 'Validation failed'
  const nothingElseToShow = fieldMessages.length === 0 && messages.length === 0
  if ((!isGeneric && !fieldMessages.includes(err.message)) || nothingElseToShow) {
    messages.unshift(err.message)
  }
  return { fieldErrors, banner: messages.length > 0 ? messages.join(' ') : null }
}

// 409 SHIFT_OVERLAP: details is { conflictingShift: { id, title, startTime, endTime } }.
// Its times are UTC strings; they're shown in the user's LOCAL time.
function fromOverlapError(err: ApiError): string {
  const conflict = isRecord(err.details) ? err.details.conflictingShift : undefined
  if (
    !isRecord(conflict) ||
    typeof conflict.title !== 'string' ||
    typeof conflict.startTime !== 'string' ||
    typeof conflict.endTime !== 'string'
  ) {
    return err.message
  }
  const start = new Date(conflict.startTime)
  const end = new Date(conflict.endTime)
  return `This employee already has a shift at that time: "${conflict.title}", ${formatDayHeader(start)}, ${formatTime(start)} – ${formatTime(end)}.`
}

function unknownErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong'
}

export function toFormErrors(err: unknown): FormErrors<ShiftField> {
  if (err instanceof ApiError) {
    if (err.status === 400 && err.code === 'VALIDATION_ERROR') {
      return fromValidationError(err, SHIFT_API_TO_FORM_FIELD)
    }
    if (err.status === 409 && err.code === 'SHIFT_OVERLAP') {
      return { fieldErrors: {}, banner: fromOverlapError(err) }
    }
    // Everything else (INVALID_REFERENCE, SHIFT_NOT_FOUND, FORBIDDEN, NETWORK_ERROR, ...).
    return { fieldErrors: {}, banner: err.message }
  }
  return { fieldErrors: {}, banner: unknownErrorMessage(err) }
}

export function toRegisterFormErrors(err: unknown): FormErrors<RegisterField> {
  if (err instanceof ApiError) {
    if (err.status === 400 && err.code === 'VALIDATION_ERROR') {
      return fromValidationError(err, REGISTER_API_TO_FORM_FIELD)
    }
    // 409 EMAIL_TAKEN has no details, but it's clearly about the email: show it there.
    if (err.status === 409 && err.code === 'EMAIL_TAKEN') {
      return { fieldErrors: { email: err.message }, banner: null }
    }
    // Everything else (NETWORK_ERROR, INTERNAL_ERROR, ...).
    return { fieldErrors: {}, banner: err.message }
  }
  return { fieldErrors: {}, banner: unknownErrorMessage(err) }
}
