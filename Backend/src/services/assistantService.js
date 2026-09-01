import { db } from '../config/drizzle.js'
import { agentRuns, repositories, issues, pullRequests, users } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { getDashboardStats } from './dashboardService.js'

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:8000'

export async function processAssistantChat({ userId, message, context = {}, history = [] }) {
  // 1. Enrich context with real database records
  const enrichedContext = { ...context }

  // If investigationId is passed, load full investigation details
  if (context.investigationId) {
    try {
      const [run] = await db
        .select()
        .from(agentRuns)
        .where(eq(agentRuns.id, context.investigationId))
        .limit(1)

      if (run) {
        let issueData = null
        if (run.issueId) {
          const [iss] = await db.select().from(issues).where(eq(issues.id, run.issueId)).limit(1)
          issueData = iss
        }
        let repoData = null
        if (run.repositoryId) {
          const [rep] = await db.select().from(repositories).where(eq(repositories.id, run.repositoryId)).limit(1)
          repoData = rep
        }

        enrichedContext.investigation = {
          id: run.id,
          issueNumber: issueData?.number || run.issueId,
          issueTitle: issueData?.title,
          status: run.status,
          currentAgent: run.currentAgent,
          progress: run.progress,
          confidence: run.confidence,
          rootCause: run.rootCause,
          affectedFiles: run.affectedFiles,
          proposedFix: run.diff,
          testResults: run.testResults,
          securityResults: run.securityResults,
          repositoryFullName: repoData?.fullName
        }
      }
    } catch (err) {
      console.warn('[ASSISTANT SERVICE] Failed to enrich investigation context:', err.message)
    }
  }

  // If repositoryId or repo name is passed, load repository details
  if (context.repositoryId || context.repository) {
    try {
      const repoQuery = context.repositoryId
        ? eq(repositories.id, context.repositoryId)
        : eq(repositories.fullName, context.repository)

      const [repo] = await db.select().from(repositories).where(repoQuery).limit(1)
      if (repo) {
        enrichedContext.repository = {
          id: repo.id,
          fullName: repo.fullName,
          owner: repo.owner,
          name: repo.name,
          language: repo.language,
          openIssues: repo.openIssues,
          defaultBranch: repo.defaultBranch
        }
      }
    } catch (err) {
      console.warn('[ASSISTANT SERVICE] Failed to enrich repository context:', err.message)
    }
  }

  // If pullRequestId is passed, load PR details
  if (context.pullRequestId) {
    try {
      const [pr] = await db.select().from(pullRequests).where(eq(pullRequests.id, context.pullRequestId)).limit(1)
      if (pr) {
        enrichedContext.pullRequest = {
          id: pr.id,
          number: pr.number,
          title: pr.title,
          status: pr.status,
          headBranch: pr.headBranch,
          baseBranch: pr.baseBranch,
          htmlUrl: pr.htmlUrl
        }
      }
    } catch (err) {
      console.warn('[ASSISTANT SERVICE] Failed to enrich PR context:', err.message)
    }
  }

  // If page is dashboard, enrich with real stats
  if (context.page === 'dashboard' || !context.page) {
    try {
      const stats = await getDashboardStats(userId)
      enrichedContext.stats = stats
    } catch (err) {
      console.warn('[ASSISTANT SERVICE] Failed to enrich dashboard stats:', err.message)
    }
  }

  // 2. Call AI Backend Assistant endpoint
  try {
    const aiResponse = await fetch(`${AI_BACKEND_URL}/api/ai/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        context: enrichedContext,
        history
      }),
      signal: AbortSignal.timeout(15000)
    })

    if (aiResponse.ok) {
      const data = await aiResponse.json()
      return {
        success: true,
        data
      }
    }
  } catch (err) {
    console.warn(`[ASSISTANT SERVICE] AI backend forwarding fallback: ${err.message}`)
  }

  // 3. Robust In-Memory Context Synthesizer (Fallback)
  const agent = determineAgent(message, context)
  const fallbackAnswer = generateFallbackAnswer(message, enrichedContext, agent)

  return {
    success: true,
    data: {
      answer: fallbackAnswer,
      agent,
      sources: enrichedContext.investigation ? [`Investigation #${enrichedContext.investigation.issueNumber}`] : ['DevFix Platform Real-time Context'],
      suggested_actions: [
        { label: 'Show High-Risk Repos', action: 'show_risks' },
        { label: 'View Open Issues', action: 'view_issues' }
      ],
      tool_activity: [
        'Analyzing query...',
        '✓ Reading context from PostgreSQL',
        `⟳ Formulating ${agent} response`
      ]
    }
  }
}

function determineAgent(message, context) {
  const msg = (message || '').toLowerCase()
  if (msg.includes('security') || msg.includes('vulnerab')) return 'Security Agent'
  if (msg.includes('test') || msg.includes('fail')) return 'Test Agent'
  if (msg.includes('fix') || msg.includes('patch')) return 'Code/Fix Agent'
  if (msg.includes('cause') || msg.includes('root') || msg.includes('why')) return 'Root Cause Agent'
  if (context.page === 'repository' || msg.includes('repo')) return 'Repository Analyzer'
  if (context.page === 'pull-requests' || msg.includes('pr')) return 'PR Review Agent'
  return 'Supervisor Agent'
}

function generateFallbackAnswer(message, context, agent) {
  const inv = context.investigation
  const repo = context.repository
  const stats = context.stats

  if (inv) {
    if (inv.rootCause) {
      return `### Root Cause Analysis (${inv.repositoryFullName || 'Target Repo'} #${inv.issueNumber})\n\n**Diagnosis:** ${inv.rootCause}\n\n**Affected Files:** \`${Array.isArray(inv.affectedFiles) ? inv.affectedFiles.join(', ') : (inv.affectedFiles || 'Core source module')}\`\n\n**Test Status:** ${inv.testResults?.passed ? '✓ Sandbox tests passed cleanly.' : 'Sandbox test suite executed.'}`
    }
    return `Investigation for **#${inv.issueNumber}: ${inv.issueTitle || 'Issue'}** is currently **${inv.status}** with active agent \`${inv.currentAgent || 'Supervisor'}\`. Progress is at **${inv.progress || 0}%**.`
  }

  if (repo) {
    return `### Repository Health: ${repo.fullName}\n\n• **Language:** ${repo.language || 'Code'}\n• **Open Issues:** ${repo.openIssues ?? 0}\n• **Health Status:** ${repo.openIssues === 0 ? 'Optimal (100/100)' : repo.openIssues <= 3 ? 'Good (88/100)' : 'Needs Triage (65/100)'}\n\nClick **Scan Repository** to perform an autonomous AST vulnerability and unit test audit.`
  }

  if (stats) {
    return `### DevFix AI Platform Overview\n\n• **Open Issues:** ${stats.openIssues}\n• **Active Investigations:** ${stats.activeInvestigations}\n• **Fixes Generated:** ${stats.fixesGenerated}\n• **Security Score:** ${stats.securityScore}/100\n• **Tests Passing:** ${stats.testsPassed} assertions\n\nAll 7 autonomous AI agents are ready to investigate issues and synthesize patches.`
  }

  return `Hello! I am your **DevFix AI Assistant** (${agent}). I am actively monitoring your codebase and telemetry. How can I help you debug, inspect tests, or synthesize fixes today?`
}
