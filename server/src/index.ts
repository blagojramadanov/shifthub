import 'dotenv/config'
// Checks env variables right after .env is loaded: a bad config stops the server here.
import './config/env.js'
import app from './app.js'

const PORT = Number(process.env.PORT) || 3000

app.listen(PORT, () => {
  console.log(`ShiftHub API listening on http://localhost:${PORT}`)
})
