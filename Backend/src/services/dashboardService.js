import { db } from '../config/drizzle.js'
import { repositories, issues, agentRuns, pullRequests, users } from '../db/schema.js'
import { eq, inArray } from 'drizzle-orm'
import { getUserRepositories } from './githubService.js'

const EMPTY_STATS = { openIssues: 0, activeInvestigations: 0, fixesGenerated: 0, pullRequests: 0, fixSuccessRate: 0 }

export const getDashboardStats = async (userId) => {
  let liveOpenIssues = null
  const [user] = await db.select({
    githubAccessToken: users.githubAccessToken
  }).from(users).where(eq(users.id, userId))

  if (user?.githubAccessToken) {
    try {
      const repos = await getUserRepositories(userId)
      liveOpenIssues = repos.reduce((sum, repo) => sum + (Number(repo.openIssues) || 0), 0)
    } catch (err) {
      console.warn('[DASHBOARD STATS WARN] Falling back to stored repository stats:', err.message)
    }
  }

  const repoRows = await db.select({ id: repositories.id }).from(repositories).where(eq(repositories.userId, userId))
  const repoIds = repoRows.map(r => r.id)
  if (repoIds.length === 0) return { ...EMPTY_STATS, openIssues: liveOpenIssues ?? 0 }

  const issueRows = await db.select({ id: issues.id, status: issues.status })
    .from(issues)
    .where(inArray(issues.repositoryId, repoIds))
  const issueIds = issueRows.map(i => i.id)
  const storedOpenIssues = issueRows.filter(i => i.status === 'OPEN').length
  const openIssues = liveOpenIssues ?? storedOpenIssues

  if (issueIds.length === 0) return { ...EMPTY_STATS, openIssues }

  const runs = await db.select({ status: agentRuns.status })
    .from(agentRuns)
    .where(inArray(agentRuns.issueId, issueIds))

  const activeInvestigations = runs.filter(r => r.status === 'RUNNING').length
  const fixesGenerated = runs.filter(r => r.status === 'COMPLETED').length
  const fixSuccessRate = runs.length === 0 ? 0 : Math.round((fixesGenerated / runs.length) * 1000) / 10

  const prRows = await db.select({ id: pullRequests.id })
    .from(pullRequests)
    .where(inArray(pullRequests.issueId, issueIds))

  return {
    openIssues,
    activeInvestigations,
    fixesGenerated,
    pullRequests: prRows.length,
    fixSuccessRate
  }
}
