import { db } from '../config/drizzle.js'
import { repositories, issues, agentRuns } from '../db/schema.js'
import { eq, and, inArray } from 'drizzle-orm'

// Named agents shown on the dashboard (firprompt.txt section 8), mapped from
// the LangGraph node keys the AI backend reports as `currentAgent`.
const AGENT_LABELS = ['Supervisor', 'Repository Analyzer', 'Root Cause Agent', 'Code Agent', 'Test Agent', 'Security Agent']

const NODE_TO_LABEL = {
  supervisor: 'Supervisor',
  repo_analyzer: 'Repository Analyzer',
  analyze_repository: 'Repository Analyzer',
  root_cause: 'Root Cause Agent',
  find_root_cause: 'Root Cause Agent',
  code_localizer: 'Code Agent',
  locate_code: 'Code Agent',
  fix_generator: 'Code Agent',
  generate_fix: 'Code Agent',
  test_runner: 'Test Agent',
  run_tests: 'Test Agent',
  security_reviewer: 'Security Agent',
  security_review: 'Security Agent'
}

export const getAgentsStatus = async (userId) => {
  const statusByLabel = Object.fromEntries(AGENT_LABELS.map(label => [label, 'Idle']))

  const repoRows = await db.select({ id: repositories.id }).from(repositories).where(eq(repositories.userId, userId))
  const repoIds = repoRows.map(r => r.id)

  if (repoIds.length > 0) {
    const issueRows = await db.select({ id: issues.id }).from(issues).where(inArray(issues.repositoryId, repoIds))
    const issueIds = issueRows.map(i => i.id)

    if (issueIds.length > 0) {
      const runningRuns = await db.select({ currentAgent: agentRuns.currentAgent })
        .from(agentRuns)
        .where(and(inArray(agentRuns.issueId, issueIds), eq(agentRuns.status, 'RUNNING')))

      for (const run of runningRuns) {
        const label = NODE_TO_LABEL[run.currentAgent]
        if (label) statusByLabel[label] = 'Running'
      }
    }
  }

  return AGENT_LABELS.map(name => ({ name, status: statusByLabel[name] }))
}
