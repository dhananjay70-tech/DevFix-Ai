import React, { useEffect, useState } from 'react'
import { ServerIcon, CpuIcon } from './Icons'
import * as api from '../services/api'

export default function SystemStatus() {
  const [agents, setAgents] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getAgentsStatus()
      .then(res => setAgents(res.data || []))
      .catch(err => setError(err.message))
  }, [])

  const runningCount = agents.filter(a => a.status === 'Running').length

  return (
    <div className="card system-status-card">
      <div className="card-header">
        <div className="header-left">
          <div className="section-icon-badge">
            <ServerIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="card-title">AI System Status</h2>
            <p className="card-subtitle">Autonomous agent mesh health</p>
          </div>
        </div>
        <span className="all-operational-badge">
          <span className={`pulse-dot ${runningCount > 0 ? 'green' : ''}`}></span>
          {runningCount > 0 ? `${runningCount} Agent${runningCount === 1 ? '' : 's'} Running` : 'All Idle'}
        </span>
      </div>

      {error ? (
        <div style={{ padding: '16px', color: '#f87171' }}>{error}</div>
      ) : (
        <div className="status-list">
          {agents.map((item, idx) => (
            <div key={idx} className="status-row">
              <div className="status-name-group">
                <CpuIcon className="w-4 h-4 text-gray-400" />
                <span className="status-item-name">{item.name}</span>
              </div>
              <div className="status-state">
                <span className="status-dot-badge">
                  <span className={`dot ${item.status === 'Running' ? 'green' : ''}`}></span>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
