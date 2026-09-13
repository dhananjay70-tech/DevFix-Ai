import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import routes from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

// Security & Cookie Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow cross-origin redirections for OAuth
}))

const defaultOrigins = [
  'https://dev-fix-ai.vercel.app',
  'https://devfix-ai.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
]

const envOrigins = [
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [])
].map(origin => origin.trim().replace(/\/+$/, '')).filter(Boolean)

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]))

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true)
    }
    const normalizedOrigin = origin.replace(/\/+$/, '')
    const isAllowed =
      allowedOrigins.includes(normalizedOrigin) ||
      allowedOrigins.includes(origin) ||
      /^https:\/\/dev-?fix-?ai.*\.vercel\.app$/.test(normalizedOrigin)

    if (isAllowed) {
      return callback(null, true)
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 204
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Health Check Routes for Render and monitoring
app.get(['/', '/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'DevFix AI Backend'
  })
})

// Mount API Routes
app.use('/api', routes)

// 404 Handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`)
  res.status(404)
  next(error)
})

// Centralized Error Handler
app.use(errorHandler)

export default app
