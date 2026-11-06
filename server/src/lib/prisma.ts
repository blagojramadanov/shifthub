import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

// One shared client for the whole app. Each PrismaClient owns a connection
// pool, so creating one per request would quickly exhaust the database.
const adapter = new PrismaPg({ connectionString })

export const prisma = new PrismaClient({ adapter })
