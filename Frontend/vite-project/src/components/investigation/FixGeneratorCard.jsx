import React from 'react'
import { SparklesIcon, CheckCircleIcon, GitBranchIcon } from '../Icons'
import ExplainButton from '../assistant/ExplainButton'

export default function FixGeneratorCard({ investigation, onScrollToDiff }) {
  const confidence = investigation?.confidence
    ? Math.round(Number(investigation.confidence) * 100)
    : 94

  const hasFix = Boolean(investigation?.proposedFix || investigation?.pullRequest)
  const filesCount = Array.isArray(investigation?.affectedFiles) && investigation.affectedFiles.length > 0
    ? investigation.affectedFiles.length
    : 1

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c084fc'
          }}>
            <SparklesIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              AI Fix Generator & Patch Synthesis
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Synthesized by LangGraph Fix Generator Agent
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            ESTIMATED RISK: LOW
          </span>
          <span className="confidence-pill">
            <SparklesIcon className="w-3 h-3" />
            <span>Confidence: {confidence}%</span>
          </span>
          <ExplainButton
            title={`Proposed Patch for #${investigation?.issueNumber}`}
            data={investigation}
            type="AI Code Patch"
            size="xs"
          />
        </div>
      </div>


      <div style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
              Target Defect
            </span>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>
              {investigation?.issueTitle || 'Identified Defect'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
              Synthesized Strategy
            </span>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Defensive parameter guards & null-safety validation logic
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
              Files Changed
            </span>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {filesCount} file(s)
            </div>
          </div>
        </div>

        {hasFix && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onScrollToDiff}
              type="button"
            >
              <span>Preview Diff Details ↓</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
