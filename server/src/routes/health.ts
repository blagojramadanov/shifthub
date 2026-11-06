import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/', async (_req, res) => {
  let database: 'connected' | 'error' = 'connected'

  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (err) {
    database = 'error'
    // Log only the error type/code; driver messages can include connection details.
    const code = (err as { code?: string }).code
    console.error(`Database health check failed${code ? ` (${code})` : ''}`)
  }

  res.json({ status: 'ok', app: 'ShiftHub', database })
})

export default router
