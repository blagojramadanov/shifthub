import { useEmployees } from '../../hooks/useEmployees'
import type { ShiftEmployee } from '../../types'
import { FormField } from './FormField'
import { inputClass } from './inputClass'

type EmployeeSelectProps = {
  id: string
  value: string // '' = open shift, otherwise the employee id as a string
  onChange: (value: string) => void
  // Who the shift is assigned to right now (edit), or null (create / open shift).
  currentAssignee: ShiftEmployee | null
  error?: string
  disabled?: boolean
}

// The "Assigned to" select. Loads GET /api/users?role=EMPLOYEE itself, so the
// request only happens when a manager opens the form.
export function EmployeeSelect({ id, value, onChange, currentAssignee, error, disabled }: EmployeeSelectProps) {
  const employees = useEmployees()
  const list = employees.status === 'ready' ? employees.employees : []

  // The current assignee may be missing from the list: a MANAGER assigned to the shift,
  // or the list is still loading or failed. Without an option for them, the select
  // would show "— Open shift —", and saving would silently unassign the shift.
  const assigneeMissing = currentAssignee !== null && !list.some((e) => e.id === currentAssignee.id)

  const hint =
    employees.status === 'loading'
      ? 'Loading employees…'
      : employees.status === 'error'
        ? `Could not load employees: ${employees.message}`
        : undefined

  return (
    <FormField id={id} label="Assigned to" error={error} hint={hint}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass(Boolean(error))}
      >
        <option value="">— Open shift —</option>
        {assigneeMissing && (
          <option value={String(currentAssignee.id)}>
            {currentAssignee.name ?? 'Unnamed employee'} (currently assigned)
          </option>
        )}
        {list.map((employee) => (
          <option key={employee.id} value={String(employee.id)}>
            {employee.name ?? employee.email}
          </option>
        ))}
      </select>
    </FormField>
  )
}
