import type { Request, RequestHandler } from 'express'
import type { z, ZodType } from 'zod'

type Schemas<P extends ZodType, B extends ZodType, Q extends ZodType> = {
  params?: P
  body?: B
  query?: Q
}

// Validates req.params, req.body and req.query against the given Zod schemas
// and replaces them with the parsed (cleaned, converted) values.
//
// The return type carries the parsed types, so the route handler after it
// gets typed req.params / req.body / req.query automatically:
//   router.get('/:id', validate({ params: shiftIdParamSchema }), (req, res) => {
//     req.params.id // string
//   })
//
// If parsing fails, .parse() throws a ZodError. Express 5 forwards it to the
// error handler, which answers with 400.
export function validate<
  P extends ZodType = ZodType<Request['params']>,
  B extends ZodType = ZodType<unknown>,
  Q extends ZodType = ZodType<Request['query']>,
>(schemas: Schemas<P, B, Q>): RequestHandler<z.output<P>, unknown, z.output<B>, z.output<Q>> {
  return (req, _res, next) => {
    if (schemas.params) {
      req.params = schemas.params.parse(req.params)
    }
    if (schemas.body) {
      req.body = schemas.body.parse(req.body)
    }
    if (schemas.query) {
      // In Express 5, req.query is a getter with no setter, so `req.query = ...`
      // throws. Defining our own property on this request object hides the getter.
      Object.defineProperty(req, 'query', {
        value: schemas.query.parse(req.query),
        writable: true,
        enumerable: true,
        configurable: true,
      })
    }
    next()
  }
}
