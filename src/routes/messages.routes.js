import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { listThreads, getThread, sendMessage, deleteMessageForMe, startThread  } from '../controllers/messages.controller.js'
const router = Router()
router.get('/threads', requireAuth, asyncHandler(listThreads))
router.get('/threads/:id', requireAuth, asyncHandler(getThread))
router.post('/', requireAuth, asyncHandler(sendMessage))
router.post('/start', requireAuth, asyncHandler(startThread))
router.patch('/threads/:id/messages/:messageId/delete-for-me', requireAuth, asyncHandler(deleteMessageForMe))

export default router
