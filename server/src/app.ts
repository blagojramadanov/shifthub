import cors from 'cors'
import express from 'express'
import healthRouter from './routes/health.js'

// Only this origin may call the API from a browser.
// A trailing slash is removed because browsers send the Origin header without one.
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '')

const app = express()

app.use(cors({ origin: CLIENT_URL }))
app.use(express.json())

app.use('/api/health', healthRouter)

export default app
