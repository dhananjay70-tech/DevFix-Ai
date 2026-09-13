import 'dotenv/config'
import nodemailer from 'nodemailer'
import dns from 'dns'

let transporter = null

const getTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const user = process.env.SMTP_USER || process.env.GMAIL_USER
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD

  if (
    !user ||
    !pass ||
    user === 'your_gmail_address@gmail.com' ||
    pass === 'your_16_character_app_password'
  ) {
    console.error('[SMTP CONFIG ERROR] SMTP credentials missing or placeholder in environment')
    const configErr = new Error('Email service configuration error: SMTP credentials are not configured on the server.')
    configErr.statusCode = 500
    throw configErr
  }

  const rawPort = process.env.SMTP_PORT
  const port = rawPort ? parseInt(rawPort, 10) : (host === 'smtp.gmail.com' ? 587 : 587)
  const secure = process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === 'true'
    : port === 465

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      dnsTimeout: 5000,
      // Force IPv4 DNS lookup to prevent ENETUNREACH on IPv6-unreachable cloud container networks (e.g. Render)
      lookup: (hostname, options, callback) => {
        return dns.lookup(hostname, { ...options, family: 4 }, callback)
      }
    })
  }

  return transporter
}

/**
 * Sends OTP email via configured SMTP (nodemailer).
 */
export const sendOtpEmail = async (toEmail, otpCode) => {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER
  const senderName = process.env.SMTP_FROM_NAME || process.env.GMAIL_SENDER_NAME || 'DevFix AI'
  const senderEmail = process.env.SMTP_FROM_EMAIL || user
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

  console.log(`[SMTP DISPATCH] Dispatching OTP email to ${toEmail}...`)

  let info

  try {
    info = await mailer.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: toEmail,
      subject: `${otpCode} is your DevFix AI Verification Code`,
      html: htmlContent
    })
  } catch (sendErr) {
    console.error(`[SMTP SEND ERROR]: ${sendErr.message}`)
    
    // Auth failures (invalid credentials)
    if (sendErr.code === 'EAUTH' || sendErr.responseCode === 535) {
      const error = new Error('Authentication failed with the email provider. Please verify SMTP credentials.')
      error.statusCode = 400
      throw error
    }

    const error = new Error('Failed to send OTP email. Please check the email address or try again later.')
    error.statusCode = 502
    throw error
  }

  console.log(`[SMTP SEND SUCCESS] Email accepted for ${toEmail}. MessageId: ${info.messageId}`)
  return info.messageId
}
