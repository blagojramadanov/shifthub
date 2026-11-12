import { z } from 'zod'

// GET /api/events?ticket=... A real ticket is 43 characters (32 bytes in base64url);
// the max only stops absurdly long values. Whether the ticket is VALID is checked by
// the service: a missing ticket is 400, a wrong one is 401 INVALID_TICKET.
export const eventsQuerySchema = z.object({
  ticket: z.string().min(1).max(100),
})

export type EventsQuery = z.infer<typeof eventsQuerySchema>
