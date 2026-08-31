import { db } from '../config/drizzle.js'
import { pullRequests, issues, repositories } from '../db/schema.js'
import { and, eq, desc } from 'drizzle-orm'

export const createPullRequest = async (data, userId) => {
  const { issueId, title, url, status, filesChanged, linesAdded, linesRemoved } = data

  if (!issueId || !title || !url) {
    const error = new Error('issueId, title, and url are required')
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

  const [pr] = await db.insert(pullRequests).values({
    issueId,
    title,
    url,
    status: status || 'OPEN',
    filesChanged: filesChanged ? parseInt(filesChanged, 10) : 0,
    linesAdded: linesAdded ? parseInt(linesAdded, 10) : 0,
    linesRemoved: linesRemoved ? parseInt(linesRemoved, 10) : 0
  }).returning()

  return pr
}

export const getPullRequests = async (userId) => {
  const rows = await db.select({
    id: pullRequests.id,
    issueId: pullRequests.issueId,
    title: pullRequests.title,
    url: pullRequests.url,
    status: pullRequests.status,
    headBranch: pullRequests.headBranch,
    body: pullRequests.body,
    filesChanged: pullRequests.filesChanged,
    linesAdded: pullRequests.linesAdded,
    linesRemoved: pullRequests.linesRemoved,
    createdAt: pullRequests.createdAt,
    issueNumber: issues.issueNumber,
    issueTitle: issues.title,
    repositoryFullName: repositories.fullName,
    repositoryOwner: repositories.owner,
    repositoryName: repositories.name
  })
    .from(pullRequests)
    .innerJoin(issues, eq(pullRequests.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(eq(repositories.userId, userId))
    .orderBy(desc(pullRequests.createdAt))
  return rows
}

export const getPullRequestById = async (id, userId) => {
  const [row] = await db.select({
    id: pullRequests.id,
    issueId: pullRequests.issueId,
    title: pullRequests.title,
    url: pullRequests.url,
    status: pullRequests.status,
    headBranch: pullRequests.headBranch,
    body: pullRequests.body,
    filesChanged: pullRequests.filesChanged,
    linesAdded: pullRequests.linesAdded,
    linesRemoved: pullRequests.linesRemoved,
    createdAt: pullRequests.createdAt,
    issueNumber: issues.issueNumber,
    issueTitle: issues.title,
    repositoryFullName: repositories.fullName,
    repositoryOwner: repositories.owner,
    repositoryName: repositories.name
  })
    .from(pullRequests)
    .innerJoin(issues, eq(pullRequests.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(eq(pullRequests.id, id), eq(repositories.userId, userId)))

  if (!row) {
    const error = new Error('Pull Request not found')
    error.statusCode = 404
    throw error
  }

  return row
}

export const updatePullRequest = async (id, data, userId) => {
  const [row] = await db.select({ pr: pullRequests })
    .from(pullRequests)
    .innerJoin(issues, eq(pullRequests.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(eq(pullRequests.id, id), eq(repositories.userId, userId)))
  if (!row) {
    const error = new Error('Pull Request not found')
    error.statusCode = 404
    throw error
  }

  const [updated] = await db.update(pullRequests)
    .set(data)
    .where(eq(pullRequests.id, id))
    .returning()

  return updated
}
