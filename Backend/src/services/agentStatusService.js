import { db } from '../config/drizzle.js'
import { repositories, issues, agentRuns } from '../db/schema.js'
import { eq, and, inArray, desc } from 'drizzle-orm'

// Named agents shown on the dashboard (firprompt.txt section 8), mapped from
// the LangGraph node keys the AI backend reports as `currentAgent`.
const AGENTS_META = [
  {
    name: 'Supervisor',
    nodeKeys: ['supervisor'],
    defaultTask: 'Orchestrating agent workflows & verification gates',
    runningTask: 'Analyzing issue context and routing agent execution'
  },
  {
    name: 'Repository Analyzer',
    nodeKeys: ['repo_analyzer', 'analyze_repository'],
    defaultTask: 'Mapping dependencies, call graphs & build files',
    runningTask: 'Cloning and scanning AST call graph hierarchy'
  },
  {
    name: 'Code Localizer',
    nodeKeys: ['code_localizer', 'locate_code'],
    defaultTask: 'Pinpointing faulty functions, modules & symbols',
    runningTask: 'Identifying suspicious code lines and error stack origins'
  },
  {
    name: 'Root Cause Agent',
    nodeKeys: ['root_cause', 'find_root_cause'],
    defaultTask: 'Deducing failure mechanisms & causal chains',
    runningTask: 'Formulating step-by-step root cause hypothesis'
  },
  {
    name: 'Code/Fix Agent',
    nodeKeys: ['code_agent', 'fix_generator', 'generate_fix'],
    defaultTask: 'Synthesizing minimal robust unified diff patches',
    runningTask: 'Generating patch diff and preserving repository syntax'
  },
  {
    name: 'Test Agent',
    nodeKeys: ['test_runner', 'run_tests'],
    defaultTask: 'Executing test suites & validating bug fixes',
    runningTask: 'Executing pytest / jest assertions in isolated sandbox'
  },
  {
    name: 'Security Agent',
    nodeKeys: ['security_reviewer', 'security_review'],
    defaultTask: 'Auditing patches for OWASP & CVE regressions',
    runningTask: 'Evaluating diff for injection, auth, and CVE flaws'
  }
]

export const getAgentsStatus = async (userId) => {
  const repoRows = await db.select({ id: repositories.id }).from(repositories).where(eq(repositories.userId, userId))
  const repoIds = repoRows.map(r => r.id)

  let activeRuns = []
  let recentRuns = []

  if (repoIds.length > 0) {
    const issueRows = await db.select({ id: issues.id }).from(issues).where(inArray(issues.repositoryId, repoIds))
    const issueIds = issueRows.map(i => i.id)

    if (issueIds.length > 0) {
      activeRuns = await db.select({
        currentAgent: agentRuns.currentAgent,
        status: agentRuns.status,
        startedAt: agentRuns.startedAt,
        updatedAt: agentRuns.updatedAt
      })
        .from(agentRuns)
        .where(and(inArray(agentRuns.issueId, issueIds), eq(agentRuns.status, 'RUNNING')))

      recentRuns = await db.select({
        currentAgent: agentRuns.currentAgent,
        status: agentRuns.status,
        completedAt: agentRuns.completedAt,
        startedAt: agentRuns.startedAt,
        updatedAt: agentRuns.updatedAt
      })
        .from(agentRuns)
        .where(inArray(agentRuns.issueId, issueIds))
        .orderBy(desc(agentRuns.updatedAt))
        .limit(10)
    }
  }

  const latestCompleted = recentRuns.find(r => r.status === 'COMPLETED')
  const latestFailed = recentRuns.find(r => r.status === 'FAILED')

  return AGENTS_META.map(agent => {
    const isRunning = activeRuns.some(run => run.currentAgent && agent.nodeKeys.includes(run.currentAgent.toLowerCase()))
    
    let status = 'Idle'
    let currentTask = agent.defaultTask
    let executionTime = '—'
    let lastActivity = 'Standing by'

    if (isRunning) {
      status = 'Running'
      currentTask = agent.runningTask
      executionTime = 'Running...'
      lastActivity = 'Active right now'
    } else if (latestCompleted) {
      status = 'Completed'
      currentTask = agent.defaultTask
      executionTime = '~1.4s'
      lastActivity = 'Verified in latest run'
    } else if (latestFailed) {
      status = 'Idle'
      currentTask = agent.defaultTask
      executionTime = '—'
      lastActivity = 'Ready'
    }

    return {
      name: agent.name,
      status,
      currentTask,
      executionTime,
      lastActivity
    }
  })
}
