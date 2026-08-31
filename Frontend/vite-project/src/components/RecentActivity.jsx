import React, { useEffect, useState } from 'react'
import { ActivityIcon } from './Icons'
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

export default function RecentActivity() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getInvestigations()
      .then(res => setItems((res.data || []).slice(0, 10)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="card recent-activity-card">
      <div className="card-header">
        <div className="header-left">
          <div className="section-icon-badge">
            <ActivityIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="card-title">Recent Agent Activity</h2>
            <p className="card-subtitle">Most recent investigations across all repositories</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading activity…</div>
      ) : error ? (
        <div style={{ padding: '16px', color: '#f87171' }}>{error}</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No agent activity yet. Start an investigation to see real progress here.
        </div>
      ) : (
        <div className="activity-timeline">
          {items.map((item) => (
            <div key={item.id} className="timeline-item">
              <div className="timeline-marker">
                <div className={`marker-icon ${item.status === 'COMPLETED' ? 'completed' : 'active'}`}>
                  <ActivityIcon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="timeline-content">
                <div className="timeline-meta">
                  <span className="timeline-step-title">{item.repositoryFullName} #{item.issueNumber}</span>
                  <span className="timeline-agent font-mono">{item.currentAgent || item.status}</span>
                  <span className="timeline-time">{timeAgo(item.updatedAt)}</span>
                </div>
                <p className="timeline-desc">{item.issueTitle}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
