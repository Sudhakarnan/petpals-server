import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getShelter } from '../controllers/shelters.controller.js'

const router = Router()

router.get('/:id', asyncHandler(getShelter))

export default router