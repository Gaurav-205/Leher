import express from 'express'
import { body, param, query } from 'express-validator'
import { protect, authorize } from '../middleware/auth'
import {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAvailableCounselors,
  getCounselorAvailability
} from '../controllers/appointmentController'

const router = express.Router()

// Most routes are protected, but counselor browsing is public

// Validation rules
const appointmentValidation = [
  body('counselorId')
    .isMongoId()
    .withMessage('Valid counselor ID is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid date is required')
    .custom((value) => {
      const appointmentDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (appointmentDate < today) {
        throw new Error('Appointment date cannot be in the past')
      }
      
      // Check if appointment is not more than 3 months in advance
      const maxDate = new Date()
      maxDate.setMonth(maxDate.getMonth() + 3)
      
      if (appointmentDate > maxDate) {
        throw new Error('Appointment cannot be scheduled more than 3 months in advance')
      }
      
      return true
    }),
  body('time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid time format (HH:MM) is required'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 180 })
    .withMessage('Duration must be between 15 and 180 minutes'),
  body('type')
    .optional()
    .isIn(['individual', 'group', 'emergency'])
    .withMessage('Invalid appointment type'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters')
]

const updateAppointmentValidation = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Valid date is required')
    .custom((value) => {
      if (value) {
        const appointmentDate = new Date(value)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (appointmentDate < today) {
          throw new Error('Appointment date cannot be in the past')
        }
      }
      return true
    }),
  body('time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid time format (HH:MM) is required'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 180 })
    .withMessage('Duration must be between 15 and 180 minutes'),
  body('type')
    .optional()
    .isIn(['individual', 'group', 'emergency'])
    .withMessage('Invalid appointment type'),
  body('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid appointment status'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
  body('meetingLink')
    .optional()
    .isURL()
    .withMessage('Valid meeting link is required')
]

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid status filter'),
  query('type')
    .optional()
    .isIn(['individual', 'group', 'emergency'])
    .withMessage('Invalid type filter')
]

// Public routes (no authentication required)
// @route   GET /api/appointments/counselors
// @desc    Get available counselors
// @access  Public
router.get('/counselors', getAvailableCounselors)

// @route   GET /api/appointments/counselors/:id/availability
// @desc    Get counselor availability
// @access  Public
router.get('/counselors/:id/availability', [
  param('id').isMongoId().withMessage('Valid counselor ID is required'),
  query('date').optional().isISO8601().withMessage('Valid date is required')
], getCounselorAvailability)

// Protected routes (authentication required)
router.use(protect)

// @route   GET /api/appointments
// @desc    Get all appointments for a user
// @access  Private
router.get('/', queryValidation, getAppointments)

// @route   GET /api/appointments/:id
// @desc    Get single appointment
// @access  Private
router.get('/:id', [
  param('id').isMongoId().withMessage('Valid appointment ID is required')
], getAppointment)

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private
router.post('/', appointmentValidation, createAppointment)

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private
router.put('/:id', [
  param('id').isMongoId().withMessage('Valid appointment ID is required'),
  ...updateAppointmentValidation
], updateAppointment)

// @route   DELETE /api/appointments/:id
// @desc    Cancel appointment
// @access  Private
router.delete('/:id', [
  param('id').isMongoId().withMessage('Valid appointment ID is required')
], cancelAppointment)

export default router
