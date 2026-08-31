import jwt from 'jsonwebtoken'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as authService from '../services/authService.js'
import * as otpService from '../services/otpService.js'
import * as googleAuthService from '../services/googleAuthService.js'
import { getJwtSecret } from '../utils/jwt.js'

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })
}

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body)
  setAuthCookie(res, result.token)
  res.status(201).json({
    success: true,
    data: result
  })
})

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body)
  setAuthCookie(res, result.token)
  res.status(200).json({
    success: true,
    data: result
  })
})

export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body
  const result = await otpService.generateAndSendOtp(email)
  res.status(200).json({
    success: true,
    message: result.message
  })
})

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body
  const user = await otpService.verifyOtpAndAuthenticate(email, otp)
  
  const token = jwt.sign(
    { id: user.id },
    getJwtSecret(),
    { expiresIn: '7d' }
  )

  setAuthCookie(res, token)

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified
      },
      token
    }
  })
})

export const googleAuthRedirect = asyncHandler(async (req, res) => {
  const googleUrl = googleAuthService.getGoogleAuthUrl()
  res.redirect(googleUrl)
})

export const googleAuthCallback = asyncHandler(async (req, res) => {
  const { code } = req.query
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=no_code`)
  }

  try {
    const user = await googleAuthService.handleGoogleCallback(code)
    const token = jwt.sign(
      { id: user.id },
      getJwtSecret(),
      { expiresIn: '7d' }
    )

    setAuthCookie(res, token)
    res.redirect(`${frontendUrl}/dashboard`)
  } catch (error) {
    console.error('[GOOGLE OAUTH ERROR]:', error.message)
    res.redirect(`${frontendUrl}/login?error=oauth_failed`)
  }
})

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  })
})

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token')
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  })
})
