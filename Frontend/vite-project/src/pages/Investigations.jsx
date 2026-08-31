import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ActivityIcon,
  BotIcon,
  ClockIcon,
  ChevronRightIcon,
  SparklesIcon,
  SearchIcon,
  AlertCircleIcon
} from '../components/Icons'
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

const STATUS_TYPE = {
  PENDING: 'in-progress',
  RUNNING: 'in-progress',
  NEEDS_APPROVAL: 'review',
  COMPLETED: 'testing',
  FAILED: 'in-progress',
  REJECTED: 'in-progress'
}

export default function Investigations() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [investigations, setInvestigations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchInvestigations = useCallback(() => {
    setLoading(true)
    setError(null)
    const statusParam = activeFilter === 'ALL' ? undefined : activeFilter
    api.getInvestigations(statusParam)
      .then(res => setInvestigations(Array.isArray(res.data) ? res.data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [activeFilter])

  useEffect(() => {
    fetchInvestigations()
  }, [fetchInvestigations])

  // Periodic poll if there are any active investigations
  useEffect(() => {
    const hasRunning = investigations.some(i => i.status === 'RUNNING' || i.status === 'PENDING')
    if (!hasRunning) return
    const interval = setInterval(fetchInvestigations, 5000)
    return () => clearInterval(interval)
  }, [investigations, fetchInvestigations])

  const filteredItems = investigations.filter(item => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (item.repositoryFullName && item.repositoryFullName.toLowerCase().includes(q)) ||
      (item.issueTitle && item.issueTitle.toLowerCase().includes(q)) ||
      (item.issueNumber && String(item.issueNumber).includes(q)) ||
      (item.currentAgent && item.currentAgent.toLowerCase().includes(q)) ||
      (item.rootCause && item.rootCause.toLowerCase().includes(q))
    )
  })

  const filterTabs = [
    { key: 'ALL', label: 'All' },
    { key: 'RUNNING', label: 'Running' },
    { key: 'NEEDS_APPROVAL', label: 'Needs Approval' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'FAILED', label: 'Failed' }
  ]

  return (
    <div className="card" style={{ padding: '32px' }}>
      <div className="card-header" style={{ marginBottom: '20px' }}>
        <div className="header-left">
          <div className="section-icon-badge">
            <ActivityIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="card-title">Investigations Workspace</h2>
            <p className="card-subtitle">Real-time LangGraph agent runs, sandbox test executions & fixes</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchInvestigations}
            type="button"
            title="Refresh investigations"
          >
            Refresh
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/repositories')}
            type="button"
          >
            New Investigation
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              className={`btn btn-sm ${activeFilter === tab.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveFilter(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="search-bar" style={{ maxWidth: '320px', width: '100%' }}>
          <SearchIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search investigations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading real investigation data...
        </div>
      ) : error ? (
        <div className="auth-alert error-alert">
          <AlertCircleIcon className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {searchQuery
            ? 'No investigations matching your search query.'
            : activeFilter === 'ALL'
            ? 'No investigations started yet. Go to Repositories to select an issue and start an investigation.'
            : `No investigations in ${activeFilter.toLowerCase()} status.`}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="investigation-item"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '18px'
              }}
            >
              <div className="item-top">
                <div className="repo-issue">
                  <span className="repo-name">{item.repositoryFullName}</span>
                  <span className="issue-tag">#{item.issueNumber}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {item.confidence && (
                    <div className="confidence-pill">
                      <SparklesIcon className="w-3.5 h-3.5" />
                      <span>{item.confidence} Confidence</span>
                    </div>
                  )}
                  <span className={`status-tag status-${STATUS_TYPE[item.status] || 'in-progress'}`}>
                    <span className="status-dot"></span>
                    {item.status}
                  </span>
                </div>
              </div>

              <h3 className="issue-title" style={{ marginTop: '8px', marginBottom: '8px' }}>
                {item.issueTitle}
              </h3>

              {item.rootCause && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Root Cause: </strong>
                  {item.rootCause.length > 200 ? `${item.rootCause.slice(0, 200)}…` : item.rootCause}
                </p>
              )}

              {item.errorMessage && (
                <div className="auth-alert error-alert" style={{ margin: '8px 0', padding: '8px 12px', fontSize: '12px' }}>
                  <AlertCircleIcon className="w-3.5 h-3.5 text-red-400" />
                  <span>{item.errorMessage}</span>
                </div>
              )}

              <div className="item-meta-grid" style={{ marginBottom: '12px' }}>
                <div className="meta-cell">
                  <span className="meta-label">Current Agent</span>
                  <div className="meta-value agent-value">
                    <BotIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{item.currentAgent || 'Supervisor'}</span>
                  </div>
                </div>

                <div className="meta-cell">
                  <span className="meta-label">Last Updated</span>
                  <div className="meta-value time-value">
                    <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span>{timeAgo(item.updatedAt)}</span>
                  </div>
                </div>

                <div className="meta-cell">
                  <span className="meta-label">Progress</span>
                  <div className="meta-value" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {item.progress}%
                  </div>
                </div>
              </div>

              <div className="progress-section" style={{ marginBottom: '12px' }}>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill progress-fill-in-progress"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/investigations/${item.id}`)}
                  type="button"
                >
                  <span>View Details</span>
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
