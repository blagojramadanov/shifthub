import { apiFetch } from '../lib/api'
import type { Role, UserSummary } from '../types'

// Calls to /api/users. MANAGER only: an employee gets 403, so never call this as one.

export type ListUsersOptions = { role?: Role }

// Users ordered by name. With { role: 'EMPLOYEE' }, only employees.
export function listUsers(options: ListUsersOptions = {}, signal?: AbortSignal): Promise<UserSummary[]> {
  const params = new URLSearchParams()
  if (options.role) params.set('role', options.role)
  const query = params.toString()
  return apiFetch<UserSummary[]>(query ? `/api/users?${query}` : '/api/users', { signal })
}
