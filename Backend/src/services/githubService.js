import dotenv from 'dotenv'
import { db } from '../config/drizzle.js'
import { users, repositories, issues } from '../db/schema.js'
import { and, eq } from 'drizzle-orm'
import crypto from 'crypto'

dotenv.config()

const GITHUB_API = 'https://api.github.com'
const GITHUB_CLIENT_ID_PLACEHOLDER = 'your_github_client_id_here'
const GITHUB_CLIENT_SECRET_PLACEHOLDER = 'your_github_client_secret_here'
const STATE_TTL_MS = 10 * 60 * 1000

const isPresentSecret = (value, placeholder) => Boolean(value && value.trim() && value !== placeholder)

const getStateSecret = () => {
  const secret = process.env.GITHUB_OAUTH_STATE_SECRET || process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET or GITHUB_OAUTH_STATE_SECRET is required for GitHub OAuth state signing')
  }
  return secret
}

const signStatePayload = (payload) => {
  return crypto
    .createHmac('sha256', getStateSecret())
    .update(payload)
    .digest('base64url')
}

const createSignedState = (userId) => {
  const payload = Buffer.from(JSON.stringify({
    userId,
    ts: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex')
  })).toString('base64url')

  return `${payload}.${signStatePayload(payload)}`
}

const readSignedState = (state) => {
  if (!state || typeof state !== 'string' || !state.includes('.')) {
    const error = new Error('Invalid GitHub OAuth state')
    error.statusCode = 400
    throw error
  }

  const [payload, signature] = state.split('.', 2)
  const expected = signStatePayload(payload)
  const providedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    const error = new Error('Invalid GitHub OAuth state signature')
    error.statusCode = 400
    throw error
  }

  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
  if (!decoded.userId || !decoded.ts || Date.now() - decoded.ts > STATE_TTL_MS) {
    const error = new Error('Expired GitHub OAuth state')
    error.statusCode = 400
    throw error
  }

  return decoded
}

const githubHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'User-Agent': 'DevFix-AI-Backend',
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
})

const parseNextLink = (linkHeader) => {
  if (!linkHeader) return null
  const next = linkHeader.split(',').find(part => part.includes('rel="next"'))
  const match = next?.match(/<([^>]+)>/)
  return match ? match[1] : null
}

const fetchGithubJson = async (url, token, fallbackMessage) => {
  const res = await fetch(url, { headers: githubHeaders(token) })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(data.message || fallbackMessage)
    error.statusCode = res.status
    throw error
  }

  return { data, headers: res.headers }
}

const mapRepository = (repo) => ({
  id: repo.id,
  name: repo.name,
  fullName: repo.full_name,
  owner: repo.owner.login,
  ownerAvatar: repo.owner.avatar_url,
  language: repo.language || 'Plain Text',
  stars: repo.stargazers_count,
  openIssues: repo.open_issues_count,
  isPrivate: repo.private,
  updatedAt: repo.updated_at,
  url: repo.html_url,
  cloneUrl: repo.clone_url,
  defaultBranch: repo.default_branch,
  description: repo.description
})

const upsertRepository = async (userId, repo) => {
  const mapped = mapRepository(repo)
  const values = {
    name: mapped.name,
    fullName: mapped.fullName,
    owner: mapped.owner,
    url: mapped.url,
    cloneUrl: mapped.cloneUrl,
    language: mapped.language,
    description: mapped.description,
    openIssues: mapped.openIssues || 0,
    userId,
    updatedAt: new Date()
  }

  const [existing] = await db.select().from(repositories)
    .where(and(eq(repositories.fullName, mapped.fullName), eq(repositories.userId, userId)))

  if (existing) {
    await db.update(repositories).set(values).where(eq(repositories.id, existing.id))
  } else {
    await db.insert(repositories).values(values)
  }

  return mapped
}

const upsertIssue = async (repositoryId, issue) => {
  const labels = Array.isArray(issue.labels) ? issue.labels.map(label => label.name || label) : []
  const values = {
    title: issue.title,
    description: issue.body || '',
    status: issue.state?.toUpperCase() || 'OPEN',
    labels,
    updatedAt: new Date()
  }

  const [existing] = await db.select().from(issues)
    .where(and(eq(issues.repositoryId, repositoryId), eq(issues.issueNumber, issue.number)))

  if (existing) {
    await db.update(issues).set(values).where(eq(issues.id, existing.id))
    return existing
  }

  const [created] = await db.insert(issues).values({
    repositoryId,
    issueNumber: issue.number,
    priority: 'MEDIUM',
    ...values
  }).returning()

  return created
}

export const getUserGithubToken = async (userId) => {
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  if (!user || !user.githubAccessToken) {
    const error = new Error('GitHub account not connected')
    error.statusCode = 400
    throw error
  }
  return user.githubAccessToken
}

export const getGithubAuthUrl = (userId) => {
  const clientId = process.env.GITHUB_CLIENT_ID
  const redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/github/callback'
  
  const state = createSignedState(userId)

  const rootUrl = 'https://github.com/login/oauth/authorize'
  const options = {
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo user read:org',
    state
  }

  const qs = new URLSearchParams(options)
  return `${rootUrl}?${qs.toString()}`
}

export const isGithubConfigured = () => {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  return isPresentSecret(clientId, GITHUB_CLIENT_ID_PLACEHOLDER) &&
    isPresentSecret(clientSecret, GITHUB_CLIENT_SECRET_PLACEHOLDER)
}

export const handleGithubCallback = async (code, state, directUserId) => {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  const redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/github/callback'

  if (!isGithubConfigured()) {
    const error = new Error('GitHub OAuth is not configured on the server (missing GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET)')
    error.statusCode = 503
    throw error
  }

  let userId = directUserId
  if (!userId && state) {
    const decodedState = readSignedState(state)
    userId = decodedState.userId
  }

  // Exchange code for Access Token
  const tokenUrl = 'https://github.com/login/oauth/access_token'
  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    })
  })

  const tokenData = await tokenRes.json()
  if (!tokenRes.ok || tokenData.error) {
    throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange GitHub OAuth code')
  }

  const accessToken = tokenData.access_token

  // Fetch GitHub User Profile
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'DevFix-AI-Backend'
    }
  })

  if (!userRes.ok) {
    throw new Error('Failed to fetch GitHub user profile')
  }

  const ghProfile = await userRes.json()

  if (!userId) {
    const error = new Error('User session ID missing from OAuth state')
    error.statusCode = 400
    throw error
  }

  const [updatedUser] = await db.update(users).set({
    githubId: String(ghProfile.id),
    githubUsername: ghProfile.login,
    githubAvatar: ghProfile.avatar_url,
    githubAccessToken: accessToken,
    githubConnectedAt: new Date()
  }).where(eq(users.id, userId)).returning()

  return updatedUser
}

export const getGithubStatus = async (userId) => {
  const [user] = await db.select({
    githubId: users.githubId,
    githubUsername: users.githubUsername,
    githubAvatar: users.githubAvatar,
    githubConnectedAt: users.githubConnectedAt
  }).from(users).where(eq(users.id, userId))

  if (!user || !user.githubUsername) {
    return { connected: false }
  }

  return {
    connected: true,
    githubId: user.githubId,
    username: user.githubUsername,
    avatar: user.githubAvatar,
    connectedAt: user.githubConnectedAt
  }
}

export const disconnectGithub = async (userId) => {
  await db.update(users).set({
    githubId: null,
    githubUsername: null,
    githubAvatar: null,
    githubAccessToken: null,
    githubConnectedAt: null
  }).where(eq(users.id, userId))

  return { message: 'GitHub account disconnected successfully' }
}

export const getUserRepositories = async (userId) => {
  const token = await getUserGithubToken(userId)
  let url = `${GITHUB_API}/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member`
  const repos = []

  while (url && repos.length < 1000) {
    const { data, headers } = await fetchGithubJson(url, token, 'Failed to fetch repositories from GitHub')
    repos.push(...data)
    url = parseNextLink(headers.get('link'))
  }

  return Promise.all(repos.map(repo => upsertRepository(userId, repo)))
}

export const getRepositoryMetadata = async (userId, owner, repo) => {
  const token = await getUserGithubToken(userId)
  const { data } = await fetchGithubJson(`${GITHUB_API}/repos/${owner}/${repo}`, token, 'Failed to fetch repository from GitHub')
  return upsertRepository(userId, data)
}

export const getRepositoryIssue = async (userId, owner, repo, issueNumber) => {
  const token = await getUserGithubToken(userId)
  const { data } = await fetchGithubJson(
    `${GITHUB_API}/repos/${owner}/${repo}/issues/${issueNumber}`,
    token,
    'Failed to fetch issue from GitHub'
  )

  if (data.pull_request) {
    const error = new Error('Selected GitHub item is a pull request, not an issue')
    error.statusCode = 400
    throw error
  }

  return {
    id: data.id,
    number: data.number,
    title: data.title,
    body: data.body || '',
    status: data.state,
    labels: data.labels.map(l => l.name),
    author: data.user.login,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    url: data.html_url
  }
}

export const getRepositoryIssues = async (userId, owner, repo) => {
  const token = await getUserGithubToken(userId)
  const repoMeta = await getRepositoryMetadata(userId, owner, repo)
  const [repoRow] = await db.select().from(repositories)
    .where(and(eq(repositories.fullName, repoMeta.fullName), eq(repositories.userId, userId)))

  let url = `${GITHUB_API}/repos/${owner}/${repo}/issues?state=open&per_page=100`
  const rawIssues = []
  while (url && rawIssues.length < 1000) {
    const { data, headers } = await fetchGithubJson(url, token, 'Failed to fetch issues from GitHub')
    rawIssues.push(...data)
    url = parseNextLink(headers.get('link'))
  }

  const cleanIssues = rawIssues.filter(item => !item.pull_request)
  if (repoRow) {
    await Promise.all(cleanIssues.map(issue => upsertIssue(repoRow.id, issue)))
  }

  return cleanIssues.map(issue => ({
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body,
    status: issue.state,
    labels: issue.labels.map(l => l.name),
    author: issue.user.login,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    url: issue.html_url
  }))
}

export const getRepositoryPulls = async (userId, owner, repo) => {
  const token = await getUserGithubToken(userId)
  const { data: pulls } = await fetchGithubJson(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls?state=all&per_page=30`,
    token,
    'Failed to fetch pull requests from GitHub'
  )

  return pulls.map(pr => ({
    id: pr.id,
    number: pr.number,
    title: pr.title,
    author: pr.user.login,
    status: pr.state,
    createdAt: pr.created_at,
    url: pr.html_url
  }))
}
