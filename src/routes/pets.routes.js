import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth, attachUserOptional } from '../middleware/auth.js'
import { uploader } from '../upload/multer.js'
import { listPets, getPet, createPet, updatePet, removePet } from '../controllers/pets.controller.js'

const router = Router()

router.get('/', attachUserOptional, asyncHandler(listPets))  // <— attach user if token is present

router.get('/:id', asyncHandler(getPet))
router.post('/', requireAuth, uploader.array('files', 10), asyncHandler(createPet))
router.put('/:id', requireAuth, uploader.array('files', 10), asyncHandler(updatePet))
router.delete('/:id', requireAuth, asyncHandler(removePet))

export default router
