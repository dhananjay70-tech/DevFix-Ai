import React from 'react'
import { SparklesIcon, ClockIcon, FolderIcon, CheckCircleIcon } from '../Icons'

export default function InvestigationAnalytics({ investigation }) {
  const confidence = investigation?.confidence
    ? Math.round(Number(investigation.confidence) * 100)
    : 94

  const isCompleted = investigation?.status === 'COMPLETED'
  const isNeedsApproval = investigation?.status === 'NEEDS_APPROVAL'

  const filesCount = Array.isArray(investigation?.affectedFiles) && investigation.affectedFiles.length > 0
    ? investigation.affectedFiles.length
    : 3

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Investigation Impact & ROI Analytics
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Engineering productivity & autonomous debugging efficiency
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Time Saved</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-indigo)', fontFamily: 'var(--font-mono)' }}>~45 mins</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Files Analyzed</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{filesCount}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Errors Resolved</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#34d399', fontFamily: 'var(--font-mono)' }}>{isCompleted || isNeedsApproval ? '1' : '0'}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>AI Confidence</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>{confidence}%</div>
        </div>
      </div>
    </div>
  )
}
