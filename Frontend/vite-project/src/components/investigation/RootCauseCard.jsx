import React from 'react'
import { AlertCircleIcon, BotIcon, SparklesIcon, FolderIcon } from '../Icons'

export default function RootCauseCard({ investigation, onScrollToDiff, onOpenExplorer }) {
  const rootCause = investigation?.rootCause
  const affectedFile = Array.isArray(investigation?.affectedFiles) && investigation.affectedFiles.length > 0
    ? investigation.affectedFiles[0]
    : 'Identified repository source file'

  const confidence = investigation?.confidence
    ? Math.round(Number(investigation.confidence) * 100)
    : 92

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24'
          }}>
            <BotIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Root Cause Analysis
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Diagnosed by LangGraph Root Cause Agent
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            SEVERITY: HIGH
          </span>
          <span className="confidence-pill">
            <SparklesIcon className="w-3 h-3" />
            <span>Confidence: {confidence}%</span>
          </span>
        </div>
      </div>

      {rootCause ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 16px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Primary Diagnostic Summary
            </div>
            <p style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
              {rootCause}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                AFFECTED FILE
              </span>
              <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo)', fontWeight: '600' }}>
                {affectedFile}
              </span>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                RECOMMENDED RESOLUTION
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Apply synthesized parameter validation & safe error boundary patch.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onOpenExplorer}
              type="button"
            >
              <FolderIcon className="w-3.5 h-3.5" />
              <span>Explore File Tree</span>
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={onScrollToDiff}
              type="button"
            >
              <span>View Proposed Diff ↓</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Root cause analysis in progress by LangGraph agent…
        </div>
      )}
    </div>
  )
}
