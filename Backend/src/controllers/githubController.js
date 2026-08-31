import { asyncHandler } from '../utils/asyncHandler.js'
import * as githubService from '../services/githubService.js'

export const connectGithub = asyncHandler(async (req, res) => {
  if (!githubService.isGithubConfigured()) {
    const error = new Error('GitHub OAuth is not configured on the server. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.')
    error.statusCode = 503
    throw error
  }

  const authUrl = githubService.getGithubAuthUrl(req.user.id)
  res.redirect(authUrl)
})

export const githubCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

  if (!code) {
    return res.redirect(`${frontendUrl}/dashboard?error=github_cancelled`)
  }

  try {
    await githubService.handleGithubCallback(code, state)
    res.redirect(`${frontendUrl}/dashboard?github=connected`)
  } catch (error) {
    console.error('[GITHUB OAUTH CALLBACK ERROR]:', error.message)
    res.redirect(`${frontendUrl}/dashboard?error=${encodeURIComponent(error.message)}`)
  }
})

export const getStatus = asyncHandler(async (req, res) => {
  const status = await githubService.getGithubStatus(req.user.id)
  res.status(200).json({
    success: true,
    data: status
  })
})

export const disconnect = asyncHandler(async (req, res) => {
  const result = await githubService.disconnectGithub(req.user.id)
  res.status(200).json({
    success: true,
    message: result.message
  })
})

export const getRepos = asyncHandler(async (req, res) => {
  const repos = await githubService.getUserRepositories(req.user.id)
  res.status(200).json({
    success: true,
    data: repos
  })
})

export const getRepoIssues = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params
  const issues = await githubService.getRepositoryIssues(req.user.id, owner, repo)
  res.status(200).json({
    success: true,
    data: issues
  })
})

export const getRepoPulls = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params
  const pulls = await githubService.getRepositoryPulls(req.user.id, owner, repo)
  res.status(200).json({
    success: true,
    data: pulls
  })
})
