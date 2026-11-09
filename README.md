# ShiftHub

Shift scheduling made simple.

ShiftHub is a full-stack web app for planning and managing work shifts. It has a React frontend, an Express REST API and a PostgreSQL database.

## Live demo

- **Frontend:** https://shifthub-red.vercel.app
- **API health check:** https://shifthub-api-d1zy.onrender.com/api/health

> The API runs on Render's free tier and sleeps when idle, so the first request can take up to about 50 seconds while it wakes up.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL on Neon, Prisma ORM |
| Deployment | Vercel (frontend), Render (API) |

## Project structure

```
shifthub/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx         # Landing page with API status
│   │   ├── api.ts          # API client (reads VITE_API_URL)
│   │   └── index.css       # Tailwind entry point
│   └── .env.example
└── server/                 # Express + Prisma API
    ├── prisma/
    │   ├── schema.prisma   # Database schema
    │   └── migrations/     # SQL migration history
    ├── prisma.config.ts    # Prisma CLI configuration
    ├── requests/           # REST Client examples (shifts.http, auth.http)
    ├── src/
    │   ├── index.ts        # Server entry point
    │   ├── app.ts          # Express app and middleware
    │   ├── config/env.ts   # Environment variable validation
    │   ├── lib/
    │   │   ├── prisma.ts   # Shared Prisma client
    │   │   └── jwt.ts      # Sign and verify login tokens
    │   ├── types/
    │   │   └── express.d.ts # Adds req.user to Express's Request type
    │   ├── routes/         # URL + method -> validation -> controller
    │   ├── controllers/    # HTTP in/out, status codes
    │   ├── services/       # Business rules and database access
    │   ├── schemas/        # Zod validation schemas
    │   ├── middleware/     # validate, requireAuth, requireRole, notFound, errorHandler
    │   └── errors/         # AppError class
    └── .env.example
```

## Running locally

### Prerequisites

- Node.js 20 or newer (developed on Node.js 24)
- A PostgreSQL database, for example a free [Neon](https://neon.tech) project

### 1. Clone and install

```bash
git clone https://github.com/blagojramadanov/shifthub.git
cd shifthub

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

Copy the example files and fill in your own values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**`server/.env`**

```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=verify-full"
JWT_SECRET=replace-with-at-least-32-random-characters
JWT_EXPIRES_IN=1d
```

`JWT_SECRET` signs login tokens and must be at least 32 characters; the server won't start without it. Generate a random one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**`client/.env`**

```env
VITE_API_URL=http://localhost:3000
```

### 3. Set up the database

```bash
cd server
npx prisma migrate dev
npx prisma generate
```

The first command applies all migrations to your database. The second generates the Prisma client into `src/generated/`, because Prisma 7 no longer does this as part of `migrate dev`. (`npm run dev` and `npm run build` also run `prisma generate` for you.)

### 4. Start the development servers

In two terminals:

```bash
# Terminal 1: API on http://localhost:3000
cd server
npm run dev
```

```bash
# Terminal 2: frontend on http://localhost:5173
cd client
npm run dev
```

Open http://localhost:5173. The status box should show **API connected**.

## API

| Method | Endpoint | Description | Success |
| --- | --- | --- | --- |
| GET | `/api/health` | API and database status | 200 |
| POST | `/api/auth/register` | Create an account (`name`, `email`, `password`), returns `{ token, user }` | 201 |
| POST | `/api/auth/login` | Log in (`email`, `password`), returns `{ token, user }` | 200 |
| GET | `/api/auth/me` | Current user (header `Authorization: Bearer <token>`) | 200 |
| GET | `/api/shifts` | List shifts, ordered by start time | 200 |
| GET | `/api/shifts/:id` | Get one shift | 200 |
| POST | `/api/shifts` | Create a shift | 201 |
| PATCH | `/api/shifts/:id` | Update a shift (send only the fields to change) | 200 |
| DELETE | `/api/shifts/:id` | Delete a shift | 204 |

Ready-to-run examples for every endpoint, including failing cases, are in [`server/requests/shifts.http`](server/requests/shifts.http) and [`server/requests/auth.http`](server/requests/auth.http) (VS Code [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension).

### Authentication

- Register or log in to get a JWT, then send it with each request as `Authorization: Bearer <token>`. Tokens expire after `JWT_EXPIRES_IN` (default 1 day).
- There are two roles: `MANAGER` and `EMPLOYEE`. Register always creates an `EMPLOYEE`; a manager has to be promoted in the database.
- Passwords are hashed with bcrypt and never returned by the API. Login gives the same error for an unknown email and a wrong password.
- The shift routes are **not protected yet**: they work without a token for now.

### Shifts

**Shift fields**

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | Required on create, 1–100 characters |
| `startTime` | ISO 8601 date-time with timezone | Required on create, e.g. `2026-12-01T08:00:00Z` |
| `endTime` | ISO 8601 date-time with timezone | Required on create, after `startTime`, at most 16 hours later |
| `position` | string \| null | Optional, max 50 characters, `null` clears it on update |
| `notes` | string \| null | Optional, max 500 characters, `null` clears it on update |
| `employeeId` | integer \| null | Optional, must be an existing user, `null` = unassigned |

**Example: create a shift**

```http
POST /api/shifts
Content-Type: application/json

{
  "title": "Morning shift",
  "startTime": "2026-12-01T08:00:00Z",
  "endTime": "2026-12-01T16:00:00Z",
  "position": "Kitchen",
  "employeeId": 1
}
```

Responses include the assigned employee (`id`, `name`, `email` only):

```json
{
  "id": "3f1c2a9e-8b7d-4c6e-9a5b-1d2e3f4a5b6c",
  "title": "Morning shift",
  "startTime": "2026-12-01T08:00:00.000Z",
  "endTime": "2026-12-01T16:00:00.000Z",
  "position": "Kitchen",
  "notes": null,
  "employeeId": 1,
  "createdAt": "2026-11-08T20:00:00.000Z",
  "updatedAt": "2026-11-08T20:00:00.000Z",
  "employee": { "id": 1, "name": "Alex", "email": "alex@example.com" }
}
```

**List filters** (all optional): `from`, `to` (dates; returns shifts that overlap this window, `from` must be before `to`) and `employeeId`.

```
GET /api/shifts?from=2026-12-01T00:00:00Z&to=2027-01-01T00:00:00Z&employeeId=1
```

**Business rules**

- An employee can't have two overlapping shifts (`409 SHIFT_OVERLAP`). Back-to-back shifts are allowed, and unassigned shifts are never checked.
- An update that sends only `startTime` or only `endTime` is checked against the stored value.
- An update must contain at least one field.

### Errors

Every error has the same shape:

```json
{ "error": { "message": "Validation failed", "code": "VALIDATION_ERROR", "details": { "endTime": ["endTime must be after startTime"] } } }
```

| Status | Code | When |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Invalid body, params or query (`details` lists errors per field) |
| 400 | `INVALID_REFERENCE` | `employeeId` doesn't match an existing user |
| 401 | `UNAUTHORIZED` | Missing, invalid or expired token |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password |
| 403 | `FORBIDDEN` | Logged in, but your role isn't allowed to do this |
| 404 | `SHIFT_NOT_FOUND` | No shift with this id |
| 404 | `ROUTE_NOT_FOUND` | Unknown URL |
| 409 | `SHIFT_OVERLAP` | Employee already has a shift during this time |
| 409 | `EMAIL_TAKEN` | An account with this email already exists |
| 500 | `INTERNAL_ERROR` | Unexpected server error (no details in production) |

## Roadmap

- [x] Shifts CRUD API with validation and overlap checks
- [ ] Shifts UI (create, view, edit and delete shifts in the frontend)
- [ ] Authentication with JWT and role-based access (roles: manager, employee). **In progress:** backend done; protected routes and login UI next
- [ ] Calendar UI for weekly and monthly schedules
- [ ] Real-time schedule updates
- [ ] Automated tests for the client and server
- [ ] Docker setup for local development
