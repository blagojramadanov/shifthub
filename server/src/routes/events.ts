import { Router } from 'express'
import * as eventsController from '../controllers/events.controller.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { eventsQuerySchema } from '../schemas/events.schema.js'

const router = Router()

// Needs a JWT: returns a single-use ticket for the stream below.
router.post('/ticket', requireAuth, eventsController.createTicket)

// No JWT here (EventSource can't send headers): the ticket IS the authentication.
router.get('/', validate({ query: eventsQuerySchema }), eventsController.stream)

export default router
