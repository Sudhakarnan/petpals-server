import { Router } from 'express'
import { forgotPassword, resetPassword } from '../controllers/auth.controller.js'
import { body } from 'express-validator'
import { asyncHandler } from '../utils/asyncHandler.js'
import { register, login, me, logout } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post(
  '/register',
  [body('role').isIn(['adopter', 'shelter']), body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 })],
  asyncHandler(register)
)

router.post(
  '/login',
  [body('email').isString().notEmpty(), body('password').isString().notEmpty()],
  asyncHandler(login)
)
router.get('/me', requireAuth, asyncHandler(me))
router.post('/logout', requireAuth, asyncHandler(logout))

router.post(
  '/forgot',
  [body('email').isString().notEmpty()],
  asyncHandler(forgotPassword)
)

router.post(
  '/reset',
  [body('email').isString().notEmpty(), body('otp').isLength({ min: 6, max: 6 }), body('password').isLength({ min: 6 })],
  asyncHandler(resetPassword)
)
export default router