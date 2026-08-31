import React from 'react'
import {
  BotIcon,
  SparklesIcon,
  FolderIcon,
  TerminalIcon,
  ShieldCheckIcon,
  GitPullRequestIcon,
  CheckCircleIcon
} from '../Icons'

export default function AiActivityTimeline({ investigation }) {
  const isCompleted = investigation?.status === 'COMPLETED'
  const isNeedsApproval = investigation?.status === 'NEEDS_APPROVAL'

  const milestones = [
    { label: 'Issue Received & Graph Initialized', icon: BotIcon, done: true, time: '00:01' },
    { label: 'Repository Cloned into Sandbox', icon: FolderIcon, done: true, time: '00:04' },
    { label: 'Candidate Defect Localized', icon: SparklesIcon, done: Boolean(investigation?.affectedFiles?.length), time: '00:12' },
    { label: 'Root Cause Diagnosed', icon: BotIcon, done: Boolean(investigation?.rootCause), time: '00:22' },
    { label: 'Unified Code Patch Synthesized', icon: SparklesIcon, done: Boolean(investigation?.proposedFix || investigation?.pullRequest), time: '00:35' },
    { label: 'Sandbox Tests Verified', icon: TerminalIcon, done: Boolean(investigation?.testResults || isNeedsApproval || isCompleted), time: '00:48' },
    { label: 'Security & Vulnerability Audit', icon: ShieldCheckIcon, done: Boolean(isNeedsApproval || isCompleted), time: '00:54' },
    { label: 'Human Authorization & PR Finalized', icon: GitPullRequestIcon, done: isCompleted, time: '01:05' }
  ]

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
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Investigation Activity & Milestone Timeline
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Sequential progression of autonomous LangGraph nodes
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
        {milestones.map((item, idx) => {
          const Icon = item.icon
          return (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: item.done ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: item.done ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-surface)',
                color: item.done ? '#34d399' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon className="w-3.5 h-3.5" />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: item.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {item.done ? `✓ +${item.time}` : 'Pending'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
