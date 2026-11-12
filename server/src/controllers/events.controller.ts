import type { Request, Response } from 'express'
import { AppError } from '../errors/AppError.js'
import type { EventsQuery } from '../schemas/events.schema.js'
import * as eventsService from '../services/events.service.js'

// Proxies and load balancers close connections that stay silent for too long.
// A comment line every 25 s keeps the stream alive (browsers ignore comments).
const HEARTBEAT_MS = 25_000

type NoParams = Record<string, string>

// POST /api/events/ticket (requireAuth): trade the JWT for a short-lived stream ticket.
export function createTicket(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'Authentication required', 'UNAUTHORIZED')
  const ticket = eventsService.createTicket({ id: req.user.id, role: req.user.role })
  res.status(201).json({ ticket })
}

// GET /api/events?ticket=...: keeps the response open and writes events into it.
export function stream(req: Request<NoParams, unknown, unknown, EventsQuery>, res: Response) {
  // Checked BEFORE any header is sent, so a bad ticket still gets a normal JSON 401.
  const actor = eventsService.consumeTicket(req.query.ticket)
  if (!actor) {
    throw new AppError(401, 'Invalid or expired ticket', 'INVALID_TICKET')
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache', // never store or reuse this response
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // tells nginx-style proxies not to hold the data back
  })
  // Sends the headers right away instead of waiting for the first write.
  res.flushHeaders()
  // A first comment so the stream starts flowing immediately, even through proxies.
  res.write(': connected\n\n')

  // SSE format: "event: <name>", "data: <one line of JSON>", then an empty line.
  const send: eventsService.SendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }
  eventsService.addClient(send)

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n')
  }, HEARTBEAT_MS)

  // "close" on the RESPONSE fires when the connection really ends (tab closed, logout,
  // network drop). req's "close" can fire much earlier on newer Node versions.
  res.on('close', () => {
    clearInterval(heartbeat)
    eventsService.removeClient(send)
  })
}
