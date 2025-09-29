import express from 'express'
import { body } from 'express-validator'
import { protect } from '../middleware/auth'
import {
  getCommunityPosts,
  getCommunityPost,
  createCommunityPost,
  updateCommunityPost,
  deleteCommunityPost,
  togglePostLike,
  togglePostDislike,
  reportCommunityPost,
  getCommunityCategories,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
  toggleCommentDislike,
  reportComment,
  getCommentReplies
} from '../controllers/communityController'

const router = express.Router()

// Validation rules
const postValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 5000 })
    .withMessage('Content cannot exceed 5000 characters'),
  body('category')
    .optional()
    .isIn(['general', 'mental-health', 'academic-stress', 'relationships', 'career', 'wellness', 'success-stories', 'questions', 'resources'])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean')
]

const commentValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  body('parentComment')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID')
]

const reportValidation = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Report reason is required')
    .isLength({ max: 500 })
    .withMessage('Report reason cannot exceed 500 characters')
]

// Public routes (no authentication required)
router.get('/posts', getCommunityPosts)
router.get('/categories', getCommunityCategories)
router.get('/posts/:id', getCommunityPost)
router.get('/comments/:id/replies', getCommentReplies)

// Protected routes (authentication required)
router.use(protect)

// Post routes
router.post('/posts', postValidation, createCommunityPost)
router.put('/posts/:id', postValidation, updateCommunityPost)
router.delete('/posts/:id', deleteCommunityPost)
router.post('/posts/:id/like', togglePostLike)
router.post('/posts/:id/dislike', togglePostDislike)
router.post('/posts/:id/report', reportValidation, reportCommunityPost)

// Comment routes
router.post('/posts/:postId/comments', commentValidation, createComment)
router.put('/comments/:id', commentValidation, updateComment)
router.delete('/comments/:id', deleteComment)
router.post('/comments/:id/like', toggleCommentLike)
router.post('/comments/:id/dislike', toggleCommentDislike)
router.post('/comments/:id/report', reportValidation, reportComment)

export default router
