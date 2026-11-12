import { randomBytes } from 'node:crypto'
import type { Actor } from './shift.service.js'

// Realtime updates with Server-Sent Events (SSE).
// Everything here lives in memory, which works because the API runs as ONE instance.
// A restart forgets all tickets and clients; browsers simply reconnect.

// ---------------------------------------------------------------------------
// Tickets
// ---------------------------------------------------------------------------
// EventSource can't send an Authorization header, and a JWT in the URL would end up
// in logs. So the browser first trades its JWT for a ticket (POST /api/events/ticket),
// then opens the stream with ?ticket=... A ticket works ONCE and only for a short time,
// so a ticket that shows up in a log is already useless.

const TICKET_TTL_MS = 30_000

type TicketEntry = Actor & { expiresAt: number }

const tickets = new Map<string, TicketEntry>()

// Removes expired tickets. Runs on every new ticket, so the Map can't grow forever
// and no timer is needed.
function sweepExpiredTickets(now: number): void {
  for (const [ticket, entry] of tickets) {
    if (entry.expiresAt <= now) tickets.delete(ticket)
  }
}

export function createTicket(actor: Actor): string {
  const now = Date.now()
  sweepExpiredTickets(now)

  // 32 random bytes = 256 bits: impossible to guess. base64url is safe in a URL as-is.
  const ticket = randomBytes(32).toString('base64url')
  tickets.set(ticket, { id: actor.id, role: actor.role, expiresAt: now + TICKET_TTL_MS })
  return ticket
}

// Returns who the ticket belongs to, or null if it's unknown, expired or already used.
// The ticket is deleted either way: single use.
export function consumeTicket(ticket: string): Actor | null {
  const entry = tickets.get(ticket)
  if (!entry) return null
  tickets.delete(ticket)
  if (entry.expiresAt <= Date.now()) return null
  return { id: entry.id, role: entry.role }
}

// ---------------------------------------------------------------------------
// Connected clients
// ---------------------------------------------------------------------------
// A client is just "a function that sends one SSE event". The controller builds it
// from the HTTP response, so this service never touches Express.

export type SendEvent = (event: string, data: unknown) => void

const clients = new Set<SendEvent>()

export function addClient(send: SendEvent): void {
  clients.add(send)
}

export function removeClient(send: SendEvent): void {
  clients.delete(send)
}

// Tells every connected browser "shifts changed, load them again".
// No shift data is sent on purpose: everyone gets the event, and each browser then
// fetches only the shifts it is allowed to see.
export function notifyShiftsChanged(): void {
  for (const send of clients) {
    try {
      send('shifts-changed', {})
    } catch {
      // A broken connection must not stop the broadcast to the others.
      // (Deleting from a Set while looping over it is safe in JavaScript.)
      clients.delete(send)
    }
  }
}
