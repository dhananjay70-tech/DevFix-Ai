import 'dotenv/config'
import nodemailer from 'nodemailer'

const SEND_TIMEOUT_MS = 10000

/**
 * Build the branded OTP HTML email body.
 */
const buildOtpHtml = (otpCode) => `
  <div style="font-family: Arial, sans-serif; background-color: #090a0f; color: #f3f4f6; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
    <h2 style="color: #6366f1; margin-bottom: 8px;">DevFix AI Authentication</h2>
    <p style="font-size: 14px; color: #9ca3af; margin-bottom: 20px;">
      Use the following 6-digit One-Time Password (OTP) to log into your account. This code is valid for 5 minutes.
    </p>
    <div style="background-color: #121520; border: 1px solid #1f2434; padding: 18px; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #818cf8; text-align: center; margin: 20px 0;">
      ${otpCode}
    </div>
    <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
      If you did not request this OTP code, please ignore this email.
    </p>
  </div>
`

// ---------------------------------------------------------------------------
// Provider 1: Resend HTTP API (works on Render — uses HTTPS port 443)
// ---------------------------------------------------------------------------

const sendViaResend = async (toEmail, otpCode, senderName) => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null // Signal: Resend not configured, try fallback

  const fromAddress = process.env.RESEND_FROM || `${senderName} <onboarding@resend.dev>`

  const body = JSON.stringify({
    from: fromAddress,
    to: [toEmail],
    subject: `${otpCode} is your DevFix AI Verification Code`,
    html: buildOtpHtml(otpCode)
  })

  console.log(`[EMAIL DISPATCH] Sending OTP to ${toEmail} via Resend API...`)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS)

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body,
      signal: controller.signal
    })

    const data = await res.json()

    if (!res.ok) {
      console.error(`[RESEND API ERROR] ${res.status}: ${JSON.stringify(data)}`)
      const err = new Error(data.message || `Resend API error ${res.status}`)
      err.statusCode = res.status === 401 || res.status === 403 ? 500 : 500
      throw err
    }

    console.log(`[EMAIL SEND SUCCESS] Resend accepted email for ${toEmail}. Id: ${data.id}`)
    return data.id
  } finally {
    clearTimeout(timeout)
  }
}

// ---------------------------------------------------------------------------
// Provider 2: Gmail SMTP via Nodemailer (local development fallback)
// ---------------------------------------------------------------------------

const sendViaGmailSmtp = async (toEmail, otpCode, senderName) => {
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.SMTP_PASSWORD

  if (
    !gmailUser ||
    !gmailAppPassword ||
    gmailUser === 'your_gmail_address@gmail.com' ||
    gmailAppPassword === 'your_16_character_app_password'
  ) {
    console.error('[SMTP CONFIG ERROR] GMAIL_USER / GMAIL_APP_PASSWORD missing or placeholder')
    const configErr = new Error('Email service not configured. Set RESEND_API_KEY for production or GMAIL_USER/GMAIL_APP_PASSWORD for development.')
    configErr.statusCode = 500
    throw configErr
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4, // Force IPv4
    auth: {
      user: gmailUser,
      pass: gmailAppPassword
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000
  })

  const mailOptions = {
    from: `"${senderName}" <${gmailUser}>`,
    to: toEmail,
    subject: `${otpCode} is your DevFix AI Verification Code`,
    html: buildOtpHtml(otpCode)
  }

  console.log(`[EMAIL DISPATCH] Sending OTP to ${toEmail} via Gmail SMTP...`)

  const info = await Promise.race([
    transporter.sendMail(mailOptions),
    new Promise((_, reject) => {
      const timer = setTimeout(() => {
        const err = new Error(`SMTP dispatch timed out after ${SEND_TIMEOUT_MS / 1000}s`)
        err.code = 'ETIMEDOUT'
        reject(err)
      }, SEND_TIMEOUT_MS)
      if (timer.unref) timer.unref()
    })
  ])

  console.log(`[EMAIL SEND SUCCESS] Gmail SMTP accepted email for ${toEmail}. MessageId: ${info.messageId}`)
  return info.messageId
}

// ---------------------------------------------------------------------------
// Public API — called by otpService.js
// ---------------------------------------------------------------------------

/**
 * Sends OTP email via the best available provider:
 *   1. Resend HTTP API (if RESEND_API_KEY is set — works on Render/cloud)
 *   2. Gmail SMTP fallback (for local development)
 *
 * Includes retry with exponential backoff (2 retries, 1.5s / 3s delays).
 */
export const sendOtpEmail = async (toEmail, otpCode) => {
  const senderName = process.env.GMAIL_SENDER_NAME || process.env.SMTP_FROM_NAME || 'DevFix AI'

  const maxAttempts = 3
  const retryDelays = [1500, 3000]
  let lastError = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      const delay = retryDelays[attempt - 2] || 2000
      console.log(`[EMAIL RETRY] Waiting ${delay}ms before attempt ${attempt}/${maxAttempts}...`)
      await new Promise(r => setTimeout(r, delay))
    }

    try {
      // Try Resend first (production)
      const resendResult = await sendViaResend(toEmail, otpCode, senderName)
      if (resendResult !== null) return resendResult

      // Fall back to Gmail SMTP (development)
      return await sendViaGmailSmtp(toEmail, otpCode, senderName)
    } catch (err) {
      lastError = err

      // Auth/config errors: fail fast, don't retry
      if (err.code === 'EAUTH' || err.responseCode === 535 || err.statusCode === 401 || err.statusCode === 403) {
        console.error(`[EMAIL AUTH ERROR] ${err.message}`)
        const authErr = new Error('Email service authentication failed. Check your API key or credentials.')
        authErr.statusCode = 500
        throw authErr
      }

      // Categorize for log triage
      const isNetwork = ['ENETUNREACH', 'ETIMEDOUT', 'ECONNREFUSED', 'ESOCKETTIMEDOUT', 'EHOSTUNREACH', 'ECONNRESET'].includes(err.code) ||
        err.name === 'AbortError' ||
        err.message?.includes('timeout')

      if (isNetwork) {
        console.error(`[EMAIL NETWORK ERROR] Attempt ${attempt}/${maxAttempts}: ${err.code || 'TIMEOUT'} - ${err.message}`)
      } else {
        console.error(`[EMAIL SEND ERROR] Attempt ${attempt}/${maxAttempts}: ${err.message}`)
      }
    }
  }

  console.error(`[EMAIL DISPATCH FAILED] All ${maxAttempts} attempts exhausted for ${toEmail}. Last error: ${lastError?.message}`)
  const error = new Error('Unable to send OTP email. Please try again.')
  error.statusCode = 500
  throw error
}
