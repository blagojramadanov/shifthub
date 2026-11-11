import type { Request, Response } from 'express'
import type { ListUsersQuery } from '../schemas/user.schema.js'
import * as userService from '../services/user.service.js'

// HTTP in/out only. Who may call this is decided in the route (requireRole).

type NoParams = Record<string, string>

export async function list(req: Request<NoParams, unknown, unknown, ListUsersQuery>, res: Response) {
  const users = await userService.listUsers(req.query)
  res.json(users)
}
