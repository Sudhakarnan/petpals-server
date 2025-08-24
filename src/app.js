import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import compression from 'compression'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(compression())

app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(',') || ['http://localhost:5173'],
    credentials: true,
    exposedHeaders: ['Authorization'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Static uploads
app.use('/uploads', express.static(
  path.join(__dirname, 'public', 'uploads'),
  { maxAge: '7d', etag: true, immutable: true }
))
// Routes
import authRoutes from './routes/auth.routes.js'
import petsRoutes from './routes/pets.routes.js'
import applicationsRoutes from './routes/applications.routes.js'
import reviewsRoutes from './routes/reviews.routes.js'
import messagesRoutes from './routes/messages.routes.js'
import favoritesRoutes from './routes/favorites.routes.js'
import sheltersRoutes from './routes/shelters.routes.js'

app.use('/api/auth', authRoutes)
app.use('/api/pets', petsRoutes)
app.use('/api/applications', applicationsRoutes)
app.use('/api/reviews', reviewsRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/favorites', favoritesRoutes)
app.use('/api/shelters', sheltersRoutes)

// Health check
app.get('/api/health', (_, res) => res.json({ ok: true }))

// 404
app.use((req, res) => res.status(404).json({ message: 'Not found' }))

// Error handler
app.use((err, req, res, next) => {
  // Better dev diagnostics
  console.error('ERROR:', err && (err.stack || err))
  const code = err.status || 500
  const payload = { message: err.message || 'Server error' }
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack
  }
  res.status(code).json(payload)
})

export default app