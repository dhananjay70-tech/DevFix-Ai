import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ZapIcon,
  PlayIcon,
  FolderIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  GitPullRequestIcon,
  ShieldCheckIcon,
  TerminalIcon
} from './Icons'

export default function QuickActions({ onScanRepo, onRunTests, onRunSecurityScan }) {
  const navigate = useNavigate()

  const actions = [
    {
      label: 'New Investigation',
      desc: 'Triage issue & synthesize patch',
      icon: PlayIcon,
      accent: 'indigo',
      onClick: () => navigate('/repositories')
    },
    {
      label: 'Scan Repository',
      desc: 'Execute AST & bug scanner',
      icon: FolderIcon,
      accent: 'blue',
      onClick: onScanRepo ? onScanRepo : () => navigate('/repositories')
    },
    {
      label: 'View Open Issues',
      desc: 'Browse imported GitHub issues',
      icon: AlertCircleIcon,
      accent: 'amber',
      onClick: () => navigate('/repositories')
    },
    {
      label: 'Review Fixes',
      desc: 'Inspect patches & approvals',
      icon: CheckCircleIcon,
      accent: 'emerald',
      onClick: () => navigate('/investigations')
    },
    {
      label: 'View Pull Requests',
      desc: 'Track merged & opened PRs',
      icon: GitPullRequestIcon,
      accent: 'purple',
      onClick: () => navigate('/pull-requests')
    },
    {
      label: 'Run Security Scan',
      desc: 'OWASP & CVE vulnerability audit',
      icon: ShieldCheckIcon,
      accent: 'emerald',
      onClick: onRunSecurityScan ? onRunSecurityScan : () => navigate('/repositories')
    },
    {
      label: 'Run Test Suites',
      desc: 'Execute sandbox test runners',
      icon: TerminalIcon,
      accent: 'blue',
      onClick: onRunTests ? onRunTests : () => navigate('/repositories')
    }
  ]

  return (
    <div className="card quick-actions-card">
      <div className="card-header">
        <div className="header-left">
          <div className="section-icon-badge">
            <ZapIcon className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="card-title">Quick Actions & Workflows</h2>
            <p className="card-subtitle">Fast triggers for autonomous pipelines and triage operations</p>
          </div>
        </div>
      </div>

      <div className="quick-actions-grid">
        {actions.map((act, idx) => {
          const Icon = act.icon
          return (
            <button
              key={idx}
              className={`quick-action-btn accent-${act.accent}`}
              onClick={act.onClick}
              type="button"
            >
              <div className="action-icon-wrap">
                <Icon className="w-4 h-4" />
              </div>
              <div className="action-text-group">
                <span className="action-label">{act.label}</span>
                <span className="action-desc">{act.desc}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
