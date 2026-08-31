import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircleIcon,
  ActivityIcon,
  CheckCircleIcon,
  GitPullRequestIcon,
  SparklesIcon
} from './Icons'
import * as api from '../services/api'

const CONFIG = [
  { key: 'openIssues', title: 'Open Issues', icon: AlertCircleIcon, accent: 'amber', format: (v) => v, to: '/repositories' },
  { key: 'activeInvestigations', title: 'Active Investigations', icon: ActivityIcon, accent: 'indigo', format: (v) => v, to: '/investigations' },
  { key: 'fixesGenerated', title: 'Fixes Generated', icon: CheckCircleIcon, accent: 'emerald', format: (v) => v, to: '/investigations' },
  { key: 'pullRequests', title: 'Pull Requests', icon: GitPullRequestIcon, accent: 'purple', format: (v) => v, to: '/pull-requests' },
  { key: 'fixSuccessRate', title: 'Fix Success Rate', icon: SparklesIcon, accent: 'blue', format: (v) => `${v}%`, to: '/investigations' }
]

export default function KpiSection() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getDashboardStats()
      .then(res => setStats(res.data))
      .catch(err => setError(err.message))
  }, [])

  return (
    <section className="kpi-grid">
      {CONFIG.map((kpi) => {
        const Icon = kpi.icon
        const value = stats ? kpi.format(stats[kpi.key] ?? 0) : (error ? '—' : '…')
        return (
          <div
            key={kpi.key}
            className={`kpi-card accent-${kpi.accent}`}
            onClick={() => kpi.to && navigate(kpi.to)}
            style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
          >
            <div className="kpi-header">
              <span className="kpi-title">{kpi.title}</span>
              <div className={`kpi-icon-wrap icon-${kpi.accent}`}>
                <Icon />
              </div>
            </div>
            <div className="kpi-value">{value}</div>
          </div>
        )
      })}
    </section>
  )
}
