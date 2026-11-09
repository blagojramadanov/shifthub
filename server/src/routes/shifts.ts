import { Router } from 'express'
import * as shiftController from '../controllers/shift.controller.js'
import { validate } from '../middleware/validate.js'
import {
  createShiftSchema,
  listShiftsQuerySchema,
  shiftIdParamSchema,
  updateShiftSchema,
} from '../schemas/shift.schema.js'

// Routes only wire things together: URL + HTTP method -> validation -> controller.
const router = Router()

router.get('/', validate({ query: listShiftsQuerySchema }), shiftController.list)
router.get('/:id', validate({ params: shiftIdParamSchema }), shiftController.getById)
router.post('/', validate({ body: createShiftSchema }), shiftController.create)
// PATCH = partial update: send only the fields you want to change.
router.patch(
  '/:id',
  validate({ params: shiftIdParamSchema, body: updateShiftSchema }),
  shiftController.update,
)
router.delete('/:id', validate({ params: shiftIdParamSchema }), shiftController.remove)

export default router
