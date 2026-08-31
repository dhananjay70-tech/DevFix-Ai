import { db } from '../config/drizzle.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const getUserProfile = async (userId) => {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    })
    .from(users)
    .where(eq(users.id, userId))

  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  return user
}

export const updateUserProfile = async (userId, { name, email, password }) => {
  const dataToUpdate = { updatedAt: new Date() }

  if (name) dataToUpdate.name = name
  if (email) dataToUpdate.email = email
  if (password) {
    const salt = await bcrypt.genSalt(10)
    dataToUpdate.password = await bcrypt.hash(password, salt)
  }

  const [updatedUser] = await db
    .update(users)
    .set(dataToUpdate)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      updatedAt: users.updatedAt
    })

  return updatedUser
}
