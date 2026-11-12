# Decisions

Short records of the main technical decisions in ShiftHub, in a lightweight ADR (Architecture Decision Record) style. Each entry links to the code it describes. For the overall picture, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Contents

1. [Single-use ticket for the SSE stream](#1-single-use-ticket-for-the-sse-stream)
2. [Realtime events without payload](#2-realtime-events-without-payload)
3. [Store UTC, show local time](#3-store-utc-show-local-time)
4. [Zod at the edges](#4-zod-at-the-edges)
5. [Stale-while-revalidate in useWeekShifts](#5-stale-while-revalidate-in-useweekshifts)
6. [Native dialog for the shift modal](#6-native-dialog-for-the-shift-modal)
7. [Register always creates an employee](#7-register-always-creates-an-employee)
8. [Maximum 42-day range for the shift list](#8-maximum-42-day-range-for-the-shift-list)
9. [Routes, controllers and services](#9-routes-controllers-and-services)
10. [Stateless token check](#10-stateless-token-check)
11. [Token in localStorage](#11-token-in-localstorage)
12. [404 instead of 403 for hidden shifts](#12-404-instead-of-403-for-hidden-shifts)
13. [Catch the unique-constraint error instead of checking first](#13-catch-the-unique-constraint-error-instead-of-checking-first)
14. [Overlap check in the service](#14-overlap-check-in-the-service)
15. [Migrations in the Render build step](#15-migrations-in-the-render-build-step)
16. [No date library](#16-no-date-library)

---

## 1. Single-use ticket for the SSE stream

- **Context:** The realtime stream uses the browser's `EventSource`, which can't send an `Authorization` header. Putting the JWT in the URL would leak a token that's valid for a day into server and proxy logs.
- **Decision:** `POST /api/events/ticket` (with the JWT) returns a random ticket that is valid for 30 seconds and works once. The stream is opened with `GET /api/events?ticket=...`.
- **Why:** A ticket that ends up in a log is already used or expired, so it's worthless to anyone who reads it.
- **Trade-off:** One extra request per connection, and tickets live in server memory, so the API must run as a single instance.
- **Code:** [`events.service.ts`](../server/src/services/events.service.ts), [`events.controller.ts`](../server/src/controllers/events.controller.ts)

## 2. Realtime events without payload

- **Context:** Every connected browser receives every event, but employees may only see their own and open shifts.
- **Decision:** The server sends only `event: shifts-changed` with `data: {}`. Browsers react by reloading the current week through the normal API.
- **Why:** The visibility rules stay in one place (the shift service). There's no second, event-specific permission check that could get out of sync and leak shifts.
- **Trade-off:** Every change causes one `GET /api/shifts` per connected browser, even for changes the user can't see. Fine at this scale.
- **Code:** [`events.service.ts`](../server/src/services/events.service.ts), [`useShiftEvents.ts`](../client/src/hooks/useShiftEvents.ts)

## 3. Store UTC, show local time

- **Context:** Shifts are moments in time, and the dev machine, Render and users can all be in different time zones.
- **Decision:** The database and API use UTC. The API requires an explicit offset on input (the list query requires `Z`). The client converts to and from the browser's local time only at the API boundary.
- **Why:** A time without an offset would be read in the server's own time zone, which differs between environments. One rule ("UTC on the wire") avoids that whole class of bugs.
- **Trade-off:** Users in different time zones see the same shift at different clock times. There's no per-team time zone setting.
- **Code:** [`shift.schema.ts`](../server/src/schemas/shift.schema.ts), [`dates.ts`](../client/src/lib/dates.ts)

## 4. Zod at the edges

- **Context:** Data from outside (request bodies, query strings, environment variables, token payloads) can have any shape.
- **Decision:** Zod checks it where it enters: `validate()` on every route, `config/env.ts` at startup (the server exits on a bad `JWT_SECRET`), and the JWT payload after the signature check.
- **Why:** Everything after the check can trust its input, and the TypeScript types come from the same schemas, so types and runtime rules can't drift apart.
- **Trade-off:** Some rules need care to share. For example, the shift time rule is a plain function that both the schema and the update service call.
- **Code:** [`validate.ts`](../server/src/middleware/validate.ts), [`env.ts`](../server/src/config/env.ts), [`jwt.ts`](../server/src/lib/jwt.ts)

## 5. Stale-while-revalidate in useWeekShifts

- **Context:** After a save (or a realtime event) the week is fetched again. Showing the loading skeleton each time would make the calendar flash.
- **Decision:** When the same week is reloaded, the hook keeps returning the previous shifts with `refreshing: true` until the new answer arrives. "Loading" is not stored in state; it's derived from "no result for the current request yet".
- **Why:** Updates simply appear in place. Deriving the status means the effect never has to reset state synchronously, and a slow answer for an old week can never overwrite the current one (each request is aborted when it's replaced).
- **Trade-off:** For a moment the user sees slightly old data. Switching to a new week still shows the skeleton.
- **Code:** [`useWeekShifts.ts`](../client/src/hooks/useWeekShifts.ts)

## 6. Native dialog for the shift modal

- **Context:** The create/edit/details modal needs a backdrop, focus kept inside, the page behind it made inert, and Esc to close.
- **Decision:** Use the browser's `<dialog>` element with `showModal()` instead of a modal library or a custom overlay.
- **Why:** The browser provides all of those accessibility behaviors for free, with no extra dependency.
- **Trade-off:** React state and the dialog's own open state must be kept in sync (the dialog's `close` event calls `onClose`), and StrictMode's double effect needs a guard.
- **Code:** [`ShiftModal.tsx`](../client/src/components/shifts/ShiftModal.tsx)

## 7. Register always creates an employee

- **Context:** Registration is a public endpoint.
- **Decision:** The register schema has no `role` field (Zod strips unknown fields), and the database default makes every new user an `EMPLOYEE`. Managers are promoted directly in the database.
- **Why:** Nobody can sign up as a manager by adding `"role": "MANAGER"` to the request.
- **Trade-off:** There's no in-app way to promote users yet.
- **Code:** [`auth.schema.ts`](../server/src/schemas/auth.schema.ts), [`auth.service.ts`](../server/src/services/auth.service.ts)

## 8. Maximum 42-day range for the shift list

- **Context:** `GET /api/shifts` takes an optional `from`/`to` window.
- **Decision:** `from` and `to` must come together, `from` must be before `to`, and the window can be at most 42 days (six weeks, enough for a month view). Both must be UTC (`Z`).
- **Why:** It limits how much one request can load, and the strict format avoids time zone surprises (see 3).
- **Trade-off:** A longer report would need several requests. A request without any window is still allowed and returns every visible shift.
- **Code:** [`shift.schema.ts`](../server/src/schemas/shift.schema.ts)

## 9. Routes, controllers and services

- **Context:** Express lets you put everything in one handler, which gets hard to follow as rules grow.
- **Decision:** Routes only wire middleware together, controllers only translate HTTP, and services hold the rules and the Prisma calls. Services receive plain values (`Actor = { id, role }`) and know nothing about Express.
- **Why:** Each rule lives in exactly one place, and services can be tested or reused without HTTP.
- **Trade-off:** More files per feature, and some thin pass-through functions.
- **Code:** [`routes/`](../server/src/routes/), [`controllers/`](../server/src/controllers/), [`services/`](../server/src/services/)

## 10. Stateless token check

- **Context:** Almost every request needs to know who the caller is.
- **Decision:** `requireAuth` only verifies the JWT and reads `{ id, role }` from it, without a database query.
- **Why:** It's fast and needs no session store.
- **Trade-off:** A role change or a deleted account only takes effect when the token expires (default 1 day) or the user logs in again. `/auth/me` does check the database, so a deleted user is logged out on the next app start.
- **Code:** [`requireAuth.ts`](../server/src/middleware/requireAuth.ts), [`jwt.ts`](../server/src/lib/jwt.ts)

## 11. Token in localStorage

- **Context:** The client (Vercel) and the API (Render) are on different domains.
- **Decision:** The JWT is stored in `localStorage` and sent as a Bearer header by `apiFetch`.
- **Why:** It works across origins without cookie configuration (`SameSite`, `Secure`, credentialed CORS) and keeps the auth flow easy to follow.
- **Trade-off:** JavaScript can read the token, so an XSS bug could steal it. An httpOnly cookie would prevent that, at the cost of more setup and CSRF protection.
- **Code:** [`api.ts`](../client/src/lib/api.ts)

## 12. 404 instead of 403 for hidden shifts

- **Context:** Employees may only see their own and open shifts.
- **Decision:** The visibility rule is part of the database query, so a shift an employee may not see returns `404 SHIFT_NOT_FOUND`, exactly like a shift that doesn't exist.
- **Why:** A `403` would confirm that the shift exists. A `404` reveals nothing.
- **Trade-off:** For debugging, "not found" and "not allowed" look the same from the outside.
- **Code:** [`shift.service.ts`](../server/src/services/shift.service.ts) (`visibleShiftsWhere`, `getShiftById`)

## 13. Catch the unique-constraint error instead of checking first

- **Context:** Two accounts must not share an email.
- **Decision:** Register inserts directly and turns Prisma's unique-constraint error (`P2002`) into `409 EMAIL_TAKEN`, instead of looking the email up first.
- **Why:** A "check, then insert" has a gap in which a second request can slip through. The database's unique index has no gap.
- **Trade-off:** The service depends on a Prisma error code.
- **Code:** [`auth.service.ts`](../server/src/services/auth.service.ts)

## 14. Overlap check in the service

- **Context:** An employee can't work two shifts at the same time.
- **Decision:** Before a create or update, the service queries for an overlapping shift of the same employee (`start < otherEnd` and `end > otherStart`) and returns `409 SHIFT_OVERLAP` with the conflicting shift. Back-to-back shifts are allowed, and open shifts aren't checked.
- **Why:** It's simple, gives a clear error message with details, and is easy to follow in the code.
- **Trade-off:** It has the same check-then-insert gap as in 13: two simultaneous requests could both pass. The planned fix is a PostgreSQL exclusion constraint on the employee and time range.
- **Code:** [`shift.service.ts`](../server/src/services/shift.service.ts) (`assertNoOverlap`)

## 15. Migrations in the Render build step

- **Context:** Database migrations have to run on every deploy, and Render's free tier has no pre-deploy command.
- **Decision:** `npm run build:render` runs `prisma generate`, then `tsc`, then `prisma migrate deploy`.
- **Why:** Migrations run last, so a build that fails to compile never touches the database.
- **Trade-off:** If the migration succeeds but the new version then fails to start, the database is already migrated while the old version keeps running. Migrations must therefore stay backwards compatible.
- **Code:** [`server/package.json`](../server/package.json)

## 16. No date library

- **Context:** The calendar needs week starts, day offsets, formatting and `datetime-local` conversion.
- **Decision:** About 150 lines of plain helpers using `Date` and `Intl.DateTimeFormat`, instead of a library like date-fns or Day.js.
- **Why:** The needs are small, there are no extra dependencies, and each helper documents its pitfalls (DST, local vs UTC parsing).
- **Trade-off:** The edge cases are ours to get right. More complex features (time zones per team, recurring shifts) would likely justify a library.
- **Code:** [`dates.ts`](../client/src/lib/dates.ts)
