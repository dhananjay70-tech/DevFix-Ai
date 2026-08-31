import React, { useState, useEffect } from 'react'
import {
  SparklesIcon,
  ActivityIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  GitPullRequestIcon,
  ClockIcon,
  BotIcon
} from '../Icons'

export default function InvestigationHeader({
  investigation,
  onRetry,
  onReject,
  onRefresh,
  loading
}) {
  const [elapsed, setElapsed] = useState('00m 00s')

  useEffect(() => {
    if (!investigation?.startedAt) return

    const updateTimer = () => {
      const start = new Date(investigation.startedAt).getTime()
      const end = investigation.completedAt ? new Date(investigation.completedAt).getTime() : Date.now()
      const diffSec = Math.max(0, Math.floor((end - start) / 1000))
      const mins = String(Math.floor(diffSec / 60)).padStart(2, '0')
      const secs = String(diffSec % 60).padStart(2, '0')
      setElapsed(`${mins}m ${secs}s`)
    }

    updateTimer()
    if (!investigation.completedAt) {
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [investigation?.startedAt, investigation?.completedAt])

  const status = investigation?.status || 'RUNNING'
  const isLive = status === 'RUNNING' || status === 'PENDING'
  const confidence = investigation?.confidence
    ? Math.round(Number(investigation.confidence) * 100)
    : 88

  const getStatusBadge = () => {
    switch (status) {
      case 'COMPLETED':
        return { label: 'COMPLETED', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '#059669' }
      case 'NEEDS_APPROVAL':
        return { label: 'NEEDS APPROVAL', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '#d97706' }
      case 'FAILED':
        return { label: 'FAILED', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '#dc2626' }
      default:
        return { label: 'INVESTIGATING', bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '#6366f1' }
    }
  }

  const badge = getStatusBadge()

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      marginBottom: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--accent-indigo)'
            }}>
              <BotIcon className="w-3.5 h-3.5" />
              <span>DevFix AI Autonomous Agent</span>
            </div>

            {isLive && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 8px',
                borderRadius: '999px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '11px',
                fontWeight: '600',
                color: '#34d399'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px #10b981'
                }}></span>
                <span>LIVE EXECUTION</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-mono)' }}>
              {investigation?.repositoryFullName || 'Repository'}
            </h1>
            <span style={{
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--accent-indigo)',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: 'var(--font-mono)'
            }}>
              Issue #{investigation?.issueNumber || '1'}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            "{investigation?.issueTitle || 'Automated Code Issue Investigation'}"
          </p>
        </div>

        {/* Status & Actions Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Status Pill */}
            <span style={{
              backgroundColor: badge.bg,
              color: badge.color,
              border: `1px solid ${badge.border}`,
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.05em'
            }}>
              {badge.label}
            </span>

            {/* AI Confidence */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>AI Confidence: {confidence}%</span>
            </span>

            {/* Duration Timer */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '500',
              fontFamily: 'var(--font-mono)'
            }}>
              <ClockIcon className="w-3.5 h-3.5" />
              <span>{elapsed}</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onRefresh}
              disabled={loading}
              type="button"
              title="Refresh investigation state"
            >
              ↻ Refresh
            </button>

            {status === 'FAILED' && (
              <button
                className="btn btn-primary btn-sm"
                onClick={onRetry}
                disabled={loading}
                type="button"
                style={{ backgroundColor: '#ef4444', borderColor: '#dc2626' }}
              >
                ↻ Retry Investigation
              </button>
            )}

            {isLive && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={onReject}
                disabled={loading}
                type="button"
                style={{ color: '#f87171' }}
              >
                ■ Stop Agent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
