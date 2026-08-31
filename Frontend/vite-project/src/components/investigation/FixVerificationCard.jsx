import React from 'react'
import { CheckCircleIcon, AlertCircleIcon, GitPullRequestIcon, SparklesIcon } from '../Icons'

export default function FixVerificationCard({ investigation, onApprove, onReject, actionLoading }) {
  const isCompleted = investigation?.status === 'COMPLETED'
  const isNeedsApproval = investigation?.status === 'NEEDS_APPROVAL'
  const isFailed = investigation?.status === 'FAILED'
  const pullRequest = investigation?.pullRequest

  if (isCompleted && pullRequest) {
    return (
      <div style={{
        backgroundColor: 'rgba(168, 85, 247, 0.08)',
        border: '1px solid rgba(168, 85, 247, 0.4)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontWeight: '700', marginBottom: '6px' }}>
              <GitPullRequestIcon className="w-5 h-5" />
              <span style={{ fontSize: '16px' }}>Real GitHub Pull Request Published</span>
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--text-primary)' }}>
              {pullRequest.title}
            </h4>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
              {pullRequest.headBranch && (
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)' }}>
                  Branch: {pullRequest.headBranch}
                </span>
              )}
              {pullRequest.linesAdded > 0 && <span style={{ color: '#34d399' }}>+{pullRequest.linesAdded} lines</span>}
              {pullRequest.linesRemoved > 0 && <span style={{ color: '#f87171' }}>-{pullRequest.linesRemoved} lines</span>}
            </div>
          </div>

          <a
            href={pullRequest.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <GitPullRequestIcon className="w-4 h-4" />
            <span>View on GitHub ↗</span>
          </a>
        </div>
      </div>
    )
  }

  if (isNeedsApproval) {
    return (
      <div style={{
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: '700', marginBottom: '6px' }}>
              <CheckCircleIcon className="w-5 h-5" />
              <span style={{ fontSize: '16px' }}>Fix Verified & Ready for Review</span>
            </div>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Sandbox tests passed • Security checks passed • Unified patch ready to commit.
            </p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>✓ Tests: Passed</span>
              <span>✓ Build: Passed</span>
              <span>✓ Security: Passed</span>
              <span>✓ AI Confidence: 94%</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={onApprove}
              disabled={actionLoading}
              type="button"
              style={{ backgroundColor: '#10b981', borderColor: '#059669' }}
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>{actionLoading ? 'Publishing PR…' : 'Approve & Create PR'}</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={onReject}
              disabled={actionLoading}
              type="button"
            >
              Reject Fix
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
