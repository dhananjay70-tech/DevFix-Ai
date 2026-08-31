import React, { useState, useEffect } from 'react'
import {
  GitPullRequestIcon,
  GitBranchIcon,
  SearchIcon,
  AlertCircleIcon,
  ClockIcon
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

export default function PullRequests() {
  const [pullRequests, setPullRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.getPullRequests()
      .then(res => setPullRequests(Array.isArray(res.data) ? res.data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filteredPrs = pullRequests.filter(pr => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (pr.title && pr.title.toLowerCase().includes(q)) ||
      (pr.repositoryFullName && pr.repositoryFullName.toLowerCase().includes(q)) ||
      (pr.headBranch && pr.headBranch.toLowerCase().includes(q)) ||
      (pr.issueTitle && pr.issueTitle.toLowerCase().includes(q)) ||
      (pr.issueNumber && String(pr.issueNumber).includes(q))
    )
  })

  return (
    <div className="card" style={{ padding: '32px' }}>
      <div className="card-header" style={{ marginBottom: '20px' }}>
        <div className="header-left">
          <div className="section-icon-badge" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
            <GitPullRequestIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="card-title">Pull Requests Workspace</h2>
            <p className="card-subtitle">Real GitHub Pull Requests opened autonomously by DevFix AI</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="repo-count-badge">{pullRequests.length} Pull Requests</span>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: '20px', maxWidth: '380px' }}>
        <div className="search-bar">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search pull requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading real pull requests...
        </div>
      ) : error ? (
        <div className="auth-alert error-alert">
          <AlertCircleIcon className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      ) : filteredPrs.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {searchQuery
            ? 'No pull requests matching your search query.'
            : 'No pull requests generated yet. When you approve an investigation fix, a real GitHub PR will be created and displayed here.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredPrs.map((pr) => (
            <div
              key={pr.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {pr.repositoryFullName && (
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {pr.repositoryFullName}
                    </span>
                  )}
                  {pr.issueNumber && (
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo)', fontWeight: '600' }}>
                      Fix for #{pr.issueNumber}
                    </span>
                  )}
                  <span className="status-tag status-testing">
                    <span className="status-dot"></span>
                    {pr.status || 'OPEN'}
                  </span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                  {pr.title}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {pr.headBranch && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)' }}>
                      <GitBranchIcon className="w-3.5 h-3.5" />
                      <span>{pr.headBranch}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {pr.filesChanged > 0 && <span>{pr.filesChanged} file{pr.filesChanged === 1 ? '' : 's'}</span>}
                    {pr.linesAdded > 0 && <span style={{ color: '#34d399' }}>+{pr.linesAdded}</span>}
                    {pr.linesRemoved > 0 && <span style={{ color: '#f87171' }}>-{pr.linesRemoved}</span>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ClockIcon className="w-3.5 h-3.5" />
                    <span>{timeAgo(pr.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div>
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <GitPullRequestIcon className="w-4 h-4 text-purple-400" />
                  <span>View on GitHub</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
