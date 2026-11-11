import { Router } from 'express'
import * as userController from '../controllers/user.controller.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'
import { validate } from '../middleware/validate.js'
import { listUsersQuerySchema } from '../schemas/user.schema.js'

const router = Router()

// The user list is for managers only (e.g. to pick who works a shift).
// Auth runs before validation, so others get 401/403 without seeing the query rules.
router.use(requireAuth, requireRole('MANAGER'))

router.get('/', validate({ query: listUsersQuerySchema }), userController.list)

export default router
