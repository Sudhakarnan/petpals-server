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
// --- CORS FIRST ---
const rawOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

// sensible defaults for local dev too
if (!rawOrigins.length) rawOrigins.push('http://localhost:5173')

const allowedOrigins = new Set(rawOrigins)
// OPTIONAL: allow all Netlify preview subdomains
const allowRegexes = [/\.netlify\.app$/]

const corsOptions = {
  origin(origin, cb) {
    // same-origin / curl / server-to-server (no Origin header)
    if (!origin) return cb(null, true)

    if (allowedOrigins.has(origin) || allowRegexes.some(rx => rx.test(origin))) {
      return cb(null, true)
    }
    return cb(new Error(`Not allowed by CORS: ${origin}`))
  },
  credentials: true, // ok even if you don’t use cookies
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 204
}

app.use(cors(corsOptions))
// ensure preflights are answered
app.options('*', cors(corsOptions))
// --- END CORS ---

app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

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