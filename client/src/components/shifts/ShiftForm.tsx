import { useState, type FormEvent } from 'react'
import { createShift, deleteShift, updateShift } from '../../api/shifts'
import { toFormErrors, type ShiftField, type ShiftFieldErrors } from '../../lib/formErrors'
import type { Shift } from '../../types'
import { DeleteShiftButton } from './DeleteShiftButton'
import { EmployeeSelect } from './EmployeeSelect'
import { FormField } from './FormField'
import { inputClass } from './inputClass'
import {
  initialValues,
  toCreateInput,
  toUpdateInput,
  validateShiftForm,
  type ShiftFormValues,
} from './shiftFormValues'

type ShiftFormProps = {
  shift?: Shift // given = edit this shift, missing = create a new one
  day: Date // create: the day to prefill (09:00-17:00). Ignored when editing.
  onDone: () => void // saved or deleted: the parent closes the modal and reloads the week
  onCancel: () => void
}

// MANAGER only: create or edit a shift, and delete it when editing.
export function ShiftForm({ shift, day, onDone, onCancel }: ShiftFormProps) {
  const [values, setValues] = useState<ShiftFormValues>(() => initialValues(shift, day))
  const [fieldErrors, setFieldErrors] = useState<ShiftFieldErrors>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const busy = saving || deleting

  function setValue(field: keyof ShiftFormValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
  }

  // id, aria attributes and classes for the input of one field.
  function fieldProps(field: ShiftField) {
    const id = `shift-${field}`
    const error = fieldErrors[field]
    return {
      id,
      disabled: busy,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? `${id}-error` : undefined,
      className: inputClass(Boolean(error)),
    }
  }

  function showError(err: unknown) {
    const { fieldErrors: serverFieldErrors, banner: serverBanner } = toFormErrors(err)
    setFieldErrors(serverFieldErrors)
    setBanner(serverBanner)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // The button is disabled while saving; this also stops a second submit via Enter.
    if (busy) return

    const errors = validateShiftForm(values)
    setFieldErrors(errors)
    setBanner(null)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      if (shift) await updateShift(shift.id, toUpdateInput(values))
      else await createShift(toCreateInput(values))
      onDone() // the form disappears, so there's no need to reset `saving`
    } catch (err) {
      showError(err)
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!shift || busy) return
    setBanner(null)
    setDeleting(true)
    try {
      await deleteShift(shift.id)
      onDone()
    } catch (err) {
      showError(err)
      setDeleting(false)
    }
  }

  return (
    // noValidate: our own messages instead of the browser's bubbles, so client and
    // server errors look the same.
    <form noValidate onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {banner && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {banner}
        </div>
      )}

      <FormField id="shift-title" label="Title" error={fieldErrors.title}>
        <input
          {...fieldProps('title')}
          type="text"
          maxLength={100}
          value={values.title}
          onChange={(e) => setValue('title', e.target.value)}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="shift-start" label="Start" error={fieldErrors.start}>
          <input
            {...fieldProps('start')}
            type="datetime-local"
            value={values.start}
            onChange={(e) => setValue('start', e.target.value)}
          />
        </FormField>
        <FormField id="shift-end" label="End" error={fieldErrors.end}>
          <input
            {...fieldProps('end')}
            type="datetime-local"
            value={values.end}
            onChange={(e) => setValue('end', e.target.value)}
          />
        </FormField>
      </div>

      <EmployeeSelect
        id="shift-employeeId"
        value={values.employeeId}
        onChange={(value) => setValue('employeeId', value)}
        currentAssignee={shift?.employee ?? null}
        error={fieldErrors.employeeId}
        disabled={busy}
      />

      <FormField id="shift-position" label="Position (optional)" error={fieldErrors.position}>
        <input
          {...fieldProps('position')}
          type="text"
          maxLength={50}
          placeholder="e.g. Kitchen"
          value={values.position}
          onChange={(e) => setValue('position', e.target.value)}
        />
      </FormField>

      <FormField id="shift-notes" label="Notes (optional)" error={fieldErrors.notes}>
        <textarea
          {...fieldProps('notes')}
          rows={3}
          maxLength={500}
          value={values.notes}
          onChange={(e) => setValue('notes', e.target.value)}
        />
      </FormField>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        {/* An empty <div> keeps Cancel/Save on the right when there's no Delete. */}
        {shift ? <DeleteShiftButton onConfirm={() => void handleDelete()} deleting={deleting} disabled={busy} /> : <div />}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : shift ? 'Save changes' : 'Create shift'}
          </button>
        </div>
      </div>
    </form>
  )
}
