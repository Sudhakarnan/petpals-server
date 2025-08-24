import jwt from 'jsonwebtoken'
import { validationResult } from 'express-validator'
import { User } from '../models/User.js'
import { sendEmail } from '../services/email.service.js'

function sign(user) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is missing')
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const maskEmail = (email) => {
  const [name, domain] = String(email).split('@')
  if (!domain) return email
  if (name.length <= 2) return `${name[0]}*${'@' + domain}`
  const first2 = name.slice(0,2)
  const last1 = name.slice(-1)
  return `${first2}${'*'.repeat(Math.max(3, name.length - 3))}${last1}@${domain}`
}
const genOtp = () => String(Math.floor(100000 + Math.random() * 900000))

/** REGISTER */
export const register = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const role = String(req.body?.role || '').trim()
    const name = String(req.body?.name || '').trim()
    const emailInput = String(req.body?.email || '').trim()
    const password = String(req.body?.password || '')

    if (!role || !name || !emailInput || !password) {
      return res.status(400).json({ message: 'Missing fields' })
    }

    const email = emailInput.toLowerCase()
    const exists = await User.findOne({
      email: { $regex: `^${escapeRegExp(emailInput)}$`, $options: 'i' }
    })
    if (exists) return res.status(400).json({ message: 'Email already in use' })

    const user = await User.create({ role, name, email, password })
    const token = sign(user)

    res.json({ token, user: { id: user._id, role: user.role, name: user.name, email: user.email } })
  } catch (err) {
    console.error('REGISTER error:', err)
    res.status(500).json({ message: 'Registration failed' })
  }
}

/** LOGIN (case-insensitive email, no password trim) */
export const login = async (req, res) => {
  try {
    const emailInput = String(req.body?.email || '').trim()
    const password = String(req.body?.password || '')

    if (!emailInput || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    let user = await User.findOne({ email: emailInput.toLowerCase() }).select('+password')
    if (!user) {
      user = await User.findOne({ email: { $regex: `^${escapeRegExp(emailInput)}$`, $options: 'i' } }).select('+password')
    }
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const ok = await user.comparePassword(password)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

    const token = sign(user)
    res.json({ token, user: { id: user._id, role: user.role, name: user.name, email: user.email } })
  } catch (err) {
    console.error('LOGIN error:', err)
    res.status(500).json({ message: 'Login failed' })
  }
}

/** ME */
export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(401).json({ message: 'Unauthorized' })
    res.json({ user: { id: user._id, role: user.role, name: user.name, email: user.email } })
  } catch (err) {
    console.error('ME error:', err)
    res.status(500).json({ message: 'Failed to load profile' })
  }
}

/** LOGOUT (stateless) */
export const logout = async (req, res) => {
  res.json({ ok: true })
}

/** FORGOT PASSWORD (send OTP) */
export const forgotPassword = async (req, res) => {
  try {
    const emailInput = String(req.body?.email || '').trim()
    if (!emailInput) return res.status(400).json({ message: 'Email is required' })

    let user = await User.findOne({ email: emailInput.toLowerCase() })
    if (!user) {
      user = await User.findOne({ email: { $regex: `^${escapeRegExp(emailInput)}$`, $options: 'i' } })
    }
    if (!user) return res.json({ sent: true, maskedEmail: maskEmail(emailInput) }) // don’t leak

    const otp = genOtp()
    // If your User schema includes resetOtp/resetOtpExpires fields:
    user.resetOtp = otp
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()

    try {
      await sendEmail({ to: user.email, subject: 'Your password reset code', html: `<p>Your OTP is <b>${otp}</b> (valid 10 min).</p>` })
    } catch (e) {
      console.warn('OTP email error:', e?.message)
    }

    res.json({ sent: true, maskedEmail: maskEmail(user.email) })
  } catch (err) {
    console.error('FORGOT error:', err)
    res.status(500).json({ message: 'Failed to start reset' })
  }
}

/** RESET PASSWORD (verify OTP) */
export const resetPassword = async (req, res) => {
  try {
    const emailInput = String(req.body?.email || '').trim()
    const otp = String(req.body?.otp || '').trim()
    const newPassword = String(req.body?.password || '')

    if (!emailInput || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and new password are required' })
    }

    // Look up user by lowercased email, fall back to case-insensitive regex for legacy rows
    let user = await User.findOne({ email: emailInput.toLowerCase() })
      .select('+resetOtp +resetOtpExpires +password +email')
    if (!user) {
      user = await User.findOne({
        email: { $regex: `^${emailInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      }).select('+resetOtp +resetOtpExpires +password +email')
    }

    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({ message: 'Invalid or expired code' })
    }

    // ⛔ Email must match the account being reset (case-insensitive equality)
    const storedLower = String(user.email || '').toLowerCase()
    const inputLower = emailInput.toLowerCase()
    if (storedLower !== inputLower) {
      return res.status(400).json({ message: 'Email does not match this account' })
    }

    // OTP & expiry checks
    if (user.resetOtp !== otp || user.resetOtpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired code' })
    }

    user.password = newPassword          // pre-save hook hashes
    user.resetOtp = undefined
    user.resetOtpExpires = undefined
    await user.save()

    try {
      await sendEmail({ to: user.email, subject: 'Password changed', html: `<p>Your password was changed.</p>` })
    } catch {}

    res.json({ ok: true })
  } catch (err) {
    console.error('RESET error:', err)
    res.status(500).json({ message: 'Failed to reset password' })
  }
}

