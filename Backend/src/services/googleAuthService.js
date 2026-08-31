import dotenv from 'dotenv'
import { db } from '../config/drizzle.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'

dotenv.config()

export const getGoogleAuthUrl = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  if (!isGoogleConfigured()) {
    const error = new Error('Google OAuth is not configured on the server')
    error.statusCode = 503
    throw error
  }
  
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
  const options = {
    redirect_uri: redirectUri,
    client_id: clientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' ')
  }

  const qs = new URLSearchParams(options)
  return `${rootUrl}?${qs.toString()}`
}

export const isGoogleConfigured = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  return Boolean(
    clientId &&
    clientSecret &&
    clientId !== 'your_google_client_id_here' &&
    clientSecret !== 'your_google_client_secret_here'
  )
}

export const handleGoogleCallback = async (code) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'

  if (!isGoogleConfigured()) {
    const error = new Error('Google OAuth is not configured on the server')
    error.statusCode = 503
    throw error
  }

  // Exchange code for tokens
  const tokenUrl = 'https://oauth2.googleapis.com/token'
  const tokenParams = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  })

  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString()
  })

  const tokenData = await tokenRes.json()
  if (!tokenRes.ok) {
    throw new Error(tokenData.error_description || 'Failed to exchange Google OAuth code')
  }

  // Fetch Google User Profile
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  })

  const googleProfile = await userRes.json()
  const email = googleProfile.email.toLowerCase()

  // Find or Create User
  let [user] = await db.select().from(users).where(eq(users.email, email))

  if (!user) {
    const [newUser] = await db.insert(users).values({
      email,
      name: googleProfile.name || email.split('@')[0],
      googleId: googleProfile.id,
      avatarUrl: googleProfile.picture,
      authProvider: 'google',
      isEmailVerified: true
    }).returning()
    user = newUser
  } else if (!user.googleId) {
    const [updated] = await db.update(users).set({
      googleId: googleProfile.id,
      avatarUrl: user.avatarUrl || googleProfile.picture,
      isEmailVerified: true
    }).where(eq(users.id, user.id)).returning()
    user = updated
  }

  return user
}
