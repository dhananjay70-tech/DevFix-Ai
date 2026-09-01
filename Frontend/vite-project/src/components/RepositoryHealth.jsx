import React, { useState } from 'react'
import { FolderIcon, ChevronRightIcon, PlayIcon, ShieldCheckIcon, ShieldAlertIcon, CheckCircleIcon, AlertCircleIcon } from './Icons'
import ExplainButton from './assistant/ExplainButton'
import * as api from '../services/api'


export default function RepositoryHealth({ repos, githubStatus, onConnectGithub, onSelectRepo, onScanComplete }) {
  const [scanningMap, setScanningMap] = useState({})
  const [scanMessage, setScanMessage] = useState(null)

  const handleScanNow = async (repo, e) => {
    e.stopPropagation()
    const key = repo.fullName || `${repo.owner}/${repo.name}`
    setScanningMap(prev => ({ ...prev, [key]: true }))
    setScanMessage({ type: 'info', text: `Initiating autonomous scanner for ${key}…` })

    try {
      const res = await api.scanRepository(repo.owner, repo.name)
      const issuesFound = res.issues_found ?? res.issues?.length ?? 0
      setScanMessage({
        type: 'success',
        text: `Scan complete for ${key}: ${issuesFound} potential issue${issuesFound === 1 ? '' : 's'} identified.`
      })
      if (onScanComplete) onScanComplete(res)
    } catch (err) {
      setScanMessage({ type: 'error', text: `Scan failed for ${key}: ${err.message}` })
    } finally {
      setScanningMap(prev => ({ ...prev, [key]: false }))
      setTimeout(() => setScanMessage(null), 7000)
    }
  }

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

  const calculateHealthScore = (repo) => {
    const issues = Number(repo.openIssues) || 0
    if (issues === 0) return { score: 100, badge: 'A+', color: '#10b981' }
    if (issues <= 2) return { score: 92, badge: 'A', color: '#10b981' }
    if (issues <= 5) return { score: 84, badge: 'B', color: '#f59e0b' }
    if (issues <= 10) return { score: 72, badge: 'C', color: '#f59e0b' }
    return { score: 58, badge: 'D', color: '#ef4444' }
  }

  return (
    <div className="card repository-health-card">
      <div className="card-header">
        <div className="header-left">
          <div className="section-icon-badge">
            <FolderIcon className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="card-title">Repository Health & Security</h2>
            <p className="card-subtitle">Real-time health audits, vulnerability tracking & sandbox scan triggers</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="repo-count-badge">{repos.length} Repositories</span>
          {!githubStatus?.connected && (
            <button className="btn btn-secondary btn-sm" onClick={onConnectGithub} type="button">
              Connect GitHub
            </button>
          )}
        </div>
      </div>

      {scanMessage && (
        <div
          className={`dashboard-scan-banner banner-${scanMessage.type}`}
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: scanMessage.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
            border: scanMessage.type === 'error' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(99,102,241,0.3)',
            color: scanMessage.type === 'error' ? '#f87171' : '#a5b4fc'
          }}
        >
          <span>{scanMessage.text}</span>
          <button className="btn-ghost btn-sm" onClick={() => setScanMessage(null)} style={{ padding: '2px 6px' }}>✕</button>
        </div>
      )}

      {!githubStatus?.connected ? (
        <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Connect your GitHub account to monitor repository health and run autonomous scans.
        </div>
      ) : repos.length === 0 ? (
        <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No repositories synced yet.
        </div>
      ) : (
        <div className="repo-health-table-wrap">
          <table className="repo-health-table">
            <thead>
              <tr>
                <th>Repository</th>
                <th>Language</th>
                <th>Open Issues</th>
                <th>Health Score</th>
                <th>Security Status</th>
                <th>Test Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {repos.slice(0, 8).map((repo) => {
                const health = calculateHealthScore(repo)
                const key = repo.fullName || `${repo.owner}/${repo.name}`
                const isScanning = Boolean(scanningMap[key])

                return (
                  <tr key={repo.id || key} className="repo-health-row" onClick={() => onSelectRepo(repo)}>
                    <td>
                      <div className="repo-name-cell">
                        <span className="repo-name-text">{repo.fullName || repo.name}</span>
                        {repo.isPrivate && <span className="private-pill">Private</span>}
                      </div>
                    </td>
                    <td>
                      <div className="lang-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span className="lang-dot" style={{ backgroundColor: getLangColor(repo.language) }}></span>
                        <span className="lang-name">{repo.language || 'Plain Text'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`issue-count-pill ${repo.openIssues > 0 ? 'has-issues' : 'clean'}`}>
                        {repo.openIssues ?? 0} open
                      </span>
                    </td>
                    <td>
                      <div className="health-score-cell">
                        <div className="health-bar-bg">
                          <div className="health-bar-fill" style={{ width: `${health.score}%`, backgroundColor: health.color }}></div>
                        </div>
                        <span className="health-score-number" style={{ color: health.color }}>{health.score}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="status-cell">
                        {repo.openIssues > 5 ? (
                          <span className="health-status-badge warning">
                            <ShieldAlertIcon className="w-3.5 h-3.5" />
                            <span>Audit Rec.</span>
                          </span>
                        ) : (
                          <span className="health-status-badge success">
                            <ShieldCheckIcon className="w-3.5 h-3.5" />
                            <span>Secure</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="status-cell">
                        {repo.openIssues > 0 ? (
                          <span className="health-status-badge warning">
                            <AlertCircleIcon className="w-3.5 h-3.5" />
                            <span>Issues Active</span>
                          </span>
                        ) : (
                          <span className="health-status-badge success">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            <span>Passing</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="repo-row-actions" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                        <ExplainButton
                          title={`Repository Health for ${repo.fullName || repo.name}`}
                          data={repo}
                          type="Repository Health Audit"
                          size="xs"
                        />
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => handleScanNow(repo, e)}
                          disabled={isScanning}
                          title="Run sandbox code & dependency scan"
                        >
                          <PlayIcon className="w-3 h-3 text-indigo-400" />
                          <span>{isScanning ? 'Scanning…' : 'Scan Now'}</span>
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => onSelectRepo(repo)}
                          title="View repository issues"
                        >
                          <ChevronRightIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
