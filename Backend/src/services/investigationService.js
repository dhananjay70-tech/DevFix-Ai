import { db } from '../config/drizzle.js'
import { repositories, issues, agentRuns, pullRequests, approvals, users } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { createActivityLog } from './activityService.js'
import * as githubService from './githubService.js'

const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'NEEDS_APPROVAL', 'REJECTED']

const getOrCreateRepository = async (userId, repo) => {
  const [existing] = await db.select().from(repositories)
    .where(and(eq(repositories.fullName, repo.fullName), eq(repositories.userId, userId)))

  if (existing) return existing

  const [created] = await db.insert(repositories).values({
    name: repo.name || repo.fullName.split('/').pop(),
    fullName: repo.fullName,
    owner: repo.owner || repo.fullName.split('/')[0],
    url: repo.url || `https://github.com/${repo.fullName}`,
    cloneUrl: repo.cloneUrl || `https://github.com/${repo.fullName}.git`,
    language: repo.language,
    description: repo.description,
    openIssues: repo.openIssues || 0,
    userId
  }).returning()

  return created
}

const getOrCreateIssue = async (repositoryId, issue) => {
  const [existing] = await db.select().from(issues)
    .where(and(eq(issues.repositoryId, repositoryId), eq(issues.issueNumber, issue.number)))

  if (existing) {
    const [updated] = await db.update(issues).set({
      title: issue.title,
      description: issue.description || issue.body || '',
      status: issue.status?.toUpperCase?.() || existing.status,
      labels: Array.isArray(issue.labels) ? issue.labels : existing.labels,
      updatedAt: new Date()
    }).where(eq(issues.id, existing.id)).returning()
    return updated
  }

  const [created] = await db.insert(issues).values({
    repositoryId,
    issueNumber: issue.number,
    title: issue.title,
    description: issue.description || issue.body || '',
    status: issue.status?.toUpperCase?.() || 'OPEN',
    labels: Array.isArray(issue.labels) ? issue.labels : []
  }).returning()

  return created
}

export const startInvestigation = async (userId, payload) => {
  const { repository, issue } = payload || {}

  if (!repository?.fullName || !issue?.number) {
    const error = new Error('repository.fullName and issue.number are required')
    error.statusCode = 400
    throw error
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId))
  if (!user?.githubAccessToken) {
    const error = new Error('GitHub account not connected')
    error.statusCode = 400
    throw error
  }

  const [owner, repoName] = repository.fullName.split('/')
  if (!owner || !repoName) {
    const error = new Error('repository.fullName must be in owner/repo format')
    error.statusCode = 400
    throw error
  }

  const liveRepository = await githubService.getRepositoryMetadata(userId, owner, repoName)
  let liveIssue = null
  try {
    liveIssue = await githubService.getRepositoryIssue(userId, owner, repoName, issue.number)
  } catch (err) {
    // If issue does not exist on GitHub (e.g. from automated code scan), use issue payload
    liveIssue = {
      number: typeof issue.number === 'number' ? issue.number : Math.floor(Math.random() * 9000) + 1000,
      title: issue.title || 'Automated Code Scan Detected Problem',
      body: issue.description || issue.explanation || issue.evidence || '',
      labels: Array.isArray(issue.labels) ? issue.labels : ['automated-scan']
    }
  }

  const repoRow = await getOrCreateRepository(userId, liveRepository)
  const issueRow = await getOrCreateIssue(repoRow.id, {
    ...liveIssue,
    description: liveIssue.body || liveIssue.description
  })

  const [run] = await db.insert(agentRuns).values({
    issueId: issueRow.id,
    status: 'PENDING',
    progress: 0,
    startedAt: new Date()
  }).returning()

  const aiBackendUrl = process.env.AI_BACKEND_URL

  try {
    if (!aiBackendUrl) {
      throw new Error('AI_BACKEND_URL is not configured — the AI backend cannot be reached')
    }

    const res = await fetch(`${aiBackendUrl}/api/ai/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        run_id: run.id,
        repository: {
          full_name: repoRow.fullName,
          clone_url: repoRow.cloneUrl,
          default_branch: liveRepository.defaultBranch || repository.defaultBranch || 'main'
        },
        issue: {
          number: issueRow.issueNumber,
          title: issueRow.title,
          description: issueRow.description
        },
        github_token: user.githubAccessToken
      })
    })

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      throw new Error(errBody.message || errBody.detail || `AI backend responded with HTTP ${res.status}`)
    }

    const [updated] = await db.update(agentRuns)
      .set({ status: 'RUNNING', currentAgent: 'supervisor', updatedAt: new Date() })
      .where(eq(agentRuns.id, run.id))
      .returning()

    await logActivity('INVESTIGATION_STARTED', run.id, userId, {
      repository: repoRow.fullName,
      issue: issueRow.issueNumber
    })

    return updated
  } catch (err) {
    console.error('[AI BACKEND ERROR]:', err.message)
    const [failed] = await db.update(agentRuns)
      .set({ status: 'FAILED', errorMessage: err.message, completedAt: new Date(), updatedAt: new Date() })
      .where(eq(agentRuns.id, run.id))
      .returning()

    return failed
  }
}

export const getInvestigations = async (userId, status) => {
  const conditions = [eq(repositories.userId, userId)]
  if (status) conditions.push(eq(agentRuns.status, status))

  const rows = await db.select({
    id: agentRuns.id,
    status: agentRuns.status,
    currentAgent: agentRuns.currentAgent,
    progress: agentRuns.progress,
    confidence: agentRuns.confidence,
    rootCause: agentRuns.rootCause,
    errorMessage: agentRuns.errorMessage,
    createdAt: agentRuns.createdAt,
    updatedAt: agentRuns.updatedAt,
    startedAt: agentRuns.startedAt,
    completedAt: agentRuns.completedAt,
    issueNumber: issues.issueNumber,
    issueTitle: issues.title,
    repositoryFullName: repositories.fullName
  })
    .from(agentRuns)
    .innerJoin(issues, eq(agentRuns.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(...conditions))
    .orderBy(desc(agentRuns.createdAt))

  return rows
}

export const getInvestigationById = async (userId, id) => {
  const [row] = await db.select({
    run: agentRuns,
    issue: issues,
    repository: repositories
  })
    .from(agentRuns)
    .innerJoin(issues, eq(agentRuns.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(eq(agentRuns.id, id), eq(repositories.userId, userId)))

  if (!row) {
    const error = new Error('Investigation not found')
    error.statusCode = 404
    throw error
  }

  const [pr] = await db.select().from(pullRequests)
    .where(eq(pullRequests.issueId, row.issue.id))
    .orderBy(desc(pullRequests.createdAt))
    .limit(1)

  return {
    id: row.run.id,
    status: row.run.status,
    currentAgent: row.run.currentAgent,
    progress: row.run.progress,
    confidence: row.run.confidence,
    rootCause: row.run.rootCause,
    affectedFiles: row.run.affectedFiles,
    diff: row.run.diff,
    testResults: row.run.testResults,
    securityResults: row.run.securityResults,
    errorMessage: row.run.errorMessage,
    createdAt: row.run.createdAt,
    updatedAt: row.run.updatedAt,
    startedAt: row.run.startedAt,
    completedAt: row.run.completedAt,
    issue: {
      id: row.issue.id,
      number: row.issue.issueNumber,
      title: row.issue.title,
      description: row.issue.description,
      labels: row.issue.labels,
      status: row.issue.status
    },
    repository: {
      id: row.repository.id,
      fullName: row.repository.fullName,
      owner: row.repository.owner,
      url: row.repository.url,
      language: row.repository.language
    },
    pullRequest: pr ? {
      id: pr.id,
      title: pr.title,
      url: pr.url,
      status: pr.status,
      headBranch: pr.headBranch,
      body: pr.body,
      filesChanged: pr.filesChanged,
      linesAdded: pr.linesAdded,
      linesRemoved: pr.linesRemoved
    } : null
  }
}

// Called by the AI backend (internal auth, not user JWT) as the graph executes.
export const syncAgentRun = async (id, data) => {
  const [existing] = await db.select().from(agentRuns).where(eq(agentRuns.id, id))
  if (!existing) {
    const error = new Error('Agent run not found')
    error.statusCode = 404
    throw error
  }

  const updates = { updatedAt: new Date() }
  const fields = ['status', 'currentAgent', 'progress', 'rootCause', 'affectedFiles', 'diff', 'testResults', 'securityResults', 'errorMessage']
  for (const field of fields) {
    if (data[field] !== undefined) updates[field] = data[field]
  }
  if (data.confidence !== undefined) updates.confidence = String(data.confidence)
  if (updates.status && TERMINAL_STATUSES.includes(updates.status) && !existing.completedAt) {
    updates.completedAt = new Date()
  }

  const [updated] = await db.update(agentRuns).set(updates).where(eq(agentRuns.id, id)).returning()

  if (updates.status && updates.status !== existing.status && TERMINAL_STATUSES.includes(updates.status)) {
    await logActivity(`INVESTIGATION_${updates.status}`, id, null, { previousStatus: existing.status })
  }

  if (data.pullRequest) {
    const pr = data.pullRequest
    const [existingPr] = await db.select().from(pullRequests).where(eq(pullRequests.issueId, existing.issueId))

    const prValues = {
      title: pr.title,
      url: pr.url,
      status: pr.status || 'OPEN',
      headBranch: pr.headBranch,
      body: pr.body,
      filesChanged: pr.filesChanged || 0,
      linesAdded: pr.linesAdded || 0,
      linesRemoved: pr.linesRemoved || 0
    }

    if (existingPr) {
      await db.update(pullRequests).set(prValues).where(eq(pullRequests.id, existingPr.id))
    } else {
      await db.insert(pullRequests).values({ issueId: existing.issueId, ...prValues })
    }

    await logActivity('PULL_REQUEST_CREATED', id, null, { url: pr.url, headBranch: pr.headBranch })
  }

  return updated
}

export const setApproval = async (userId, agentRunId, status) => {
  const [row] = await db.select({ repoUserId: repositories.userId })
    .from(agentRuns)
    .innerJoin(issues, eq(agentRuns.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(eq(agentRuns.id, agentRunId))

  if (!row || row.repoUserId !== userId) {
    const error = new Error('Investigation not found')
    error.statusCode = 404
    throw error
  }

  const [approval] = await db.insert(approvals).values({
    agentRunId,
    status,
    reviewerId: userId,
    reviewedAt: new Date()
  }).returning()

  // The decision is recorded locally above regardless of what happens next,
  // but the AI backend's LangGraph run is still paused on its human_approval
  // interrupt until this forward call actually reaches it — a swallowed
  // failure here would leave the run stuck forever while the UI reports
  // success, so this must propagate instead of being best-effort.
  const aiBackendUrl = process.env.AI_BACKEND_URL
  if (!aiBackendUrl) {
    const error = new Error('AI_BACKEND_URL is not configured — the approval could not be forwarded to the AI backend')
    error.statusCode = 502
    throw error
  }

  const endpoint = status === 'APPROVED' ? 'approve' : 'reject'
  try {
    const res = await fetch(`${aiBackendUrl}/api/ai/runs/${agentRunId}/${endpoint}`, { method: 'POST' })
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      throw new Error(errBody.message || errBody.detail || `AI backend responded with HTTP ${res.status}`)
    }
  } catch (err) {
    console.error('[AI BACKEND SYNC ERROR] Failed to forward approval decision:', err.message)
    const error = new Error(`Approval was recorded, but the AI backend could not be notified: ${err.message}`)
    error.statusCode = 502
    throw error
  }

  await logActivity(`INVESTIGATION_${status}`, agentRunId, userId, {})

  return approval
}

export const retryInvestigation = async (userId, agentRunId) => {
  const [row] = await db.select({
    run: agentRuns,
    issue: issues,
    repository: repositories
  })
    .from(agentRuns)
    .innerJoin(issues, eq(agentRuns.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(eq(agentRuns.id, agentRunId), eq(repositories.userId, userId)))

  if (!row) {
    const error = new Error('Investigation not found')
    error.statusCode = 404
    throw error
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId))
  if (!user?.githubAccessToken) {
    const error = new Error('GitHub account not connected')
    error.statusCode = 400
    throw error
  }

  const aiBackendUrl = process.env.AI_BACKEND_URL
  if (!aiBackendUrl) {
    const error = new Error('AI_BACKEND_URL is not configured')
    error.statusCode = 503
    throw error
  }

  // Reset agent run state
  await db.update(agentRuns).set({
    status: 'PENDING',
    progress: 5,
    currentAgent: 'supervisor',
    errorMessage: null,
    rootCause: null,
    diff: null,
    testResults: null,
    securityResults: null,
    completedAt: null,
    updatedAt: new Date()
  }).where(eq(agentRuns.id, agentRunId))

  try {
    const res = await fetch(`${aiBackendUrl}/api/ai/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        run_id: agentRunId,
        repository: {
          full_name: row.repository.fullName,
          clone_url: row.repository.cloneUrl,
          default_branch: 'main'
        },
        issue: {
          number: row.issue.issueNumber,
          title: row.issue.title,
          description: row.issue.description
        },
        github_token: user.githubAccessToken
      })
    })

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      throw new Error(errBody.message || errBody.detail || `AI backend responded with HTTP ${res.status}`)
    }

    const [updated] = await db.update(agentRuns)
      .set({ status: 'RUNNING', currentAgent: 'supervisor', updatedAt: new Date() })
      .where(eq(agentRuns.id, agentRunId))
      .returning()

    await logActivity('INVESTIGATION_RESTARTED', agentRunId, userId, {
      repository: row.repository.fullName,
      issue: row.issue.issueNumber
    })

    return updated
  } catch (err) {
    console.error('[AI BACKEND RETRY ERROR]:', err.message)
    const [failed] = await db.update(agentRuns)
      .set({ status: 'FAILED', errorMessage: err.message, completedAt: new Date(), updatedAt: new Date() })
      .where(eq(agentRuns.id, agentRunId))
      .returning()

    return failed
  }
}

// Best-effort activity logging — never let a logging failure break the investigation flow.
const logActivity = async (action, entityId, userId, details) => {
  try {
    await createActivityLog({ action, entityType: 'agent_run', entityId, userId, details })
  } catch (err) {
    console.warn('[ACTIVITY LOG WARN] Failed to record activity log:', err.message)
  }
}
