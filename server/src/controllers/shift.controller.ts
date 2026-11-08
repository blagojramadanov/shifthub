import type { Request, Response } from 'express'
import type {
  CreateShiftInput,
  ListShiftsQuery,
  ShiftIdParams,
  UpdateShiftInput,
} from '../schemas/shift.schema.js'
import * as shiftService from '../services/shift.service.js'

// Controllers only translate HTTP <-> service calls: read the (already validated)
// request, call the service, pick the status code. No business rules here.
// Errors thrown by the service go straight to the error handler (Express 5).

type NoParams = Record<string, string>

export async function list(req: Request<NoParams, unknown, unknown, ListShiftsQuery>, res: Response) {
  const shifts = await shiftService.listShifts(req.query)
  res.json(shifts)
}

export async function getById(req: Request<ShiftIdParams>, res: Response) {
  const shift = await shiftService.getShiftById(req.params.id)
  res.json(shift)
}

export async function create(req: Request<NoParams, unknown, CreateShiftInput>, res: Response) {
  const shift = await shiftService.createShift(req.body)
  res.status(201).json(shift)
}

export async function update(req: Request<ShiftIdParams, unknown, UpdateShiftInput>, res: Response) {
  const shift = await shiftService.updateShift(req.params.id, req.body)
  res.json(shift)
}

export async function remove(req: Request<ShiftIdParams>, res: Response) {
  await shiftService.deleteShift(req.params.id)
  res.status(204).end()
}
