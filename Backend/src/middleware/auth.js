import jwt from 'jsonwebtoken'
import { db } from '../config/drizzle.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'

export const protect = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devfix_jwt_secret_key_change_in_production')

      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          avatarUrl: users.avatarUrl,
          authProvider: users.authProvider,
          isEmailVerified: users.isEmailVerified
        })
        .from(users)
        .where(eq(users.id, decoded.id))

      if (!user) {
        res.status(401)
        throw new Error('User not found or token invalid')
      }

      req.user = user
      return next()
    } catch (error) {
      res.status(401)
      return next(new Error('Not authorized, token failed'))
    }
  }

  res.status(401)
  return next(new Error('Not authorized, no token provided'))
}
