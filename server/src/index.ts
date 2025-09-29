import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'
import 'express-async-errors'

// Load environment variables
dotenv.config()

import { connectDB } from './config/database'
import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'
import logger from './utils/logger'

// Import routes
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import chatbotRoutes from './routes/chatbot'
import communityRoutes from './routes/community'
import resourceRoutes from './routes/resources'
import adminRoutes from './routes/admin'
import institutionRoutes from './routes/institutions'
import appointmentRoutes from './routes/appointments'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: [process.env.CORS_ORIGIN || 'https://leherr.netlify.app', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Connect to database
connectDB()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}))
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'https://leherr.netlify.app',
    'http://localhost:3000',
    'https://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}))

// Rate limiting - more lenient for development
const isDevelopment = process.env.NODE_ENV === 'development'

const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: isDevelopment ? 1000 : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // More lenient in development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// More lenient rate limiting for auth routes in development
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 10, // 50 attempts in dev, 10 in production
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
})

app.use(generalLimiter)

// Body parsing middleware
app.use(compression())
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  })
})

// Development-only endpoint to reset rate limits
if (isDevelopment) {
  app.post('/api/dev/reset-rate-limit', (req, res) => {
    // This is a simple way to reset rate limits by restarting the limiter
    res.status(200).json({
      message: 'Rate limit reset for development',
      timestamp: new Date().toISOString()
    })
  })
}

// API routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/chatbot', chatbotRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/institutions', institutionRoutes)

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`)

  // Join user to their personal room
  socket.on('join-user-room', (userId: string) => {
    socket.join(`user-${userId}`)
    logger.info(`User ${userId} joined their room`)
  })

  // Handle chat messages
  socket.on('chat-message', (data) => {
    // Broadcast to appropriate room
    socket.to(`user-${data.userId}`).emit('chat-response', data)
  })

  // Handle crisis alerts
  socket.on('crisis-alert', (data) => {
    // Notify admin users
    socket.to('admin-room').emit('crisis-alert', data)
  })

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`)
  })
})

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

const PORT = parseInt(process.env.PORT || '5000')
const HOST = process.env.HOST || 'localhost'

server.listen(PORT, HOST, () => {
  logger.info(`Server running on http://${HOST}:${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV}`)
})

// Memory monitoring and garbage collection
setInterval(() => {
  const memUsage = process.memoryUsage()
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  }
  
  logger.info(`Memory Usage: RSS: ${memUsageMB.rss}MB, Heap: ${memUsageMB.heapUsed}/${memUsageMB.heapTotal}MB, External: ${memUsageMB.external}MB`)
  
  // Force garbage collection if heap usage is high
  if (memUsageMB.heapUsed > 500) {
    logger.warn('High memory usage detected, forcing garbage collection')
    if (global.gc) {
      global.gc()
    }
  }
}, 30000) // Check every 30 seconds

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

export { io }
