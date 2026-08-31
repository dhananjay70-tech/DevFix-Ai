import { db } from '../config/drizzle.js'
import { agentRuns, issues, repositories } from '../db/schema.js'
import { and, eq, desc } from 'drizzle-orm'

export const createAgentRun = async (data, userId) => {
  const { issueId, status, currentAgent, progress, confidence, rootCause } = data

  if (!issueId) {
    const error = new Error('issueId is required')
    error.statusCode = 400
    throw error
  }

  const [row] = await db.select({ issue: issues })
    .from(issues)
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(eq(issues.id, issueId), eq(repositories.userId, userId)))
  if (!row) {
    const error = new Error('Associated issue not found')
    error.statusCode = 404
    throw error
  }

  const [run] = await db.insert(agentRuns).values({
    issueId,
    status: status || 'PENDING',
    currentAgent,
    progress: progress ? parseInt(progress, 10) : 0,
    confidence,
    rootCause
  }).returning()

  return run
}

export const getAgentRuns = async (userId) => {
  const rows = await db.select({ run: agentRuns })
    .from(agentRuns)
    .innerJoin(issues, eq(agentRuns.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(eq(repositories.userId, userId))
    .orderBy(desc(agentRuns.createdAt))
  return rows.map(row => row.run)
}

export const getAgentRunById = async (id, userId) => {
  const [row] = await db.select({ run: agentRuns })
    .from(agentRuns)
    .innerJoin(issues, eq(agentRuns.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(eq(agentRuns.id, id), eq(repositories.userId, userId)))

  if (!row) {
    const error = new Error('Agent run not found')
    error.statusCode = 404
    throw error
  }

  return row.run
}

export const updateAgentRun = async (id, data, userId) => {
  const [row] = await db.select({ run: agentRuns })
    .from(agentRuns)
    .innerJoin(issues, eq(agentRuns.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(eq(agentRuns.id, id), eq(repositories.userId, userId)))
  if (!row) {
    const error = new Error('Agent run not found')
    error.statusCode = 404
    throw error
  }

  const [updated] = await db.update(agentRuns)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(agentRuns.id, id))
    .returning()

  return updated
}
