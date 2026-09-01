import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircleIcon,
  ActivityIcon,
  CheckCircleIcon,
  GitPullRequestIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  CheckIcon
} from './Icons'

import ExplainButton from './assistant/ExplainButton'

export default function KpiSection({ stats, loading, error, onRetry }) {
  const navigate = useNavigate()


  const cards = [
    {
      key: 'openIssues',
      title: 'Open Issues',
      value: stats ? stats.openIssues ?? 0 : 0,
      icon: AlertCircleIcon,
      accent: 'amber',
      statusText: stats?.openIssues > 0 ? `${stats.openIssues} requiring triage` : 'No open issues',
      to: '/repositories'
    },
    {
      key: 'activeInvestigations',
      title: 'Active Investigations',
      value: stats ? stats.activeInvestigations ?? 0 : 0,
      icon: ActivityIcon,
      accent: 'indigo',
      statusText: stats?.activeInvestigations > 0 ? 'Agent pipeline active' : 'Agents standing by',
      to: '/investigations'
    },
    {
      key: 'fixesGenerated',
      title: 'Fixes Generated',
      value: stats ? stats.fixesGenerated ?? 0 : 0,
      icon: CheckCircleIcon,
      accent: 'emerald',
      statusText: stats?.fixesGenerated > 0 ? 'Patches synthesized' : 'No fixes yet',
      to: '/investigations'
    },
    {
      key: 'pullRequests',
      title: 'Pull Requests',
      value: stats ? stats.pullRequests ?? 0 : 0,
      icon: GitPullRequestIcon,
      accent: 'purple',
      statusText: stats?.pullRequests > 0 ? 'Created on GitHub' : '0 PRs opened',
      to: '/pull-requests'
    },
    {
      key: 'fixSuccessRate',
      title: 'Fix Success Rate',
      value: stats ? `${stats.fixSuccessRate ?? 0}%` : '0%',
      icon: SparklesIcon,
      accent: 'blue',
      statusText: stats?.fixesGenerated > 0 ? 'Automated fix accuracy' : 'Based on runs',
      to: '/investigations'
    },
    {
      key: 'testsRatio',
      title: 'Tests Passed / Failed',
      value: stats ? `${stats.testsPassed ?? 0} / ${stats.testsFailed ?? 0}` : '0 / 0',
      icon: CheckIcon,
      accent: (stats?.testsFailed ?? 0) > 0 ? 'amber' : 'emerald',
      statusText: (stats?.testsFailed ?? 0) > 0 ? `${stats.testsFailed} tests failing` : 'Sandbox assertions passing',
      to: '/investigations'
    },
    {
      key: 'securityIssuesFound',
      title: 'Security Issues',
      value: stats ? stats.securityIssuesFound ?? 0 : 0,
      icon: (stats?.securityIssuesFound ?? 0) > 0 ? ShieldAlertIcon : ShieldCheckIcon,
      accent: (stats?.securityIssuesFound ?? 0) > 0 ? 'red' : 'emerald',
      statusText: (stats?.criticalVulnerabilities ?? 0) > 0
        ? `${stats.criticalVulnerabilities} critical CVEs`
        : (stats?.securityIssuesFound ?? 0) > 0
          ? `${stats.securityIssuesFound} warnings detected`
          : 'Security audit clean',
      to: '/investigations'
    }
  ]

  if (loading) {
    return (
      <section className="kpi-grid">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="kpi-card skeleton-card">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-value"></div>
            <div className="skeleton skeleton-sub"></div>
          </div>
        ))}
      </section>
    )
  }

  if (error) {
    return (
      <div className="dashboard-error-banner">
        <span>Failed to load overview metrics: {error}</span>
        {onRetry && <button className="btn btn-secondary btn-sm" onClick={onRetry}>Retry</button>}
      </div>
    )
  }

  return (
    <section className="kpi-grid">
      {cards.map((kpi) => {
        const Icon = kpi.icon
        return (
          <div
            key={kpi.key}
            className={`kpi-card accent-${kpi.accent}`}
            onClick={() => kpi.to && navigate(kpi.to)}
            style={{ cursor: 'pointer' }}
            title={`View ${kpi.title}`}
          >
            <div className="kpi-header">
              <span className="kpi-title">{kpi.title}</span>
              <div className={`kpi-icon-wrap icon-${kpi.accent}`}>
                <Icon />
              </div>
            </div>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-footer-status">
              <span className={`kpi-indicator-dot dot-${kpi.accent}`}></span>
              <span className="kpi-status-text">{kpi.statusText}</span>
              <div style={{ marginLeft: 'auto' }}>
                <ExplainButton
                  title={kpi.title}
                  data={kpi.value}
                  type="KPI Metric"
                  size="xs"
                />
              </div>
            </div>

          </div>
        )
      })}
    </section>
  )
}
