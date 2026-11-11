import type { ReactNode } from 'react'

type FormFieldProps = {
  id: string // the input's id; the error gets `${id}-error`
  label: string
  error?: string
  hint?: string
  children: ReactNode // the input / select / textarea
}

// Label + input + error message, laid out the same for every field of the form.
export function FormField({ id, label, error, hint, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
