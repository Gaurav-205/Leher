import express from 'express'
import { body } from 'express-validator'
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
} from '../controllers/authController'
import { protect } from '../middleware/auth'

const router = express.Router()

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  body('educationLevel')
    .optional()
    .isIn(['high-school', 'undergraduate', 'postgraduate', 'phd', 'working-professional', 'other'])
    .withMessage('Please select a valid education level'),
  body('agreeToTerms')
    .custom((value) => {
      if (value !== true && value !== 'true' && value !== 1) {
        throw new Error('You must agree to the terms and conditions')
      }
      return true
    })
]

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty'),
  body('userType')
    .optional()
    .isIn(['student', 'counselor', 'admin', 'moderator'])
    .withMessage('Please select a valid user type')
]

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
]

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
]

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
]

// Public routes
router.post('/register', registerValidation, register)
router.post('/login', loginValidation, login)
router.post('/forgot-password', forgotPasswordValidation, forgotPassword)
router.post('/reset-password', resetPasswordValidation, resetPassword)
router.post('/verify-email', verifyEmail)
router.post('/resend-verification', resendVerification)

// Protected routes
router.use(protect) // All routes below this middleware are protected

router.post('/logout', logout)
router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.put('/change-password', changePasswordValidation, changePassword)

export default router
