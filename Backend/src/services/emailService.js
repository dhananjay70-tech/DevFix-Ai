import 'dotenv/config'
import nodemailer from 'nodemailer'

let transporter = null

const getTransporter = () => {
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.SMTP_PASSWORD

  if (
    !gmailUser ||
    !gmailAppPassword ||
    gmailUser === 'your_gmail_address@gmail.com' ||
    gmailAppPassword === 'your_16_character_app_password'
  ) {
    console.error('[SMTP CONFIG ERROR] GMAIL_USER / GMAIL_APP_PASSWORD missing or placeholder in environment')
    const configErr = new Error('Email service configuration error: GMAIL_USER/GMAIL_APP_PASSWORD is not configured in server environment.')
    configErr.statusCode = 500
    throw configErr
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      family: 4, // Force IPv4 to prevent ENETUNREACH on IPv6-unreachable cloud container networks (e.g. Render)
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    })
  }

  return transporter
}

const SEND_TIMEOUT_MS = 10000

const sendMailWithTimeout = (mailer, mailOptions, timeoutMs = SEND_TIMEOUT_MS) => {
  return Promise.race([
    mailer.sendMail(mailOptions),
    new Promise((_, reject) => {
      const timer = setTimeout(() => {
        const timeoutErr = new Error(`SMTP dispatch timed out after ${timeoutMs / 1000}s`)
        timeoutErr.code = 'ETIMEDOUT'
        reject(timeoutErr)
      }, timeoutMs)
      if (timer.unref) timer.unref()
    })
  ])
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Sends OTP email via Gmail SMTP (nodemailer).
 * Implements exponential backoff retry (2 retries) and IPv4 enforcement for resilient delivery.
 */
export const sendOtpEmail = async (toEmail, otpCode) => {
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER
  const senderName = process.env.GMAIL_SENDER_NAME || process.env.SMTP_FROM_NAME || 'DevFix AI'
  const mailer = getTransporter()

  const htmlContent = `
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

  const mailOptions = {
    from: `"${senderName}" <${gmailUser}>`,
    to: toEmail,
    subject: `${otpCode} is your DevFix AI Verification Code`,
    html: htmlContent
  }

  const maxRetries = 2
  const maxAttempts = maxRetries + 1
  const retryDelays = [1500, 3000]

  let lastError = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[SMTP DISPATCH] Attempt ${attempt}/${maxAttempts}: Dispatching OTP email to ${toEmail} via Gmail SMTP...`)

      const info = await sendMailWithTimeout(mailer, mailOptions, SEND_TIMEOUT_MS)
      console.log(`[SMTP SEND SUCCESS] Email accepted for ${toEmail} on attempt ${attempt}. MessageId: ${info.messageId}`)
      return info.messageId
    } catch (err) {
      lastError = err

      // Check for authentication / credential failures (Fail fast, do not retry invalid credentials)
      if (err.code === 'EAUTH' || err.responseCode === 535) {
        console.error(`[SMTP AUTH ERROR] Invalid Gmail credentials or app password: ${err.message}`)
        const authErr = new Error('Authentication failed with the email provider. Please verify GMAIL_USER and GMAIL_APP_PASSWORD.')
        authErr.statusCode = 500
        throw authErr
      }

      // Categorize network-level failures (ENETUNREACH, ETIMEDOUT, etc.) vs generic errors
      const isNetworkError =
        ['ENETUNREACH', 'ETIMEDOUT', 'ECONNREFUSED', 'ESOCKETTIMEDOUT', 'EHOSTUNREACH', 'ECONNRESET'].includes(err.code) ||
        err.message?.includes('timeout') ||
        err.message?.includes('Connection timeout')

      if (isNetworkError) {
        console.error(`[SMTP NETWORK ERROR] Attempt ${attempt}/${maxAttempts} failed: ${err.code || 'TIMEOUT'} - ${err.message}`)
      } else {
        console.error(`[SMTP SEND ERROR] Attempt ${attempt}/${maxAttempts} failed: ${err.message}`)
      }

      // If attempts remain, wait before next retry with exponential backoff
      if (attempt < maxAttempts) {
        const delayMs = retryDelays[attempt - 1] || 2000
        console.log(`[SMTP RETRY] Waiting ${delayMs}ms before attempt ${attempt + 1}...`)
        await sleep(delayMs)
      }
    }
  }

  console.error(`[SMTP DISPATCH FAILED] All ${maxAttempts} attempts exhausted for ${toEmail}. Last error: ${lastError?.message}`)
  const error = new Error('Unable to send OTP email. Please try again.')
  error.statusCode = 500
  throw error
}
