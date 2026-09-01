import React from 'react'
import { ActivityIcon, BotIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon, ShieldCheckIcon, GitPullRequestIcon, SparklesIcon } from './Icons'

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

export default function AgentActivityTimeline({ activities = [], investigations = [], onViewInvestigation }) {
  // Synthesize rich timeline from real investigations and activity logs
  const timelineEvents = []

  // Add from real investigations
  investigations.forEach((inv) => {
    if (inv.status === 'RUNNING') {
      timelineEvents.push({
        id: `run-${inv.id}`,
        agent: inv.currentAgent || 'Supervisor',
        action: 'Investigation in Progress',
        desc: `Analyzing root cause and synthesizing patch for ${inv.repositoryFullName} #${inv.issueNumber}: "${inv.issueTitle}"`,
        status: 'running',
        timestamp: inv.updatedAt || inv.startedAt,
        raw: inv
      })
    } else if (inv.status === 'NEEDS_APPROVAL') {
      timelineEvents.push({
        id: `approval-${inv.id}`,
        agent: 'Security & Verification Agent',
        action: 'Waiting for Human Approval',
        desc: `Patch ready for review on ${inv.repositoryFullName} #${inv.issueNumber} (${inv.confidence || '95%'} confidence)`,
        status: 'waiting',
        timestamp: inv.updatedAt,
        raw: inv
      })
    } else if (inv.status === 'COMPLETED') {
      timelineEvents.push({
        id: `done-${inv.id}`,
        agent: 'Code Agent & PR Submitter',
        action: 'Fix Generated & Verified',
        desc: `Autonomous fix synthesized and verified on sandbox for ${inv.repositoryFullName} #${inv.issueNumber}`,
        status: 'completed',
        timestamp: inv.completedAt || inv.updatedAt,
        raw: inv
      })
    } else if (inv.status === 'FAILED') {
      timelineEvents.push({
        id: `failed-${inv.id}`,
        agent: inv.currentAgent || 'Supervisor',
        action: 'Investigation Stopped',
        desc: `Investigation on ${inv.repositoryFullName} #${inv.issueNumber} ended: ${inv.errorMessage || 'Unknown error'}`,
        status: 'failed',
        timestamp: inv.completedAt || inv.updatedAt,
        raw: inv
      })
    }
  })

  // Add from activity logs
  activities.forEach((act) => {
    let parsedDetails = {}
    try {
      parsedDetails = typeof act.details === 'string' ? JSON.parse(act.details) : (act.details || {})
    } catch {
      parsedDetails = {}
    }

    if (act.action === 'REPOSITORY_SCANNED') {
      timelineEvents.push({
        id: `act-${act.id}`,
        agent: 'Repository Analyzer',
        action: 'Repository Scanned',
        desc: `Completed AST & dependency audit on ${parsedDetails.fullName || act.entityId || 'repository'}.`,
        status: 'completed',
        timestamp: act.createdAt
      })
    } else if (act.action === 'PULL_REQUEST_CREATED') {
      timelineEvents.push({
        id: `act-${act.id}`,
        agent: 'Finalize Agent',
        action: 'Pull Request Created',
        desc: `Opened pull request on branch ${parsedDetails.headBranch || 'fix-branch'}`,
        status: 'completed',
        timestamp: act.createdAt
      })
    } else if (act.action === 'INVESTIGATION_APPROVED') {
      timelineEvents.push({
        id: `act-${act.id}`,
        agent: 'Human In The Loop',
        action: 'Fix Approved',
        desc: `User approved synthesized patch for branch creation & PR merge.`,
        status: 'completed',
        timestamp: act.createdAt
      })
    }
  })

  // Sort chronological descending
  timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <ActivityIcon className="w-3.5 h-3.5 text-indigo-400" />
      case 'waiting':
        return <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
      case 'completed':
        return <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
      case 'failed':
        return <AlertCircleIcon className="w-3.5 h-3.5 text-red-400" />
      default:
        return <BotIcon className="w-3.5 h-3.5 text-gray-400" />
    }
  }

  return (
    <div className="card agent-activity-timeline-card">
      <div className="card-header">
        <div className="header-left">
          <div className="section-icon-badge">
            <ActivityIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="card-title">AI Agent Activity Stream</h2>
            <p className="card-subtitle">Real-time telemetry across supervisor, localizer, test & fix agents</p>
          </div>
        </div>
        <div className="live-stream-badge">
          <span className="pulse-dot green"></span>
          <span>Live Mesh Telemetry</span>
        </div>
      </div>

      {timelineEvents.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No recent agent activity. Launch an investigation or scan a repository to see real-time agent execution events.
        </div>
      ) : (
        <div className="agent-timeline-list">
          {timelineEvents.slice(0, 7).map((ev) => (
            <div
              key={ev.id}
              className={`agent-timeline-item status-${ev.status}`}
              onClick={() => ev.raw && onViewInvestigation && onViewInvestigation(ev.raw)}
              style={{ cursor: ev.raw ? 'pointer' : 'default' }}
            >
              <div className="timeline-node-marker">
                <div className={`node-icon-bubble ${ev.status}`}>
                  {getStatusIcon(ev.status)}
                </div>
              </div>
              <div className="timeline-body">
                <div className="timeline-header-line">
                  <span className="timeline-action-name">{ev.action}</span>
                  <div className="timeline-right-meta">
                    <span className="timeline-agent-tag">
                      <BotIcon className="w-3 h-3" />
                      {ev.agent}
                    </span>
                    <span className="timeline-time-tag">
                      <ClockIcon className="w-3 h-3" />
                      {timeAgo(ev.timestamp)}
                    </span>
                  </div>
                </div>
                <p className="timeline-desc-text">{ev.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
