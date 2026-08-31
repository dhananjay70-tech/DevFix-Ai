import bcrypt from 'bcryptjs'
import { db } from '../config/drizzle.js'
import { otps, users } from '../db/schema.js'
import { eq, and, gt, desc } from 'drizzle-orm'
import { sendOtpEmail } from './emailService.js'

export const generateAndSendOtp = async (email) => {
  if (!email || !email.includes('@')) {
    const error = new Error('Please provide a valid email address')
    error.statusCode = 400
    throw error
  }

  const normalizedEmail = email.trim().toLowerCase()

  // Resend cooldown check: 60 seconds
  const [latestOtp] = await db
    .select()
    .from(otps)
    .where(eq(otps.email, normalizedEmail))
    .orderBy(desc(otps.createdAt))
    .limit(1)

  if (latestOtp) {
    const secondsSinceLastOtp = (Date.now() - new Date(latestOtp.createdAt).getTime()) / 1000
    if (secondsSinceLastOtp < 60) {
      const waitTime = Math.ceil(60 - secondsSinceLastOtp)
      const error = new Error(`Please wait ${waitTime} seconds before requesting a new OTP`)
      error.statusCode = 429
      throw error
    }
  }

  // Generate 6-digit random code
  const rawOtp = Math.floor(100000 + Math.random() * 900000).toString()

  // Hash OTP before storing
  const salt = await bcrypt.genSalt(10)
  const otpHash = await bcrypt.hash(rawOtp, salt)

  // Expire after 5 minutes
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

  // 1. Send Email via Gmail SMTP FIRST. If sending fails, it throws an error.
  await sendOtpEmail(normalizedEmail, rawOtp)

  // 2. Save OTP record to database ONLY after the email is successfully accepted
  await db.insert(otps).values({
    email: normalizedEmail,
    otpHash,
    expiresAt,
    attempts: 0,
    verified: false
  })

  return { message: 'OTP sent successfully to your email' }
}

export const verifyOtpAndAuthenticate = async (email, otpCode) => {
  if (!email || !otpCode) {
    const error = new Error('Please provide email and 6-digit OTP code')
    error.statusCode = 400
    throw error
  }

  const normalizedEmail = email.trim().toLowerCase()

  // Find active, unverified, non-expired OTP record
  const [activeOtp] = await db
    .select()
    .from(otps)
    .where(
      and(
        eq(otps.email, normalizedEmail),
        eq(otps.verified, false),
        gt(otps.expiresAt, new Date())
      )
    )
    .orderBy(desc(otps.createdAt))
    .limit(1)

  if (!activeOtp) {
    const error = new Error('OTP has expired or is invalid. Please request a new OTP.')
    error.statusCode = 400
    throw error
  }

  // Check attempt limits (Max 5 attempts)
  if (activeOtp.attempts >= 5) {
    await db.update(otps).set({ verified: true }).where(eq(otps.id, activeOtp.id)) // Invalidate
    const error = new Error('Maximum OTP verification attempts exceeded. Please request a new OTP.')
    error.statusCode = 429
    throw error
  }

  // Increment attempts counter
  await db
    .update(otps)
    .set({ attempts: activeOtp.attempts + 1 })
    .where(eq(otps.id, activeOtp.id))

  // Compare bcrypt hash
  const isValid = await bcrypt.compare(otpCode.trim(), activeOtp.otpHash)
  if (!isValid) {
    const error = new Error('Invalid OTP code. Please check and try again.')
    error.statusCode = 400
    throw error
  }

  // Invalidate OTP after successful verification
  await db.update(otps).set({ verified: true }).where(eq(otps.id, activeOtp.id))

  // Find or create User
  let [user] = await db.select().from(users).where(eq(users.email, normalizedEmail))

  if (!user) {
    const defaultName = normalizedEmail.split('@')[0]
    const [newUser] = await db.insert(users).values({
      email: normalizedEmail,
      name: defaultName,
      authProvider: 'otp',
      isEmailVerified: true
    }).returning()
    user = newUser
  } else if (!user.isEmailVerified) {
    const [updated] = await db.update(users)
      .set({ isEmailVerified: true })
      .where(eq(users.id, user.id))
      .returning()
    user = updated
  }

  return user
}
