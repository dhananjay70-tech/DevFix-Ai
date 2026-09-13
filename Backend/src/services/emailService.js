import 'dotenv/config'
import nodemailer from 'nodemailer'

const getEmailCredentials = () => {
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

  return { gmailUser, gmailAppPassword }
}

const createTransporter = (port = 465, secure = true) => {
  const { gmailUser, gmailAppPassword } = getEmailCredentials()

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port,
    secure,
    ...(port === 587 ? { requireTLS: true } : {}),
    family: 4, // Force IPv4 to prevent ENETUNREACH on cloud environments (Render)
    auth: {
      user: gmailUser,
      pass: gmailAppPassword
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000
  })
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
 * Uses direct SSL port 465 with forced IPv4, retries with exponential backoff,
 * and falls back to port 587 if needed.
 */
export const sendOtpEmail = async (toEmail, otpCode) => {
  const { gmailUser } = getEmailCredentials()
  const senderName = process.env.GMAIL_SENDER_NAME || process.env.SMTP_FROM_NAME || 'DevFix AI'

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

  // Attempt configurations: primary port 465 (SSL), retry on 465, fallback to 587 (STARTTLS)
  const attemptsConfig = [
    { port: 465, secure: true, delay: 0 },
    { port: 465, secure: true, delay: 1500 },
    { port: 587, secure: false, delay: 2500 }
  ]

  let lastError = null

  for (let i = 0; i < attemptsConfig.length; i++) {
    const attempt = i + 1
    const { port, secure, delay } = attemptsConfig[i]

    if (delay > 0) {
      console.log(`[SMTP RETRY] Waiting ${delay}ms before attempt ${attempt}...`)
      await sleep(delay)
    }

    try {
      console.log(`[SMTP DISPATCH] Attempt ${attempt}/${attemptsConfig.length}: Dispatching OTP email to ${toEmail} via Gmail SMTP (port ${port}, IPv4)...`)

      const mailer = createTransporter(port, secure)
      const info = await sendMailWithTimeout(mailer, mailOptions, SEND_TIMEOUT_MS)
      console.log(`[SMTP SEND SUCCESS] Email accepted for ${toEmail} on attempt ${attempt} (port ${port}). MessageId: ${info.messageId}`)
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
        console.error(`[SMTP NETWORK ERROR] Attempt ${attempt}/${attemptsConfig.length} (port ${port}) failed: ${err.code || 'TIMEOUT'} - ${err.message}`)
      } else {
        console.error(`[SMTP SEND ERROR] Attempt ${attempt}/${attemptsConfig.length} (port ${port}) failed: ${err.message}`)
      }
    }
  }

  console.error(`[SMTP DISPATCH FAILED] All ${attemptsConfig.length} attempts exhausted for ${toEmail}. Last error: ${lastError?.message}`)
  const error = new Error('Unable to send OTP email. Please try again.')
  error.statusCode = 500
  throw error
}
