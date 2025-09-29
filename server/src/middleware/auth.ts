import { Request, Response, NextFunction } from 'express'
import { User } from '../models/User'
import { verifyToken } from '../utils/jwt'
import { AppError } from './errorHandler'

export interface AuthRequest extends Request {
  user?: any
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    })
    return
  }

  try {
    const decoded = verifyToken(token)
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'No user found with this token'
      })
      return
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    })
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      })
      return
    }

    next()
  }
}
