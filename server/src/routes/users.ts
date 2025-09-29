import express from 'express'
import { protect, authorize } from '../middleware/auth'

const router = express.Router()

// All routes are protected
router.use(protect)

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', authorize('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Get all users - Coming soon'
  })
})

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Get user by ID - Coming soon'
  })
})

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
router.put('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Update user - Coming soon'
  })
})

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', authorize('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Delete user - Coming soon'
  })
})

export default router
