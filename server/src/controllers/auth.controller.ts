import type { Request, Response } from 'express'
import { AppError } from '../errors/AppError.js'
import type { LoginInput, RegisterInput } from '../schemas/auth.schema.js'
import * as authService from '../services/auth.service.js'

// HTTP in/out only. Rules (hashing, tokens, duplicate emails) live in the service.

type NoParams = Record<string, string>

export async function register(req: Request<NoParams, unknown, RegisterInput>, res: Response) {
  const result = await authService.register(req.body)
  res.status(201).json(result)
}

export async function login(req: Request<NoParams, unknown, LoginInput>, res: Response) {
  const result = await authService.login(req.body)
  res.json(result)
}

export async function me(req: Request, res: Response) {
  // requireAuth runs before this, but TypeScript can't know that: req.user is optional.
  if (!req.user) throw new AppError(401, 'Authentication required', 'UNAUTHORIZED')
  const user = await authService.getCurrentUser(req.user.id)
  res.json(user)
}
