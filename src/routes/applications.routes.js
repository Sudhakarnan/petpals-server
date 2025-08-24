import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import {
  createApplication,
  listMine,
  listForShelter,
  updateStatus,
  removeApplication,
} from '../controllers/applications.controller.js'

const router = Router()

// Anyone logged in can apply and see their own applications
router.post('/', requireAuth, asyncHandler(createApplication))
router.get('/mine', requireAuth, asyncHandler(listMine))

// "Received" applications -> applications for pets I own
router.get('/shelter', requireAuth, asyncHandler(listForShelter))

router.patch('/:id', requireAuth, asyncHandler(updateStatus))

// Either side can delete/withdraw their application
router.delete('/:id', requireAuth, asyncHandler(removeApplication))

export default router
