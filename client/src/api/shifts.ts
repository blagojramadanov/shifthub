import { apiFetch } from '../lib/api'
import type { CreateShiftInput, Shift, UpdateShiftInput } from '../types'

// Calls to /api/shifts. Every function throws ApiError on failure (see lib/api.ts).

// The window to load. Every shift that OVERLAPS it comes back, oldest first.
// The server needs both ends and allows at most 42 days.
export type ShiftRange = { from: Date; to: Date }

export function listShifts(range: ShiftRange, signal?: AbortSignal): Promise<Shift[]> {
  // toISOString() always ends in "Z", the only format the server accepts here.
  // URLSearchParams encodes the values safely for the URL.
  const params = new URLSearchParams({
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  })
  return apiFetch<Shift[]>(`/api/shifts?${params}`, { signal })
}

// MANAGER only. Returns the created shift (with employee).
export function createShift(input: CreateShiftInput): Promise<Shift> {
  return apiFetch<Shift>('/api/shifts', { method: 'POST', body: input })
}

// MANAGER only. Returns the updated shift (with employee).
export function updateShift(id: string, input: UpdateShiftInput): Promise<Shift> {
  return apiFetch<Shift>(`/api/shifts/${encodeURIComponent(id)}`, { method: 'PATCH', body: input })
}

// MANAGER only. The server answers 204 No Content, so there is nothing to return.
export async function deleteShift(id: string): Promise<void> {
  await apiFetch<undefined>(`/api/shifts/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
