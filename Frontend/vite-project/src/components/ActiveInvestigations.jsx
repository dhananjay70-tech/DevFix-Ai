import React, { useEffect, useState } from 'react'
import {
  ActivityIcon,
  BotIcon,
  ClockIcon,
  ChevronRightIcon,
  SparklesIcon
} from './Icons'
import * as api from '../services/api'

function timeAgo(dateString) {
  if (!dateString) return '—'
  const diffMs = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const STATUS_TYPE = { PENDING: 'in-progress', RUNNING: 'in-progress', NEEDS_APPROVAL: 'review', COMPLETED: 'testing', FAILED: 'in-progress' }

export default function ActiveInvestigations({ onViewInvestigation }) {
  const [investigations, setInvestigations] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchActive = () => {
    api.getInvestigations('RUNNING')
      .then(res => setInvestigations(res.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchActive()
    const interval = setInterval(fetchActive, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="card active-investigations-card">
      <div className="card-header">
        <div className="header-left">
          <div className="section-icon-badge">
            <ActivityIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="card-title">Active Investigations</h2>
            <p className="card-subtitle">Real-time autonomous debugging & patch synthesis</p>
          </div>
        </div>
        <span className="live-counter-badge">{investigations.length} Active</span>
      </div>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading investigations…</div>
      ) : error ? (
        <div style={{ padding: '16px', color: '#f87171' }}>{error}</div>
      ) : investigations.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No active investigations. Start one from a repository's issues.
        </div>
      ) : (
        <div className="investigations-list">
          {investigations.map((item) => (
            <div key={item.id} className="investigation-item">
              <div className="item-top">
                <div className="repo-issue">
                  <span className="repo-name">{item.repositoryFullName}</span>
                  <span className="issue-tag">#{item.issueNumber}</span>
                </div>
                {item.confidence && (
                  <div className="confidence-pill">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>{item.confidence} Confidence</span>
                  </div>
                )}
              </div>

              <h3 className="issue-title">{item.issueTitle}</h3>

              <div className="item-meta-grid">
                <div className="meta-cell">
                  <span className="meta-label">Current Agent</span>
                  <div className="meta-value agent-value">
                    <BotIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{item.currentAgent || 'Supervisor'}</span>
                  </div>
                </div>

                <div className="meta-cell">
                  <span className="meta-label">Status</span>
                  <div className="meta-value">
                    <span className={`status-tag status-${STATUS_TYPE[item.status] || 'in-progress'}`}>
                      <span className="status-dot"></span>
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="meta-cell">
                  <span className="meta-label">Last Activity</span>
                  <div className="meta-value time-value">
                    <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span>{timeAgo(item.updatedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="progress-section">
                <div className="progress-header">
                  <span className="progress-label">{item.rootCause || 'Investigating…'}</span>
                  <span className="progress-percentage">{item.progress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill progress-fill-in-progress"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="item-footer">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => onViewInvestigation(item)}
                  type="button"
                >
                  <span>View Investigation</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
