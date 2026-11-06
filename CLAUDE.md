# CLAUDE.md

Instructions for Claude Code when working in this repository.

## Project overview

ShiftHub ("Shift scheduling made simple") is a full-stack **portfolio project** for planning and managing work shifts. The goal is a polished, deployed app to show recruiters, **finished in about one month** (started November 2026). Prefer simple, working solutions over complex ones, and keep each step deployable.

## Stack and versions

**Client** (`client/`)
- React 19, TypeScript 6, Vite 8
- Tailwind CSS v4 via the `@tailwindcss/vite` plugin. There is no `tailwind.config.js`; theme changes go in `@theme` in `src/index.css`.
- ESLint 10 with `typescript-eslint` and `eslint-plugin-react-hooks` v7

**Server** (`server/`)
- Node.js 24, Express 5, TypeScript 7
- Prisma 7.10.1, pinned on purpose (npm's `latest` tag currently points to an 8.x release candidate; don't upgrade without asking)
- PostgreSQL on Neon, connected through `@prisma/adapter-pg` and `pg`
- `tsx` for development, `tsc` for builds, `dotenv` for local env loading, `cors`

## Folder structure

```
ShiftHub/
├── client/
│   ├── src/
│   │   ├── App.tsx          # Landing page + API status box
│   │   ├── api.ts           # fetch helpers, reads VITE_API_URL
│   │   ├── vite-env.d.ts    # types for import.meta.env
│   │   ├── main.tsx
│   │   └── index.css        # @import "tailwindcss"
│   └── .env.example
└── server/
    ├── prisma/
    │   ├── schema.prisma    # models (currently: User)
    │   └── migrations/      # committed SQL migrations
    ├── prisma.config.ts     # Prisma CLI config (DB URL lives here, not in schema)
    ├── src/
    │   ├── index.ts         # loads dotenv, starts server on PORT (default 3000)
    │   ├── app.ts           # express app, CORS, mounts routers
    │   ├── lib/prisma.ts    # shared PrismaClient
    │   ├── routes/          # one router file per resource
    │   └── generated/       # Prisma client output (git-ignored, built by prisma generate)
    └── .env.example
```

## npm scripts

**Client** (run in `client/`)

| Script | Command | Purpose |
| --- | --- | --- |
| `npm run dev` | `vite` | Dev server on http://localhost:5173 |
| `npm run build` | `tsc -b && vite build` | Type-check and build to `dist/` |
| `npm run lint` | `eslint .` | Lint |
| `npm run preview` | `vite preview` | Preview the production build |

**Server** (run in `server/`)

| Script | Command | Purpose |
| --- | --- | --- |
| `npm run dev` | `prisma generate && tsx watch src/index.ts` | Dev server with auto-restart |
| `npm run build` | `prisma generate && tsc` | Build to `dist/` (does not touch the DB) |
| `npm run build:render` | `npm run build && prisma migrate deploy` | Render build: build + apply migrations |
| `npm start` | `node dist/index.js` | Run the production build |
| `npm run db:migrate` | `prisma migrate dev` | Create/apply a migration after schema changes |
| `npm run db:studio` | `prisma studio` | Browse data in the browser |

After changing a feature, verify with `npm run build` (both apps) and `npm run lint` (client).

## Deployment

- **Vercel** (frontend): root directory `client`, Vite preset. Env: `VITE_API_URL` (the Render API URL, no trailing slash). `VITE_` variables are baked in at build time and are public, so changing one requires a redeploy and they must never hold secrets.
- **Render** (API): root directory `server`, build command `npm install && npm run build:render`, start command `npm start`. Env: `DATABASE_URL`, `CLIENT_URL` (the Vercel URL, no trailing slash). Render sets `PORT` itself. Migrations run during the build because the free tier has no pre-deploy command.
- Live URLs: frontend https://shifthub-red.vercel.app, API https://shifthub-api-d1zy.onrender.com/api/health (free tier, cold start up to ~50 s).

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | client | Base URL of the API |
| `PORT` | server | Port to listen on (default 3000) |
| `CLIENT_URL` | server | Only origin allowed by CORS (default http://localhost:5173) |
| `DATABASE_URL` | server | Neon PostgreSQL connection string (pooled) |
| `DIRECT_URL` | server, optional | Direct Neon URL, used only by the Prisma CLI for migrations |

When adding a variable, also add it to the matching `.env.example` with a **placeholder** value.

## Conventions

- TypeScript `strict` mode everywhere. Avoid `any`.
- The server uses ES modules (`"type": "module"`, `NodeNext`): **relative imports must end in `.js`** (for example `import app from './app.js'`), even from `.ts` files.
- Routes live in `server/src/routes/`, one `Router` per resource, mounted under `/api/...` in `src/app.ts`.
- Always import the shared client from `src/lib/prisma.ts`. Never create another `PrismaClient`.
- Schema changes: edit `prisma/schema.prisma`, run `npm run db:migrate -- --name <description>`, and commit the new migration folder.
- Client styling uses Tailwind utility classes only. No separate CSS files per component.
- Client API calls go through `client/src/api.ts`.

## Rules for working with me

1. **I'm learning.** After every change, explain in simple terms what you changed and why, file by file. Explain new concepts briefly when they first come up.
2. **Never print, log or commit secrets.** Don't read `.env` files out loud: no `cat`, no printing values, no echoing `DATABASE_URL`. If you need to check a variable, check only that it exists. Filter command output that could contain connection strings, and never put real values in code, docs or `.env.example`.
3. **Keep changes small and focused.** Do only the task asked; mention other improvements as suggestions instead of making them.
4. **Suggest a git commit message** at the end of each task (Conventional Commits style, for example `feat(server): add shifts CRUD routes`). Don't commit unless I ask.
