import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router'
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  emptyRegisterForm,
  validateRegisterForm,
  type RegisterFormValues,
} from '../auth/registerForm'
import { useAuth } from '../auth/useAuth'
import { AuthLayout } from '../components/auth/AuthLayout'
import { FormField } from '../components/shifts/FormField'
import { inputClass } from '../components/shifts/inputClass'
import { toRegisterFormErrors, type FieldErrors, type RegisterField } from '../lib/formErrors'

// After this long, explain why signing up is taking a while (Render cold start).
const SLOW_AFTER_MS = 5000

export default function RegisterPage() {
  const { register } = useAuth()
  const [values, setValues] = useState<RegisterFormValues>(emptyRegisterForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegisterField>>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [slow, setSlow] = useState(false)

  // value, change handler, id, aria attributes and classes for the input of one field.
  function fieldProps(field: RegisterField) {
    const id = `register-${field}`
    const error = fieldErrors[field]
    return {
      id,
      value: values[field],
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setValues((v) => ({ ...v, [field]: value }))
      },
      disabled: submitting,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? `${id}-error` : undefined,
      className: inputClass(Boolean(error)),
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault() // stop the browser's full-page form submit
    if (submitting) return

    const errors = validateRegisterForm(values)
    setFieldErrors(errors)
    setBanner(null)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    const slowTimer = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    try {
      // On success there's nothing else to do: register() logs the new user in, and
      // PublicOnlyRoute sees the "authenticated" state and redirects to the calendar.
      await register(values.name, values.email, values.password)
    } catch (err) {
      const { fieldErrors: serverFieldErrors, banner: serverBanner } = toRegisterFormErrors(err)
      setFieldErrors(serverFieldErrors)
      setBanner(serverBanner)
    } finally {
      clearTimeout(slowTimer)
      setSubmitting(false)
      setSlow(false)
    }
  }

  return (
    <AuthLayout
      subtitle="Create your account"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-slate-900 underline-offset-2 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {/* noValidate: our own messages instead of the browser's bubbles, so client and
          server errors look the same. */}
      <form noValidate onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {/* There is no role field on purpose: the server always creates an EMPLOYEE. */}
        <p className="text-sm text-slate-600">New accounts join the team as employees.</p>

        {banner && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {banner}
          </div>
        )}

        <FormField id="register-name" label="Name" error={fieldErrors.name}>
          <input {...fieldProps('name')} type="text" autoComplete="name" maxLength={NAME_MAX_LENGTH} />
        </FormField>

        <FormField id="register-email" label="Email" error={fieldErrors.email}>
          <input {...fieldProps('email')} type="email" autoComplete="email" maxLength={EMAIL_MAX_LENGTH} />
        </FormField>

        <FormField
          id="register-password"
          label="Password"
          error={fieldErrors.password}
          hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
        >
          {/* new-password: password managers offer to generate and save one. */}
          <input {...fieldProps('password')} type="password" autoComplete="new-password" />
        </FormField>

        <FormField id="register-confirmPassword" label="Confirm password" error={fieldErrors.confirmPassword}>
          <input {...fieldProps('confirmPassword')} type="password" autoComplete="new-password" />
        </FormField>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        {slow && (
          <p aria-live="polite" className="text-center text-sm text-slate-500">
            The server may be waking up. This can take up to a minute.
          </p>
        )}
      </form>
    </AuthLayout>
  )
}
