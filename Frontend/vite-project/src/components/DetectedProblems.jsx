import React, { useState } from 'react'
import { BugIcon, FilterIcon, PlayIcon, FileCodeIcon, ChevronRightIcon, AlertCircleIcon, ShieldAlertIcon } from './Icons'
import ExplainButton from './assistant/ExplainButton'


function timeAgo(dateString) {
  if (!dateString) return 'recently'
  const diffMs = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function DetectedProblems({ problems = [], onInvestigate, onViewCode }) {
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const filteredProblems = problems.filter((item) => {
    if (severityFilter !== 'ALL' && item.severity?.toUpperCase() !== severityFilter) return false
    if (statusFilter !== 'ALL' && item.status?.toUpperCase() !== statusFilter) return false
    return true
  })

  const getSeverityBadgeClass = (sev) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL': return 'severity-critical'
      case 'HIGH': return 'severity-high'
      case 'MEDIUM': return 'severity-medium'
      default: return 'severity-low'
    }
  }

  return (
    <div className="card detected-problems-card">
      <div className="card-header">
        <div className="header-left">
          <div className="section-icon-badge amber-badge">
            <BugIcon className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="card-title">Detected Problems & Issues</h2>
            <p className="card-subtitle">Real-time localized bugs, syntax regressions & security vulnerabilities</p>
          </div>
        </div>

        <div className="problems-filters-bar" style={{ display: 'flex', gap: '8px' }}>
          <div className="filter-group">
            <FilterIcon className="w-3.5 h-3.5 text-gray-400" />
            <select
              className="filter-select"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {filteredProblems.length === 0 ? (
        <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {problems.length === 0
            ? 'No detected problems found. Run a repository scan or connect repos with open issues.'
            : 'No problems match the selected filter criteria.'}
        </div>
      ) : (
        <div className="problems-grid">
          {filteredProblems.slice(0, 6).map((prob) => (
            <div key={prob.id} className="problem-card-item">
              <div className="problem-top-row">
                <span className={`severity-tag ${getSeverityBadgeClass(prob.severity)}`}>
                  {prob.severity || 'MEDIUM'}
                </span>
                <span className="error-type-tag font-mono">{prob.errorType || 'Runtime Bug'}</span>
                <span className="problem-time-ago">{timeAgo(prob.detectedAt || prob.createdAt)}</span>
              </div>

              <h4 className="problem-title">{prob.title || prob.error_message}</h4>

              {prob.file && (
                <div className="problem-file-location font-mono">
                  <FileCodeIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span className="file-path">{prob.file}</span>
                  {prob.line && <span className="line-num">:{prob.line}</span>}
                </div>
              )}

              <p className="problem-explanation">
                {prob.explanation || prob.description || 'AI localized anomaly requiring root cause verification.'}
              </p>

              <div className="problem-action-row">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onInvestigate && onInvestigate(prob)}
                  type="button"
                >
                  <PlayIcon className="w-3 h-3" />
                  <span>Investigate</span>
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onViewCode && onViewCode(prob)}
                  type="button"
                >
                  <FileCodeIcon className="w-3 h-3" />
                  <span>View Code</span>
                </button>

                <ExplainButton
                  title={prob.title || prob.error_message}
                  data={prob}
                  type="Detected Issue"
                  size="sm"
                />
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}
