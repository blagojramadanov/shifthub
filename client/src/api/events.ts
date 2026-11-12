import { API_URL, apiFetch } from '../lib/api'

// Calls to /api/events (realtime updates). See hooks/useShiftEvents.ts for how they're used.

type TicketResponse = { ticket: string }

// Trades the login token for a single-use ticket (valid 30 s) to open the event stream.
// EventSource can't send an Authorization header, so the stream URL carries this instead.
export async function getEventsTicket(signal?: AbortSignal): Promise<string> {
  const { ticket } = await apiFetch<TicketResponse>('/api/events/ticket', { method: 'POST', signal })
  return ticket
}

// The URL of the event stream for one ticket. encodeURIComponent keeps it safe in the URL.
export function eventsUrl(ticket: string): string {
  return `${API_URL}/api/events?ticket=${encodeURIComponent(ticket)}`
}
