import { useEffect, useState } from 'react'
import { listUsers } from '../api/users'
import type { UserSummary } from '../types'

export type EmployeesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; employees: UserSummary[] }

// Loads every EMPLOYEE (GET /api/users?role=EMPLOYEE) once, when the component mounts.
// MANAGER only: use it only inside components that managers see (the shift form).
export function useEmployees(): EmployeesState {
  const [state, setState] = useState<EmployeesState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    listUsers({ role: 'EMPLOYEE' }, controller.signal)
      .then((employees) => setState({ status: 'ready', employees }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return // the form was closed
        setState({ status: 'error', message: err instanceof Error ? err.message : 'Something went wrong' })
      })
    return () => controller.abort()
  }, [])

  return state
}
