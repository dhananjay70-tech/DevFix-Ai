import { db } from '../config/drizzle.js'
import { approvals, agentRuns, issues, repositories } from '../db/schema.js'
import { and, eq, desc } from 'drizzle-orm'

export const createApproval = async (data, userId) => {
  const { agentRunId, status, reviewerId } = data

  if (!agentRunId) {
    const error = new Error('agentRunId is required')
    error.statusCode = 400
    throw error
  }

  const [row] = await db.select({ run: agentRuns })
    .from(agentRuns)
    .innerJoin(issues, eq(agentRuns.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(eq(agentRuns.id, agentRunId), eq(repositories.userId, userId)))
  if (!row) {
    const error = new Error('Associated agent run not found')
    error.statusCode = 404
    throw error
  }

  const [approval] = await db.insert(approvals).values({
    agentRunId,
    status: status || 'PENDING',
    reviewerId,
    reviewedAt: status && status !== 'PENDING' ? new Date() : null
  }).returning()

  return approval
}

export const getApprovals = async (userId) => {
  const rows = await db.select({ approval: approvals })
    .from(approvals)
    .innerJoin(agentRuns, eq(approvals.agentRunId, agentRuns.id))
    .innerJoin(issues, eq(agentRuns.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(eq(repositories.userId, userId))
    .orderBy(desc(approvals.createdAt))
  return rows.map(row => row.approval)
}

export const getApprovalById = async (id, userId) => {
  const [row] = await db.select({ approval: approvals })
    .from(approvals)
    .innerJoin(agentRuns, eq(approvals.agentRunId, agentRuns.id))
    .innerJoin(issues, eq(agentRuns.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(eq(approvals.id, id), eq(repositories.userId, userId)))

  if (!row) {
    const error = new Error('Approval record not found')
    error.statusCode = 404
    throw error
  }

  return row.approval
}

export const updateApproval = async (id, data, reviewerId, userId) => {
  const [row] = await db.select({ approval: approvals })
    .from(approvals)
    .innerJoin(agentRuns, eq(approvals.agentRunId, agentRuns.id))
    .innerJoin(issues, eq(agentRuns.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(eq(approvals.id, id), eq(repositories.userId, userId)))
  if (!row) {
    const error = new Error('Approval record not found')
    error.statusCode = 404
    throw error
  }

  const [updated] = await db.update(approvals)
    .set({
      ...data,
      reviewerId: reviewerId || data.reviewerId || row.approval.reviewerId,
      reviewedAt: new Date()
    })
    .where(eq(approvals.id, id))
    .returning()

  return updated
}
