import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { listReviews, createReview } from '../controllers/reviews.controller.js'

const router = Router()

router.get('/', asyncHandler(listReviews))
router.post('/', requireAuth, asyncHandler(createReview))

export default router