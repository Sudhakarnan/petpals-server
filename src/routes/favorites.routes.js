import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { listFavorites, toggleFavorite } from '../controllers/favorites.controller.js'

const router = Router()

router.get('/', requireAuth, asyncHandler(listFavorites))
router.post('/toggle', requireAuth, asyncHandler(toggleFavorite))

export default router