import React, { useState } from 'react'
import {
  CheckCircleIcon,
  AlertCircleIcon,
  ActivityIcon,
  BotIcon,
  SparklesIcon,
  TerminalIcon,
  ShieldCheckIcon,
  GitBranchIcon,
  GitPullRequestIcon,
  FolderIcon
} from '../Icons'

const PIPELINE_AGENTS = [
  {
    key: 'supervisor',
    name: '1. Supervisor',
    desc: 'Coordinates graph & thread state',
    icon: BotIcon,
    input: 'Issue title, description & repo URL',
    output: 'Execution execution plan & context'
  },
  {
    key: 'analyze_repository',
    name: '2. Repository Analyzer',
    desc: 'Indexes repo structure & modules',
    icon: FolderIcon,
    input: 'Sandbox workspace clone',
    output: 'File map & language configuration'
  },
  {
    key: 'locate_code',
    name: '3. Code Localizer',
    desc: 'Identifies candidate bug locations',
    icon: SparklesIcon,
    input: 'Issue description & source AST',
    output: 'Ranked candidate files & lines'
  },
  {
    key: 'find_root_cause',
    name: '4. Root Cause Analyzer',
    desc: 'Diagnoses failure mechanism',
    icon: AlertCircleIcon,
    input: 'Target files & stack traces',
    output: 'Root cause explanation & rationale'
  },
  {
    key: 'generate_fix',
    name: '5. Fix Generator',
    desc: 'Synthesizes code patch',
    icon: SparklesIcon,
    input: 'Root cause analysis & file context',
    output: 'Unified Git diff patch'
  },
  {
    key: 'run_tests',
    name: '6. Test Runner',
    desc: 'Executes tests in sandbox',
    icon: TerminalIcon,
    input: 'Patched repository in sandbox',
    output: 'Test exit code & assertion results'
  },
  {
    key: 'security_review',
    name: '7. Security Auditor',
    desc: 'Inspects patch for vulnerabilities',
    icon: ShieldCheckIcon,
    input: 'Synthesized Git diff',
    output: 'Security score & vulnerability audit'
  },
  {
    key: 'human_approval',
    name: '8. Human Review',
    desc: 'Awaiting human authorization',
    icon: CheckCircleIcon,
    input: 'Verified patch & test report',
    output: 'Human approval or rejection decision'
  },
  {
    key: 'finalize',
    name: '9. PR Finalizer',
    desc: 'Creates branch & opens GitHub PR',
    icon: GitPullRequestIcon,
    input: 'Approved patch & GitHub token',
    output: 'Live Pull Request URL & status'
  }
]

export default function AgentPipeline({ investigation, onSelectAgent }) {
  const [expandedAgent, setExpandedAgent] = useState(null)

  const currentKey = investigation?.currentAgent || 'supervisor'
  const isCompleted = investigation?.status === 'COMPLETED'
  const isFailed = investigation?.status === 'FAILED'
  const isApproval = investigation?.status === 'NEEDS_APPROVAL'

  let activeIndex = PIPELINE_AGENTS.findIndex(a => a.key === currentKey)
  if (activeIndex < 0) activeIndex = 0
  if (isCompleted) activeIndex = PIPELINE_AGENTS.length - 1
  if (isApproval) activeIndex = 7

  const getAgentStatus = (idx) => {
    if (isCompleted) return 'COMPLETED'
    if (isFailed && idx === activeIndex) return 'FAILED'
    if (idx < activeIndex) return 'COMPLETED'
    if (idx === activeIndex) return isApproval ? 'WAITING' : 'RUNNING'
    return 'QUEUED'
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            Multi-Agent Autonomous Pipeline
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            9 specialized AI agents orchestrated by LangGraph StateGraph
          </p>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          {isCompleted ? '9/9 Completed' : `${activeIndex + 1}/9 In Progress`}
        </span>
      </div>

      {/* Grid of Agent Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        {PIPELINE_AGENTS.map((agent, idx) => {
          const status = getAgentStatus(idx)
          const isCurrent = status === 'RUNNING' || status === 'WAITING'
          const isDone = status === 'COMPLETED'
          const isError = status === 'FAILED'
          const Icon = agent.icon
          const isExpanded = expandedAgent === agent.key

          return (
            <div
              key={agent.key}
              style={{
                backgroundColor: isCurrent
                  ? 'rgba(99, 102, 241, 0.12)'
                  : isDone
                  ? 'rgba(16, 185, 129, 0.06)'
                  : isError
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'var(--bg-elevated)',
                border: isCurrent
                  ? '1px solid var(--accent-indigo)'
                  : isDone
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : isError
                  ? '1px solid #ef4444'
                  : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onClick={() => setExpandedAgent(isExpanded ? null : agent.key)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: isCurrent
                    ? 'rgba(99, 102, 241, 0.2)'
                    : isDone
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isCurrent ? 'var(--accent-indigo)' : isDone ? '#34d399' : isError ? '#f87171' : 'var(--text-muted)'
                }}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <span style={{
                  fontSize: '9px',
                  fontWeight: '700',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  backgroundColor: isDone
                    ? 'rgba(16, 185, 129, 0.2)'
                    : isCurrent
                    ? 'rgba(99, 102, 241, 0.25)'
                    : isError
                    ? 'rgba(239, 68, 68, 0.25)'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: isDone ? '#34d399' : isCurrent ? '#818cf8' : isError ? '#f87171' : 'var(--text-muted)'
                }}>
                  {status}
                </span>
              </div>

              <div style={{ fontSize: '12px', fontWeight: '600', color: isCurrent ? 'var(--accent-indigo)' : isDone ? '#e2e8f0' : 'var(--text-primary)', marginBottom: '2px' }}>
                {agent.name}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                {agent.desc}
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div style={{
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '11px',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong style={{ color: 'var(--text-muted)' }}>Input:</strong> {agent.input}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-muted)' }}>Output:</strong> {agent.output}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
