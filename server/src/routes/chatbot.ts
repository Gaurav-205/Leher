import express from 'express'
import { body } from 'express-validator'
import { protect } from '../middleware/auth'
import {
  sendMessage,
  getChatHistory,
  getChatSessions,
  endChatSession,
  getWellnessTips,
  trackMood
} from '../controllers/chatbotController'

const router = express.Router()

// All routes are protected
router.use(protect)

// Validation rules
const messageValidation = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('sessionId')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true // Allow null, undefined, or empty string
      }
      // If provided, it must be a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(value)) {
        throw new Error('Session ID must be a valid UUID')
      }
      return true
    })
]

// @desc    Send message to chatbot
// @route   POST /api/chatbot/message
// @access  Private
router.post('/message', messageValidation, sendMessage)

// @desc    Get chat history for a specific session
// @route   GET /api/chatbot/history/:sessionId
// @access  Private
router.get('/history/:sessionId', getChatHistory)

// @desc    Get user's chat sessions
// @route   GET /api/chatbot/sessions
// @access  Private
router.get('/sessions', getChatSessions)

// @desc    End chat session
// @route   DELETE /api/chatbot/sessions/:sessionId
// @access  Private
router.delete('/sessions/:sessionId', endChatSession)

// @desc    Get wellness tips
// @route   GET /api/chatbot/wellness-tips
// @access  Private
router.get('/wellness-tips', getWellnessTips)

// @desc    Track user mood
// @route   POST /api/chatbot/mood
// @access  Private
router.post('/mood', [
  body('mood')
    .isInt({ min: 1, max: 5 })
    .withMessage('Mood must be between 1 and 5'),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  body('sessionId')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(value)) {
        throw new Error('Session ID must be a valid UUID')
      }
      return true
    })
], trackMood)

export default router
