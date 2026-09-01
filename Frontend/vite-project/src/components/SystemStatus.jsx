import React from 'react'
import { ServerIcon, BotIcon, ActivityIcon, ClockIcon } from './Icons'

export default function SystemStatus({ agents = [], loading, error }) {
  const runningCount = agents.filter(a => a.status === 'Running').length

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Running':
        return (
          <span className="agent-status-tag running">
            <span className="pulse-dot green"></span>
            Running
          </span>
        )
      case 'Completed':
        return (
          <span className="agent-status-tag completed">
            <span className="dot green"></span>
            Verified
          </span>
        )
      case 'Failed':
        return (
          <span className="agent-status-tag failed">
            <span className="dot red"></span>
            Failed
          </span>
        )
      default:
        return (
          <span className="agent-status-tag idle">
            <span className="dot gray"></span>
            Idle
          </span>
        )
    }
  }

  return (
    <div className="card system-status-card">
      <div className="card-header">
        <div className="header-left">
          <div className="section-icon-badge">
            <ServerIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="card-title">AI System & Agent Mesh Status</h2>
            <p className="card-subtitle">Autonomous agent state, active task allocation & runtime telemetry</p>
          </div>
        </div>
        <span className="all-operational-badge">
          <span className={`pulse-dot ${runningCount > 0 ? 'green' : ''}`}></span>
          {runningCount > 0 ? `${runningCount} Agent${runningCount === 1 ? '' : 's'} Active` : 'Mesh Operational'}
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading agent mesh status…
        </div>
      ) : error ? (
        <div style={{ padding: '16px', color: '#f87171' }}>{error}</div>
      ) : (
        <div className="agent-mesh-grid">
          {agents.map((agent, idx) => (
            <div key={idx} className={`agent-mesh-card status-${agent.status?.toLowerCase()}`}>
              <div className="agent-mesh-header">
                <div className="agent-title-group">
                  <BotIcon className="w-4 h-4 text-indigo-400" />
                  <span className="agent-name-text">{agent.name}</span>
                </div>
                {getStatusBadge(agent.status)}
              </div>

              <p className="agent-task-text">{agent.currentTask || 'Standing by for workflow invocation'}</p>

              <div className="agent-meta-bottom">
                <div className="agent-metric">
                  <span className="metric-lbl">Runtime:</span>
                  <span className="metric-val font-mono">{agent.executionTime || '—'}</span>
                </div>
                <div className="agent-metric">
                  <span className="metric-lbl">Activity:</span>
                  <span className="metric-val">{agent.lastActivity || 'Ready'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
