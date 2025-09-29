import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { User } from '../models/User'
import { AppError } from '../middleware/errorHandler'
import logger from '../utils/logger'
import { generateToken, generateResetToken, generateVerificationToken, verifyToken } from '../utils/jwt'

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.type === 'field' ? error.path : 'unknown',
          message: error.msg,
          value: (error as any).value || undefined
        }))
      })
      return
    }

    const { email, password, firstName, lastName, educationLevel, agreeToTerms } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User already exists with this email address',
        error: 'EMAIL_EXISTS'
      })
      return
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      educationLevel: educationLevel || undefined,
      profile: {
        preferredLanguage: 'en',
        timezone: 'Asia/Kolkata'
      }
    })

    const token = generateToken({ id: (user._id as any).toString() })

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          educationLevel: user.educationLevel,
          institution: user.institution,
          isVerified: user.isVerified
        },
        token
      }
    })

    logger.info(`New user registered: ${user.email}`)
  } catch (error) {
    next(error)
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.type === 'field' ? error.path : 'unknown',
          message: error.msg,
          value: (error as any).value || undefined
        }))
      })
      return
    }

    const { email, password, userType } = req.body

    // Check for user
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      })
      return
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      })
      return
    }

    // Check if user type matches (if provided)
    if (userType && user.role !== userType) {
      res.status(403).json({
        success: false,
        message: `Access denied. This account is for ${user.role}s, not ${userType}s.`,
        error: 'INVALID_USER_TYPE'
      })
      return
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    const token = generateToken({ id: (user._id as any).toString() })

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          educationLevel: user.educationLevel,
          institution: user.institution,
          isVerified: user.isVerified
        },
        token
      }
    })

    logger.info(`User logged in: ${user.email}`)
  } catch (error) {
    next(error)
  }
}

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    })

    logger.info(`User logged out: ${(req as any).user?.email}`)
  } catch (error) {
    next(error)
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById((req as any).user._id).populate('institution')

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      'profile.phoneNumber': req.body.phoneNumber,
      'profile.bio': req.body.bio,
      'profile.preferredLanguage': req.body.preferredLanguage,
      'profile.timezone': req.body.timezone
    }

    const user = await User.findByIdAndUpdate(
      (req as any).user._id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    )

    res.json({
      success: true,
      data: user
    })

    logger.info(`User profile updated: ${(req as any).user.email}`)
  } catch (error) {
    next(error)
  }
}

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      })
      return
    }

    const { currentPassword, newPassword } = req.body

    const user = await User.findById((req as any).user._id).select('+password')

    // Check current password
    const isMatch = await user!.matchPassword(currentPassword)
    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      })
      return
    }

    user!.password = newPassword
    await user!.save()

    res.json({
      success: true,
      message: 'Password updated successfully'
    })

    logger.info(`Password changed for user: ${(req as any).user.email}`)
  } catch (error) {
    next(error)
  }
}

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      })
      return
    }

    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'No user found with this email'
      })
      return
    }

    // Generate reset token
    const resetToken = generateResetToken({ id: (user._id as any).toString() })

    // TODO: Send email with reset token
    // For now, just return success
    res.json({
      success: true,
      message: 'Password reset email sent',
      resetToken // Remove this in production
    })

    logger.info(`Password reset requested for: ${email}`)
  } catch (error) {
    next(error)
  }
}

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      })
      return
    }

    const { token, password } = req.body

    // Verify token
    const decoded = verifyToken(token)

    const user = await User.findById(decoded.id)
    if (!user) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      })
      return
    }

    user.password = password
    await user.save()

    res.json({
      success: true,
      message: 'Password reset successfully'
    })

    logger.info(`Password reset completed for: ${user.email}`)
  } catch (error) {
    next(error)
  }
}

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body

    // Verify token
    const decoded = verifyToken(token)

    const user = await User.findById(decoded.id)
    if (!user) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      })
      return
    }

    user.isVerified = true
    await user.save()

    res.json({
      success: true,
      message: 'Email verified successfully'
    })

    logger.info(`Email verified for: ${user.email}`)
  } catch (error) {
    next(error)
  }
}

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
export const resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById((req as any).user._id)

    if (user!.isVerified) {
      res.status(400).json({
        success: false,
        error: 'Email is already verified'
      })
      return
    }

    // Generate verification token
    const verificationToken = generateVerificationToken({ id: (user!._id as any).toString() })

    // TODO: Send verification email
    res.json({
      success: true,
      message: 'Verification email sent',
      verificationToken // Remove this in production
    })

    logger.info(`Verification email resent for: ${user!.email}`)
  } catch (error) {
    next(error)
  }
}
