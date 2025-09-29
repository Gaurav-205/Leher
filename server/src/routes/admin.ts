import express from 'express'
import { protect, authorize } from '../middleware/auth'

const router = express.Router()

// All routes are protected and admin only
router.use(protect)
router.use(authorize('admin'))

// @desc    Get dashboard analytics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Admin dashboard - Coming soon',
    data: {
      totalUsers: 0,
      activeUsers: 0,
      totalSessions: 0,
      crisisInterventions: 0
    }
  })
})

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', (req, res) => {
  res.json({
    success: true,
    message: 'Get all users - Coming soon',
    data: []
  })
})

// @desc    Get crisis alerts
// @route   GET /api/admin/crisis-alerts
// @access  Private/Admin
router.get('/crisis-alerts', (req, res) => {
  res.json({
    success: true,
    message: 'Get crisis alerts - Coming soon',
    data: []
  })
})

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private/Admin
router.get('/analytics', (req, res) => {
  res.json({
    success: true,
    message: 'Get analytics - Coming soon',
    data: {}
  })
})

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private/Admin
router.get('/logs', (req, res) => {
  res.json({
    success: true,
    message: 'Get system logs - Coming soon',
    data: []
  })
})

export default router
