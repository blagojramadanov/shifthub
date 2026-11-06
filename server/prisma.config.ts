import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Configuration for the Prisma CLI (generate, migrate, studio).
// The running app does NOT use this file; it connects via src/lib/prisma.ts.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Migrations work best over a direct (non-pooled) connection on Neon.
    // Set DIRECT_URL to use one; otherwise DATABASE_URL is used.
    url: process.env.DIRECT_URL || env('DATABASE_URL'),
  },
})
