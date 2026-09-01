import React from 'react'
import { ShieldCheckIcon, ShieldAlertIcon, CheckCircleIcon, PlayIcon } from './Icons'
import ExplainButton from './assistant/ExplainButton'

function timeAgo(dateString) {
  if (!dateString) return 'Never scanned'
  const diffMs = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function SecurityOverviewCard({ stats, onRunScan }) {
  const critical = stats?.criticalVulnerabilities ?? 0
  const high = stats?.highVulnerabilities ?? 0
  const medium = stats?.mediumVulnerabilities ?? 0
  const scansCount = stats?.securityScansCompleted ?? 0
  const lastScan = stats?.lastSecurityScan
  const score = stats?.securityScore ?? 100

  return (
    <div className="card security-overview-card">
      <div className="card-header">
        <div className="header-left">
          <div className="section-icon-badge">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="card-title">Security & Vulnerability Audit</h2>
            <p className="card-subtitle">OWASP Top 10, dependency CVEs & automated patch inspection</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="security-score-badge" style={{ color: score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444' }}>
            <span className="score-label">Security Score:</span>
            <span className="score-number">{score}/100</span>
          </div>
          <ExplainButton
            title="Security & Vulnerability Audit"
            data={stats}
            type="Security Audit"
            size="xs"
          />
        </div>
      </div>

      <div className="security-stats-grid">
        <div className="sec-stat-box crit">
          <span className="sec-stat-count">{critical}</span>
          <span className="sec-stat-label">Critical</span>
        </div>
        <div className="sec-stat-box high">
          <span className="sec-stat-count">{high}</span>
          <span className="sec-stat-label">High</span>
        </div>
        <div className="sec-stat-box med">
          <span className="sec-stat-count">{medium}</span>
          <span className="sec-stat-label">Medium</span>
        </div>
        <div className="sec-stat-box scans">
          <span className="sec-stat-count">{scansCount}</span>
          <span className="sec-stat-label">Scans Completed</span>
        </div>
      </div>

      <div className="security-footer-row">
        <div className="sec-last-scan">
          <span className="label">Last Audit:</span>
          <span className="val">{timeAgo(lastScan)}</span>
        </div>
        {onRunScan && (
          <button className="btn btn-secondary btn-sm" onClick={onRunScan} type="button">
            <PlayIcon className="w-3 h-3" />
            <span>Run Security Scan</span>
          </button>
        )}
      </div>
    </div>
  )
}

