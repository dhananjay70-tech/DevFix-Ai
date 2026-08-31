import React from 'react'
import { GithubIcon, PlusIcon, SparklesIcon, CheckCircleIcon } from './Icons'
import { useAuth } from '../context/AuthContext'

export default function Header({ onNewInvestigation, githubStatus, onConnectGithub, onDisconnectGithub }) {
  const { user, logout } = useAuth()

  return (
    <header className="top-header">
      <div className="header-titles">
        <div className="title-row">
          <h1 className="header-title">DevFix AI</h1>
          <span className="live-status-pill">
            <SparklesIcon className="w-3.5 h-3.5" />
            Autonomous Mode
          </span>
        </div>
        <p className="header-subtitle">
          AI-powered autonomous software engineering & bug remediation platform
        </p>
      </div>

      <div className="header-actions">
        {user && (
          <div className="user-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '8px' }}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-indigo)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{user.name}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{user.email}</span>
            </div>
          </div>
        )}

        {githubStatus?.connected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--accent-emerald)'
            }}>
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
              <span>GitHub Connected (@{githubStatus.username})</span>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onDisconnectGithub}
              type="button"
              style={{ fontSize: '11px', color: 'var(--text-muted)' }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button 
            className="btn btn-secondary" 
            onClick={onConnectGithub}
            type="button"
          >
            <GithubIcon />
            <span>Connect GitHub</span>
          </button>
        )}

        <button 
          className="btn btn-primary" 
          onClick={onNewInvestigation}
          type="button"
        >
          <PlusIcon />
          <span>New Investigation</span>
        </button>

        {user && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={logout}
            type="button"
            title="Log out"
            style={{ color: '#ef4444' }}
          >
            Logout
          </button>
        )}
      </div>
    </header>
  )
}
