import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'
import meetingsRouter from './routes/meetings'
import messagesRouter from './routes/messages'
import aiRouter from './routes/ai'
import runRouter from './routes/run'
import billingRouter from './routes/billing'

const app = express()
const PORT = process.env.PORT || 5000

// Configure CORS to dynamically allow requests from local development origins
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    // Allow localhost, 127.0.0.1, LAN IPs, or the environment frontend URL
    const envOrigin = process.env.FRONTEND_URL || 'http://localhost:3000'
    if (
      origin === envOrigin ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.startsWith('http://10.') ||
      origin.startsWith('http://192.168.') ||
      origin.startsWith('https://meet.codovatesolutions.in')
    ) {
      return callback(null, true)
    }
    // Allow all origins in development, reject unrecognized origins in production
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    }
    return callback(new Error(`CORS: Origin '${origin}' not allowed`))
  },
  credentials: true
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'codovate-meet-backend' })
})

// Register routes matching Next.js API endpoints
app.use('/api', authRouter)
app.use('/api/meetings', meetingsRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/ai', aiRouter)
app.use('/api/run', runRouter)
app.use('/api/billing', billingRouter)

app.listen(PORT, () => {
  console.log(`[SERVER SUCCESS] Backend server running on port ${PORT}`)
})
