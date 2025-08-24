import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// NEW: does not error if missing/invalid; just continues
export function attachUserOptional(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET) } catch {}
  }
  next()
}


export function requireRole(role) {
  return async (req, res, next) => {
    const user = await User.findById(req.user.id)
    if (!user || user.role !== role) return res.status(403).json({ message: `This action requires ${role} role` })
    next()
  }
}