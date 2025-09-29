import express from 'express'
import { protect, authorize } from '../middleware/auth'

const router = express.Router()

// @desc    Get all institutions
// @route   GET /api/institutions
// @access  Public
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Get institutions - Coming soon',
    data: []
  })
})

// @desc    Get institution by ID
// @route   GET /api/institutions/:id
// @access  Public
router.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Get institution by ID - Coming soon'
  })
})

// All routes below are protected
router.use(protect)

// @desc    Create new institution (Admin only)
// @route   POST /api/institutions
// @access  Private/Admin
router.post('/', authorize('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Create institution - Coming soon'
  })
})

// @desc    Update institution (Admin only)
// @route   PUT /api/institutions/:id
// @access  Private/Admin
router.put('/:id', authorize('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Update institution - Coming soon'
  })
})

// @desc    Delete institution (Admin only)
// @route   DELETE /api/institutions/:id
// @access  Private/Admin
router.delete('/:id', authorize('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Delete institution - Coming soon'
  })
})

export default router
