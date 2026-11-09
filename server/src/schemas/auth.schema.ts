import { z } from 'zod'

// Trimmed and lowercased BEFORE the email check, so " Blagoj@Test.com " and
// "blagoj@test.com" are the same account (the unique index is case-sensitive).
const emailField = z.string().trim().toLowerCase().max(254).pipe(z.email())

// bcrypt only uses the first 72 BYTES of a password and silently ignores the rest.
// Characters like "é" or emoji take several bytes, so the limit is checked in bytes.
const newPasswordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
    message: 'Password is too long',
  })

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailField,
  password: newPasswordField,
  // No "role" field: unknown fields are stripped, so nobody can sign up as MANAGER.
})

// Login doesn't re-check the password rules: a wrong password should just be
// "invalid credentials". The max only stops absurdly large inputs.
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(1000),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
