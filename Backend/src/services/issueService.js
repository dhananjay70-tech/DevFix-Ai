import { db } from '../config/drizzle.js'
import { issues, repositories } from '../db/schema.js'
import { and, eq, desc, sql } from 'drizzle-orm'

export const createIssue = async (data, userId) => {
  const { repositoryId, issueNumber, title, description, status, priority, labels } = data

  if (!repositoryId || !issueNumber || !title) {
    const error = new Error('Please provide repositoryId, issueNumber, and title')
    error.statusCode = 400
    throw error
  }

  const [repo] = await db.select().from(repositories)
    .where(and(eq(repositories.id, repositoryId), eq(repositories.userId, userId)))
  if (!repo) {
    const error = new Error('Associated repository not found')
    error.statusCode = 404
    throw error
  }

  const [issue] = await db.insert(issues).values({
    repositoryId,
    issueNumber: parseInt(issueNumber, 10),
    title,
    description,
    status: status || 'OPEN',
    priority: priority || 'MEDIUM',
    labels: Array.isArray(labels) ? labels : []
  }).returning()

  // Increment openIssues counter on repo
  await db.update(repositories)
    .set({ openIssues: sql`${repositories.openIssues} + 1` })
    .where(eq(repositories.id, repositoryId))

  return issue
}

export const getIssues = async (userId) => {
  return await db.select({ issue: issues })
    .from(issues)
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(eq(repositories.userId, userId))
    .orderBy(desc(issues.createdAt))
    .then(rows => rows.map(row => row.issue))
}

export const getIssueById = async (id, userId) => {
  const [row] = await db.select({ issue: issues })
    .from(issues)
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(eq(issues.id, id), eq(repositories.userId, userId)))

  if (!row) {
    const error = new Error('Issue not found')
    error.statusCode = 404
    throw error
  }

  return row.issue
}

export const updateIssue = async (id, data, userId) => {
  const [row] = await db.select({ issue: issues })
    .from(issues)
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(eq(issues.id, id), eq(repositories.userId, userId)))
  if (!row) {
    const error = new Error('Issue not found')
    error.statusCode = 404
    throw error
  }

  const [updated] = await db.update(issues)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(issues.id, id))
    .returning()

  return updated
}

export const deleteIssue = async (id, userId) => {
  const [row] = await db.select({ issue: issues })
    .from(issues)
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(eq(issues.id, id), eq(repositories.userId, userId)))
  if (!row) {
    const error = new Error('Issue not found')
    error.statusCode = 404
    throw error
  }

  await db.delete(issues).where(eq(issues.id, id))
  return { message: 'Issue deleted successfully' }
}
