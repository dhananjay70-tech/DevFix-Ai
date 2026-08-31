import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../config/drizzle.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { getJwtSecret } from '../utils/jwt.js'

const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: '7d'
  })
}

export const registerUser = async ({ email, password, name }) => {
  if (!email || !password || !name) {
    const error = new Error('Please provide email, password, and name')
    error.statusCode = 400
    throw error
  }

  const [existingUser] = await db.select().from(users).where(eq(users.email, email))
  if (existingUser) {
    const error = new Error('User already exists')
    error.statusCode = 400
    throw error
  }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  const [newUser] = await db.insert(users).values({
    email,
    name,
    password: hashedPassword
  }).returning({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    createdAt: users.createdAt
  })

  const token = generateToken(newUser.id)

  return { user: newUser, token }
}

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error('Please provide email and password')
    error.statusCode = 400
    throw error
  }

  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (!user) {
    const error = new Error('Invalid email or password')
    error.statusCode = 401
    throw error
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    const error = new Error('Invalid email or password')
    error.statusCode = 401
    throw error
  }

  const token = generateToken(user.id)

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    },
    token
  }
}
