import { db } from '../config/drizzle.js'
import { repositories, users } from '../db/schema.js'
import { and, eq, desc } from 'drizzle-orm'
import * as githubService from './githubService.js'

export const createRepository = async (data, userId) => {
  const { name, fullName, owner, url, language, description, openIssues } = data

  if (!name || !fullName || !owner || !url) {
    const error = new Error('Please provide required repository fields (name, fullName, owner, url)')
    error.statusCode = 400
    throw error
  }

  const [repo] = await db.insert(repositories).values({
    name,
    fullName,
    owner,
    url,
    language,
    description,
    openIssues: openIssues ? parseInt(openIssues, 10) : 0,
    userId
  }).returning()

  return repo
}

export const getRepositories = async (userId) => {
  return await db.select().from(repositories)
    .where(eq(repositories.userId, userId))
    .orderBy(desc(repositories.updatedAt))
}

export const getRepositoryById = async (id, userId) => {
  const [repo] = await db.select().from(repositories)
    .where(and(eq(repositories.id, id), eq(repositories.userId, userId)))

  if (!repo) {
    const error = new Error('Repository not found')
    error.statusCode = 404
    throw error
  }

  return repo
}

export const updateRepository = async (id, data, userId) => {
  const [existing] = await db.select().from(repositories)
    .where(and(eq(repositories.id, id), eq(repositories.userId, userId)))
  if (!existing) {
    const error = new Error('Repository not found')
    error.statusCode = 404
    throw error
  }

  const [updated] = await db.update(repositories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(repositories.id, id))
    .returning()

  return updated
}

export const deleteRepository = async (id, userId) => {
  const [existing] = await db.select().from(repositories)
    .where(and(eq(repositories.id, id), eq(repositories.userId, userId)))
  if (!existing) {
    const error = new Error('Repository not found')
    error.statusCode = 404
    throw error
  }

  await db.delete(repositories).where(eq(repositories.id, id))
  return { message: 'Repository deleted successfully' }
}

export const scanRepository = async (userId, owner, repo) => {
  const token = await githubService.getUserGithubToken(userId)
  if (!token) {
    const error = new Error('GitHub account not connected. Please connect your GitHub account.')
    error.statusCode = 400
    throw error
  }

  const aiBackendUrl = process.env.AI_BACKEND_URL
  if (!aiBackendUrl) {
    const error = new Error('AI backend service is not configured (AI_BACKEND_URL).')
    error.statusCode = 503
    throw error
  }

  const liveRepo = await githubService.getRepositoryMetadata(userId, owner, repo)
  const fullName = liveRepo.fullName || `${owner}/${repo}`
  const cloneUrl = liveRepo.cloneUrl || `https://github.com/${fullName}.git`

  const res = await fetch(`${aiBackendUrl}/api/ai/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repository: {
        full_name: fullName,
        clone_url: cloneUrl,
        default_branch: liveRepo.defaultBranch || 'main'
      },
      github_token: token
    })
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.detail || errBody.message || `Scanner failed with status ${res.status}`)
  }

  const scanData = await res.json()
  return scanData
}
