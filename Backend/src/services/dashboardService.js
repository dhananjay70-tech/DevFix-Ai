import { db } from '../config/drizzle.js'
import { repositories, issues, agentRuns, pullRequests, users } from '../db/schema.js'
import { eq, inArray } from 'drizzle-orm'
import { getUserRepositories } from './githubService.js'

const EMPTY_STATS = { openIssues: 0, activeInvestigations: 0, fixesGenerated: 0, pullRequests: 0, fixSuccessRate: 0 }

export const getDashboardStats = async (userId) => {
  let repoRows = await db.select({
    id: repositories.id,
    openIssues: repositories.openIssues
  }).from(repositories).where(eq(repositories.userId, userId))

  // If no repositories stored yet and user has connected GitHub, do an initial sync
  if (repoRows.length === 0) {
    const [user] = await db.select({
      githubAccessToken: users.githubAccessToken
    }).from(users).where(eq(users.id, userId))

    if (user?.githubAccessToken) {
      try {
        const repos = await getUserRepositories(userId)
        repoRows = repos
      } catch (err) {
        console.warn('[DASHBOARD STATS WARN] Initial GitHub repository sync fallback:', err.message)
      }
    }
  }

  const openIssues = repoRows.reduce((sum, r) => sum + (Number(r.openIssues) || 0), 0)
  const repoIds = repoRows.map(r => r.id).filter(Boolean)
  if (repoIds.length === 0) return { ...EMPTY_STATS, openIssues }

  const issueRows = await db.select({ id: issues.id, status: issues.status })
    .from(issues)
    .where(inArray(issues.repositoryId, repoIds))
  const issueIds = issueRows.map(i => i.id)

  if (issueIds.length === 0) return { ...EMPTY_STATS, openIssues }

  const runs = await db.select({
    id: agentRuns.id,
    status: agentRuns.status,
    testResults: agentRuns.testResults,
    securityResults: agentRuns.securityResults,
    diff: agentRuns.diff,
    completedAt: agentRuns.completedAt,
    startedAt: agentRuns.startedAt
  })
    .from(agentRuns)
    .where(inArray(agentRuns.issueId, issueIds))

  const activeInvestigations = runs.filter(r => r.status === 'RUNNING' || r.status === 'PENDING').length
  const fixesGenerated = runs.filter(r => Boolean(r.diff) || r.status === 'COMPLETED' || r.status === 'NEEDS_APPROVAL').length
  const completedRuns = runs.filter(r => r.status === 'COMPLETED')
  const fixSuccessRate = runs.length === 0 ? 0 : Math.round((completedRuns.length / runs.length) * 1000) / 10

  let testsPassed = 0
  let testsFailed = 0
  let totalCoverageSum = 0
  let coverageCount = 0
  let lastTestRun = null
  const failingTestNames = []

  let securityIssuesFound = 0
  let criticalVulnerabilities = 0
  let highVulnerabilities = 0
  let mediumVulnerabilities = 0
  let securityScansCompleted = 0
  let lastSecurityScan = null

  for (const r of runs) {
    if (r.testResults && typeof r.testResults === 'object') {
      const tr = r.testResults
      if (typeof tr.passed_count === 'number') testsPassed += tr.passed_count
      else if (tr.passed === true) testsPassed += (tr.total || 1)

      if (typeof tr.failed_count === 'number') testsFailed += tr.failed_count
      else if (tr.passed === false) testsFailed += (tr.failed_count || 1)

      if (Array.isArray(tr.failures)) {
        for (const f of tr.failures) {
          const name = typeof f === 'string' ? f : (f?.name || f?.test || '')
          if (name && !failingTestNames.includes(name)) failingTestNames.push(name)
        }
      }

      if (typeof tr.coverage === 'number') {
        totalCoverageSum += tr.coverage
        coverageCount++
      }

      if (r.completedAt && (!lastTestRun || new Date(r.completedAt) > new Date(lastTestRun))) {
        lastTestRun = r.completedAt
      }
    }

    if (r.securityResults && typeof r.securityResults === 'object') {
      const sr = r.securityResults
      securityScansCompleted++
      if (Array.isArray(sr.vulnerabilities)) {
        for (const v of sr.vulnerabilities) {
          securityIssuesFound++
          const sev = (v.severity || v.risk || '').toUpperCase()
          if (sev === 'CRITICAL') criticalVulnerabilities++
          else if (sev === 'HIGH') highVulnerabilities++
          else if (sev === 'MEDIUM') mediumVulnerabilities++
        }
      } else if (sr.risk_level === 'HIGH') {
        highVulnerabilities++
        securityIssuesFound++
      } else if (sr.risk_level === 'CRITICAL') {
        criticalVulnerabilities++
        securityIssuesFound++
      }

      if (r.completedAt && (!lastSecurityScan || new Date(r.completedAt) > new Date(lastSecurityScan))) {
        lastSecurityScan = r.completedAt
      }
    }
  }

  const testCoverage = coverageCount > 0 ? Math.round((totalCoverageSum / coverageCount) * 10) / 10 : null
  const securityScore = securityIssuesFound === 0 ? 100 : Math.max(0, 100 - (criticalVulnerabilities * 25 + highVulnerabilities * 15 + mediumVulnerabilities * 5))

  const prRows = await db.select({ id: pullRequests.id })
    .from(pullRequests)
    .where(inArray(pullRequests.issueId, issueIds))

  return {
    openIssues,
    activeInvestigations,
    fixesGenerated,
    pullRequests: prRows.length,
    fixSuccessRate,
    testsPassed,
    testsFailed,
    securityIssuesFound,
    criticalVulnerabilities,
    highVulnerabilities,
    mediumVulnerabilities,
    securityScansCompleted,
    lastSecurityScan,
    securityScore,
    testCoverage,
    lastTestRun,
    failingTestNames
  }
}
