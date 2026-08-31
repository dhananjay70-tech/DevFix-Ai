import React, { useState, useEffect } from 'react'
import { FolderIcon, ChevronRightIcon, GithubIcon, SearchIcon } from './Icons'
import * as api from '../services/api'

export default function RepositoryList({ githubStatus, onConnectGithub, onSelectRepo }) {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (githubStatus?.connected) {
      setLoading(true)
      setError(null)
      api.getGithubRepos()
        .then(data => setRepos(Array.isArray(data.data) ? data.data : []))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    } else {
      setRepos([])
    }
  }, [githubStatus?.connected])

  const getLangColor = (lang) => {
    switch (lang?.toLowerCase()) {
      case 'typescript': return '#3178c6'
      case 'javascript': return '#f1e05a'
      case 'python': return '#3572A5'
      case 'rust': return '#dea584'
      case 'go': return '#00ADD8'
      case 'java': return '#b07219'
      default: return '#8b5cf6'
    }
  }

  const filteredRepos = repos.filter(repo => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (repo.fullName && repo.fullName.toLowerCase().includes(q)) ||
      (repo.name && repo.name.toLowerCase().includes(q)) ||
      (repo.description && repo.description.toLowerCase().includes(q)) ||
      (repo.language && repo.language.toLowerCase().includes(q))
    )
  })

  return (
    <div className="card repository-list-card">
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div className="header-left">
          <div className="section-icon-badge">
            <FolderIcon className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="card-title">Repositories Workspace</h2>
            <p className="card-subtitle">
              {githubStatus?.connected
                ? `Real GitHub Repositories for @${githubStatus.username}`
                : 'Connect GitHub to see your real repositories'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="repo-count-badge">{repos.length} Repos</span>
          {!githubStatus?.connected && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onConnectGithub}
              type="button"
            >
              <GithubIcon />
              <span>Connect GitHub</span>
            </button>
          )}
        </div>
      </div>

      {githubStatus?.connected && repos.length > 0 && (
        <div style={{ marginBottom: '16px', maxWidth: '320px' }}>
          <div className="search-bar">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {!githubStatus?.connected ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No GitHub account connected yet.
        </div>
      ) : loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Syncing repositories from GitHub...
        </div>
      ) : error ? (
        <div style={{ padding: '16px', color: '#f87171', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>
          {error}
        </div>
      ) : filteredRepos.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {searchQuery ? 'No repositories matching your search query.' : 'No repositories found on this GitHub account.'}
        </div>
      ) : (
        <div className="repos-grid">
          {filteredRepos.map((repo) => (
            <div key={repo.id} className="repo-card-item">
              <div className="repo-main-info">
                <div className="repo-title-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="repo-title-name">{repo.fullName || repo.name}</span>
                  {repo.isPrivate && (
                    <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '4px', color: '#9ca3af' }}>Private</span>
                  )}
                </div>
                {repo.description && <p className="repo-description">{repo.description}</p>}

                <div className="repo-meta-row">
                  <div className="lang-tag">
                    <span className="lang-dot" style={{ backgroundColor: getLangColor(repo.language) }}></span>
                    <span className="lang-name">{repo.language || 'Plain Text'}</span>
                  </div>
                  <span className="issues-badge">{repo.openIssues ?? 0} open issues</span>
                  {repo.stars !== undefined && <span className="activity-time">★ {repo.stars} stars</span>}
                </div>
              </div>

              <div className="repo-action-wrap" style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onSelectRepo(repo)}
                  type="button"
                >
                  <span>View Issues</span>
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
