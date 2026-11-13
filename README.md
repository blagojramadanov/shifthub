# ShiftHub

Shift scheduling made simple.

ShiftHub is a full-stack web app for planning work shifts. Managers create, edit and assign shifts in a weekly calendar. Employees see their own shifts and the open (unassigned) ones. Changes show up in every open browser without a page refresh.

## Live demo

**https://shifthub-red.vercel.app**

- The API runs on Render's free tier and sleeps when idle, so the first request can take up to about 50 seconds.
- Create an account on the sign-up page (`/register`). New accounts join the team as employees; the manager view is shown in the screenshots below.

## Screenshots

<!-- TODO: add screenshots (manager week, employee week, shift modal) -->

## Features

- **Sign-up, login and roles.** JWT authentication with two roles: managers plan shifts, employees view them. Anyone can sign up, but self-registered accounts are always employees. The server enforces every permission.
- **Weekly calendar.** Monday-to-Sunday view with week navigation. The previous shifts stay visible while a week reloads.
- **Open shifts.** Shifts without an employee are marked "Open" and visible to all employees.
- **Overnight shifts.** A shift ending the next day shows `+1`. A shift that started in the previous week appears on Monday as a faded continuation card.
- **Realtime updates.** When a manager saves or deletes a shift, every connected browser reloads its week (Server-Sent Events).
- **Overlap detection.** An employee can't be booked for two shifts at the same time (back-to-back shifts are allowed).

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router |
| Backend | Node.js, Express 5, TypeScript, Zod, JSON Web Tokens, bcrypt |
| Database | PostgreSQL on Neon, Prisma ORM 7 |
| Deployment | Vercel (frontend), Render (API) |

## Running locally

### Prerequisites

- Node.js (developed on Node.js 24)
- A PostgreSQL database, for example a free [Neon](https://neon.tech) project

### 1. Install

```bash
git clone https://github.com/blagojramadanov/shifthub.git
cd shifthub
cd server && npm install
cd ../client && npm install
```

### 2. Environment variables

Copy the example files and fill in your own values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

- `server/.env` needs `DATABASE_URL` (your PostgreSQL connection string) and `JWT_SECRET` (at least 32 random characters; the server won't start without it). The other variables have working defaults. Each one is explained in the example file.
- `client/.env` needs `VITE_API_URL=http://localhost:3000`.

To generate a `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### 3. Database

```bash
cd server
npx prisma migrate dev    # applies all migrations
npx prisma generate       # generates the Prisma client into src/generated/
```

(`npm run dev` and `npm run build` also run `prisma generate`.)

### 4. Start

```bash
# Terminal 1: API on http://localhost:3000
cd server && npm run dev

# Terminal 2: frontend on http://localhost:5173
cd client && npm run dev
```

### 5. Create users

Sign up at http://localhost:5173/register, or use the requests in [`server/requests/auth.http`](server/requests/auth.http) (VS Code [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension). Every new account is an employee. To make one a manager, update it in your own database (SQL below, or `npm run db:studio` in `server/`), then log in again:

```sql
UPDATE "User" SET role = 'MANAGER' WHERE email = '<your email>';
```

## Project structure

```
shifthub/
├── client/            # React SPA (Vite)
│   └── src/
│       ├── api/       # one module per API resource
│       ├── auth/      # auth context and route guards
│       ├── components/# calendar, shift form/modal, login/register layout
│       ├── hooks/     # data loading and realtime events
│       ├── lib/       # fetch wrapper, date helpers
│       └── pages/     # login, register and home
└── server/            # Express REST API
    ├── prisma/        # schema and migrations
    ├── requests/      # REST Client examples for every endpoint
    └── src/           # routes -> controllers -> services
```

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): how it fits together, API endpoints, error format, auth, data model, realtime flow, deployment.
- [docs/DECISIONS.md](docs/DECISIONS.md): the main technical decisions and their trade-offs.

## Known limitations

- **Times are shown in the browser's time zone.** Two people in different time zones see the same shift at different clock times. There is no per-team time zone setting.
- **Realtime state is kept in memory.** SSE connections and tickets live in the server process, so the API must run as a single instance. A restart drops all streams, and browsers reconnect.
- **Cold starts.** Render's free tier sleeps after inactivity; the first request can take about 50 seconds.
- **Overlap check race condition.** The check and the insert are separate queries, so two simultaneous requests could both pass and double-book an employee. Planned fix: a PostgreSQL exclusion constraint on the employee and time range.
- **Role changes apply after the token expires.** The server trusts the role inside the login token (no database lookup per request), so a promoted user has to log in again.
- **No automated tests yet** (see the roadmap).

## Roadmap

- [ ] Structured request logging
- [ ] ESLint for the server (the client already has it) and Prettier for both
- [ ] Automated tests with Vitest and Supertest
- [ ] Security headers with helmet
- [ ] Rate limiting on login and register
- [ ] Seed script for the first manager and demo accounts, with "Try demo" buttons on the login page
- [ ] Team page where managers promote employees
- [ ] Docker setup for local development
