import React, { useState } from 'react'
import { GitBranchIcon, SparklesIcon, CheckCircleIcon } from '../Icons'

export default function DiffViewerEnhanced({ diffText, onAccept, onReject, actionLoading, canApprove }) {
  const [copied, setCopied] = useState(false)

  if (!diffText || !diffText.trim()) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        marginBottom: '24px',
        color: 'var(--text-muted)',
        textAlign: 'center',
        fontSize: '13px'
      }}>
        Code patch synthesis in progress by LangGraph Fix Generator…
      </div>
    )
  }

  const lines = diffText.split('\n')
  const addedCount = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length
  const removedCount = lines.filter(l => l.startsWith('-') && !l.startsWith('---')).length

  const handleCopy = () => {
    navigator.clipboard.writeText(diffText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div id="diff-section" style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-indigo)'
          }}>
            <GitBranchIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Synthesized Code Patch & Unified Git Diff
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Verified against sandbox test suite before commit
            </span>
          </div>
        </div>

        {/* Diff Metrics & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
            +{addedCount} lines
          </span>
          <span style={{ fontSize: '12px', color: '#f87171', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
            -{removedCount} lines
          </span>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
            type="button"
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            {copied ? '✓ Copied Diff' : 'Copy Diff'}
          </button>
        </div>
      </div>

      {/* Formatted Diff Container */}
      <div style={{
        backgroundColor: '#07090e',
        border: '1px solid #1e2433',
        borderRadius: 'var(--radius-sm)',
        overflowX: 'auto',
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        fontSize: '12px',
        lineHeight: '1.5',
        padding: '12px 0',
        marginBottom: canApprove ? '16px' : '0'
      }}>
        {lines.map((line, idx) => {
          let bg = 'transparent'
          let color = '#cbd5e1'
          if (line.startsWith('+') && !line.startsWith('+++')) {
            bg = 'rgba(16, 185, 129, 0.15)'
            color = '#6ee7b7'
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            bg = 'rgba(239, 68, 68, 0.15)'
            color = '#fca5a5'
          } else if (line.startsWith('@@')) {
            bg = 'rgba(99, 102, 241, 0.12)'
            color = '#93c5fd'
          } else if (line.startsWith('diff --git') || line.startsWith('index ')) {
            color = '#64748b'
          }

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                backgroundColor: bg,
                padding: '1px 16px',
                whiteSpace: 'pre',
                minWidth: 'fit-content'
              }}
            >
              <span style={{ width: '40px', color: '#475569', userSelect: 'none', textAlign: 'right', paddingRight: '16px' }}>
                {idx + 1}
              </span>
              <span style={{ color }}>{line || ' '}</span>
            </div>
          )
        })}
      </div>

      {/* Human Review Actions below diff */}
      {canApprove && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontWeight: '600', color: '#34d399', fontSize: '14px', marginBottom: '2px' }}>
              Human Verification & Authorization
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Approve this verified patch to create a Git branch and open a real Pull Request.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={onAccept}
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
      )}
    </div>
  )
}
