import { db } from '../config/drizzle.js'
import { activityLogs } from '../db/schema.js'
import { desc, eq } from 'drizzle-orm'

export const createActivityLog = async (data) => {
  const { action, entityType, entityId, details, userId } = data

  if (!action) {
    const error = new Error('action is required for activity log')
    error.statusCode = 400
    throw error
  }

  const [log] = await db.insert(activityLogs).values({
    action,
    entityType,
    entityId,
    details: typeof details === 'object' ? JSON.stringify(details) : details,
    userId
  }).returning()

  return log
}

export const getActivityLogs = async (userId) => {
  return await db.select().from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(100)
}
