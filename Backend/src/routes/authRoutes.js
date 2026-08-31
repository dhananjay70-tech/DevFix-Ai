import express from 'express'
import {
  register,
  login,
  sendOtp,
  verifyOtp,
  googleAuthRedirect,
  googleAuthCallback,
  getMe,
  logout
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/send-otp', sendOtp)
router.post('/verify-otp', verifyOtp)
router.get('/google', googleAuthRedirect)
router.get('/google/callback', googleAuthCallback)
router.get('/me', protect, getMe)
router.post('/logout', logout)

export default router
