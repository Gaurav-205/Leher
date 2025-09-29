import express from 'express'
import { protect, authorize } from '../middleware/auth'

const router = express.Router()

// All routes are protected
router.use(protect)

// @desc    Get all resources
// @route   GET /api/resources
// @access  Private
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Get resources - Coming soon',
    data: []
  })
})

// @desc    Get resource by ID
// @route   GET /api/resources/:id
// @access  Private
router.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Get resource by ID - Coming soon'
  })
})

// @desc    Create new resource (Admin/Moderator only)
// @route   POST /api/resources
// @access  Private/Admin/Moderator
router.post('/', authorize('admin', 'moderator'), (req, res) => {
  res.json({
    success: true,
    message: 'Create resource - Coming soon'
  })
})

// @desc    Update resource (Admin/Moderator only)
// @route   PUT /api/resources/:id
// @access  Private/Admin/Moderator
router.put('/:id', authorize('admin', 'moderator'), (req, res) => {
  res.json({
    success: true,
    message: 'Update resource - Coming soon'
  })
})

// @desc    Delete resource (Admin only)
// @route   DELETE /api/resources/:id
// @access  Private/Admin
router.delete('/:id', authorize('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Delete resource - Coming soon'
  })
})

// @desc    Get resource categories
// @route   GET /api/resources/categories
// @access  Private
router.get('/categories', (req, res) => {
  res.json({
    success: true,
    message: 'Get resource categories - Coming soon',
    data: []
  })
})

export default router
