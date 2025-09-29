import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err }
  error.message = err.message

  // Log error
  logger.error('Error handler:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = { message, statusCode: 404 } as AppError
  }

  // Mongoose duplicate key
  if ((err.name === 'MongoError' || err.name === 'MongoServerError') && (err as any).code === 11000) {
    const message = 'Duplicate field value entered'
    error = { message, statusCode: 400 } as AppError
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ')
    error = { message: `Validation Error: ${message}`, statusCode: 400 } as AppError
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = { message, statusCode: 401 } as AppError
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = { message, statusCode: 401 } as AppError
  }

  // Syntax error
  if (err.name === 'SyntaxError') {
    const message = 'Invalid JSON syntax'
    error = { message, statusCode: 400 } as AppError
  }

  const statusCode = error.statusCode || 500
  const message = error.message || 'Internal Server Error'

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  })
}
