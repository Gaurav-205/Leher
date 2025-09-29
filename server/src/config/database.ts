import mongoose from 'mongoose'
import logger from '@utils/logger'

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://gauravkhandelwal205_db_user:gaurav@cluster0.urnv9wg.mongodb.net/test'
    
    // Mask sensitive parts of URI for logging
    const maskedURI = mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
    logger.info(`🔗 Connecting to MongoDB with URI: ${maskedURI}`)
    
    const databaseName = mongoURI.split('/').pop()?.split('?')[0] || 'default'
    logger.info(`📊 Database name: ${databaseName}`)
    
    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    })

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`)

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected')
    })

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected')
    })

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`)
      try {
        await mongoose.connection.close()
        logger.info('MongoDB connection closed through app termination')
        process.exit(0)
      } catch (error) {
        logger.error('Error during graceful shutdown:', error)
        process.exit(1)
      }
    }

    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

  } catch (error) {
    logger.error('Database connection failed:', error)
    // Retry connection after 5 seconds
    setTimeout(() => {
      logger.info('Retrying database connection...')
      connectDB()
    }, 5000)
  }
}

export { connectDB }
