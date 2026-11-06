import cors from 'cors'
import express from 'express'
import healthRouter from './routes/health.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/health', healthRouter)

export default app
