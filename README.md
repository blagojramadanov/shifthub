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
ShiftHub/
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
    ├── src/
    │   ├── index.ts        # Server entry point
    │   ├── app.ts          # Express app and middleware
    │   ├── lib/prisma.ts   # Shared Prisma client
    │   └── routes/         # Route handlers
    └── .env.example
```

## Running locally

### Prerequisites

- Node.js 20 or newer (developed on Node.js 24)
- A PostgreSQL database, for example a free [Neon](https://neon.tech) project

### 1. Clone and install

```bash
git clone <https://github.com/blagojramadanov/shifthub.git>
cd ShiftHub

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
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=verify-full"
```

**`client/.env`**

```env
VITE_API_URL=http://localhost:3000
```

### 3. Set up the database

```bash
cd server
npx prisma migrate dev
```

This applies all migrations and generates the Prisma client.

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

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Returns API and database status |

```json
{ "status": "ok", "app": "ShiftHub", "database": "connected" }
```

## Roadmap

- [ ] Shifts CRUD (create, view, edit and delete shifts)
- [ ] Authentication with JWT and role-based access (admin, manager, employee)
- [ ] Calendar UI for weekly and monthly schedules
- [ ] Real-time schedule updates
- [ ] Automated tests for the client and server
- [ ] Docker setup for local development
