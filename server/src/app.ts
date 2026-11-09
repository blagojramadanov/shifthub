import cors from 'cors'
import express from 'express'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import authRouter from './routes/auth.js'
import healthRouter from './routes/health.js'
import shiftsRouter from './routes/shifts.js'

// Only this origin may call the API from a browser.
// A trailing slash is removed because browsers send the Origin header without one.
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '')

const app = express()

app.use(cors({ origin: CLIENT_URL }))
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/shifts', shiftsRouter)

// These two must stay LAST: notFound catches unmatched routes,
// errorHandler catches every error passed along from above.
app.use(notFound)
app.use(errorHandler)

export default app
