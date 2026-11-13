// Values and browser-side checks for the register form.
// The rules mirror registerSchema in server/src/schemas/auth.schema.ts, so most mistakes
// are caught before a request is sent. The server still checks everything again.

import type { FieldErrors, RegisterField } from '../lib/formErrors'

export type RegisterFormValues = Record<RegisterField, string>

export const emptyRegisterForm: RegisterFormValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export const NAME_MAX_LENGTH = 100
export const EMAIL_MAX_LENGTH = 254
export const PASSWORD_MIN_LENGTH = 8
// bcrypt only uses the first 72 BYTES, so the server limits the UTF-8 size, not the length.
const PASSWORD_MAX_BYTES = 72

// A rough shape check ("something@something.something"). The server's z.email() decides.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRegisterForm(values: RegisterFormValues): FieldErrors<RegisterField> {
  const errors: FieldErrors<RegisterField> = {}

  // The server trims name and email before checking them, so we do too.
  const name = values.name.trim()
  if (!name) errors.name = 'Name is required'
  else if (name.length > NAME_MAX_LENGTH) errors.name = `Name must be at most ${NAME_MAX_LENGTH} characters`

  const email = values.email.trim()
  if (!email) errors.email = 'Email is required'
  else if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address'
  }

  // The password is NOT trimmed: spaces are allowed and count.
  // .length counts like Zod's .min() on the server; TextEncoder gives the UTF-8 bytes.
  if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
  } else if (new TextEncoder().encode(values.password).length > PASSWORD_MAX_BYTES) {
    errors.password = 'Password is too long'
  }

  // Only in the browser: catches typos, since the password field hides what you type.
  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return errors
}
