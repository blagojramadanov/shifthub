import { Router } from 'express'
import * as shiftController from '../controllers/shift.controller.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'
import { validate } from '../middleware/validate.js'
import {
  createShiftSchema,
  listShiftsQuerySchema,
  shiftIdParamSchema,
  updateShiftSchema,
} from '../schemas/shift.schema.js'

// Routes only wire things together: URL + HTTP method -> auth -> validation -> controller.
// Auth runs BEFORE validation, so callers who aren't allowed get 401/403
// without learning anything about the expected request format.
const router = Router()

// Every shift route needs a logged-in user.
router.use(requireAuth)

const managerOnly = requireRole('MANAGER')

// Any logged-in user. The service decides WHICH shifts they can see.
router.get('/', validate({ query: listShiftsQuerySchema }), shiftController.list)
router.get('/:id', validate({ params: shiftIdParamSchema }), shiftController.getById)

// Managers only.
router.post('/', managerOnly, validate({ body: createShiftSchema }), shiftController.create)
// PATCH = partial update: send only the fields you want to change.
router.patch(
  '/:id',
  managerOnly,
  validate({ params: shiftIdParamSchema, body: updateShiftSchema }),
  shiftController.update,
)
router.delete('/:id', managerOnly, validate({ params: shiftIdParamSchema }), shiftController.remove)

export default router
