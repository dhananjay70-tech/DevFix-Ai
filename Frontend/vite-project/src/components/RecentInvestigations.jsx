import React from 'react'
import { ActivityIcon, BotIcon, ClockIcon, ChevronRightIcon, CheckCircleIcon, AlertCircleIcon, SparklesIcon, GitPullRequestIcon } from './Icons'

function timeAgo(dateString) {
  if (!dateString) return 'just now'
  const diffMs = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function calculateDuration(start, end) {
  if (!start) return '—'
  const startTime = new Date(start).getTime()
  const endTime = end ? new Date(end).getTime() : Date.now()
  const sec = Math.max(1, Math.round((endTime - startTime) / 1000))
  if (sec < 60) return `${sec}s`
  const mins = Math.floor(sec / 60)
  return `${mins}m ${sec % 60}s`
}

export default function RecentInvestigations({ investigations = [], onViewInvestigation }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'RUNNING':
        return <span className="status-tag status-in-progress"><span className="status-dot"></span>Running</span>
      case 'NEEDS_APPROVAL':
        return <span className="status-tag status-review"><span className="status-dot"></span>Needs Approval</span>
      case 'COMPLETED':
        return <span className="status-tag status-testing"><span className="status-dot"></span>Completed</span>
      case 'FAILED':
        return <span className="status-tag status-failed"><span className="status-dot"></span>Failed</span>
      default:
        return <span className="status-tag status-in-progress"><span className="status-dot"></span>{status}</span>
    }
  }

  return (
    <div className="card recent-investigations-card">
      <div className="card-header">
        <div className="header-left">
          <div className="section-icon-badge">
            <ActivityIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="card-title">Recent Investigations</h2>
            <p className="card-subtitle">Comprehensive ledger of autonomous runs, durations & patch statuses</p>
          </div>
        </div>
        <span className="live-counter-badge">{investigations.length} Total Runs</span>
      </div>

      {investigations.length === 0 ? (
        <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No investigations recorded yet. Click on any repository issue to trigger an autonomous investigation.
        </div>
      ) : (
        <div className="investigations-table-wrap">
          <table className="investigations-table">
            <thead>
              <tr>
                <th>Target & Issue</th>
                <th>Status</th>
                <th>Active Agent</th>
                <th>Duration</th>
                <th>Fix Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {investigations.slice(0, 8).map((inv) => (
                <tr
                  key={inv.id}
                  className="investigation-row"
                  onClick={() => onViewInvestigation && onViewInvestigation(inv)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="inv-target-cell">
                      <div className="inv-repo-line">
                        <span className="inv-repo-name">{inv.repositoryFullName}</span>
                        <span className="inv-issue-badge">#{inv.issueNumber}</span>
                      </div>
                      <span className="inv-title-snippet">{inv.issueTitle}</span>
                    </div>
                  </td>
                  <td>{getStatusBadge(inv.status)}</td>
                  <td>
                    <div className="inv-agent-cell font-mono">
                      <BotIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{inv.currentAgent || 'Supervisor'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="inv-duration-cell">
                      <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span>{calculateDuration(inv.startedAt, inv.completedAt)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="inv-fix-status-cell">
                      {inv.status === 'COMPLETED' ? (
                        <span className="fix-pill verified">
                          <CheckCircleIcon className="w-3 h-3 text-emerald-400" />
                          <span>PR Created</span>
                        </span>
                      ) : inv.status === 'NEEDS_APPROVAL' ? (
                        <span className="fix-pill ready">
                          <SparklesIcon className="w-3 h-3 text-amber-400" />
                          <span>Fix Ready</span>
                        </span>
                      ) : inv.status === 'RUNNING' ? (
                        <span className="fix-pill active">
                          <ActivityIcon className="w-3 h-3 text-indigo-400" />
                          <span>Synthesizing</span>
                        </span>
                      ) : (
                        <span className="fix-pill none">—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onViewInvestigation) onViewInvestigation(inv)
                        }}
                        type="button"
                      >
                        <span>View</span>
                        <ChevronRightIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
