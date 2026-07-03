import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import chatRouter from './routes/chat.js'
import { chatRateLimiter } from './lib/rateLimit.js'

function parseAllowedOrigins(value) {
  if (!value) return []
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

const app = express()
app.set('trust proxy', 1)

const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGIN)

app.use(express.json({ limit: '20kb' }))
app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  }),
)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/chat', chatRateLimiter, chatRouter)

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Salagrillit chat backend listening on port ${port}`)
})
