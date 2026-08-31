import React, { useEffect, useState } from 'react'
import { GitPullRequestIcon, SparklesIcon } from './Icons'
import * as api from '../services/api'

export default function PendingApprovals({ onReview }) {
  const [approvals, setApprovals] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchApprovals = () => {
    api.getInvestigations('NEEDS_APPROVAL')
      .then(res => setApprovals(res.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchApprovals()
    const interval = setInterval(fetchApprovals, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="card pending-approvals-card">
      <div className="card-header">
        <div className="header-left">
          <div className="section-icon-badge amber-badge">
            <GitPullRequestIcon className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="card-title">Pending Approvals</h2>
            <p className="card-subtitle">AI-generated fixes awaiting human review before pull request merge</p>
          </div>
        </div>
        <span className="pending-badge">{approvals.length} Action{approvals.length === 1 ? '' : 's'} Required</span>
      </div>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading approvals…</div>
      ) : error ? (
        <div style={{ padding: '16px', color: '#f87171' }}>{error}</div>
      ) : approvals.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No fixes are currently awaiting human review.
        </div>
      ) : (
        <div className="approvals-list">
          {approvals.map((item) => (
            <div key={item.id} className="approval-banner">
              <div className="approval-main">
                <div className="approval-header-row">
                  <span className="approval-repo-tag">{item.repositoryFullName}</span>
                  <span className="approval-pr-tag">#{item.issueNumber}</span>
                </div>
                <h3 className="approval-issue-title">{item.issueTitle}</h3>

                {item.confidence && (
                  <div className="approval-meta-chips">
                    <div className="chip chip-confidence">
                      <SparklesIcon className="w-3.5 h-3.5" />
                      <span>{item.confidence} Confidence</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="approval-action">
                <button
                  className="btn btn-amber"
                  onClick={() => onReview(item)}
                  type="button"
                >
                  Review Fix
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
