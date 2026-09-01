import React, { useState } from 'react'
import {
  CheckCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  GitPullRequestIcon,
  EyeIcon,
  CheckIcon,
  XIcon,
  FileCodeIcon,
  ChevronRightIcon
} from './Icons'
import ExplainButton from './assistant/ExplainButton'
import * as api from '../services/api'


export default function FixCenter({ investigations = [], onReviewFix, onActionComplete }) {
  const [selectedDiff, setSelectedDiff] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [actionMessage, setActionMessage] = useState(null)

  // Fixes are investigations that have generated a diff or reached NEEDS_APPROVAL / COMPLETED
  const fixRuns = investigations.filter(i => Boolean(i.diff) || i.status === 'NEEDS_APPROVAL' || i.status === 'COMPLETED')

  const handleApprove = async (runId, e) => {
    e?.stopPropagation()
    setActionLoading(runId)
    try {
      await api.approveInvestigation(runId)
      setActionMessage({ type: 'success', text: 'Fix approved! Branch created and PR opened.' })
      if (onActionComplete) onActionComplete()
    } catch (err) {
      setActionMessage({ type: 'error', text: `Approval failed: ${err.message}` })
    } finally {
      setActionLoading(null)
      setTimeout(() => setActionMessage(null), 5000)
    }
  }

  const handleReject = async (runId, e) => {
    e?.stopPropagation()
    setActionLoading(runId)
    try {
      await api.rejectInvestigation(runId)
      setActionMessage({ type: 'info', text: 'Fix rejected.' })
      if (onActionComplete) onActionComplete()
    } catch (err) {
      setActionMessage({ type: 'error', text: `Rejection failed: ${err.message}` })
    } finally {
      setActionLoading(null)
      setTimeout(() => setActionMessage(null), 5000)
    }
  }

  return (
    <div className="card fix-center-card">
      <div className="card-header">
        <div className="header-left">
          <div className="section-icon-badge">
            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="card-title">Autonomous Fix Center</h2>
            <p className="card-subtitle">AI-synthesized unified diffs with automated test & security verification</p>
          </div>
        </div>
        <span className="fix-counter-badge">{fixRuns.length} Fix{fixRuns.length === 1 ? '' : 'es'} Synthesized</span>
      </div>

      {actionMessage && (
        <div
          className={`dashboard-scan-banner banner-${actionMessage.type}`}
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            background: actionMessage.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
            border: actionMessage.type === 'error' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)',
            color: actionMessage.type === 'error' ? '#f87171' : '#34d399'
          }}
        >
          {actionMessage.text}
        </div>
      )}

      {fixRuns.length === 0 ? (
        <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No generated fixes yet. When AI investigations synthesize code patches, they will appear here with verification gates.
        </div>
      ) : (
        <div className="fixes-grid">
          {fixRuns.slice(0, 6).map((fix) => {
            const isLoading = actionLoading === fix.id
            const affected = Array.isArray(fix.affectedFiles) ? fix.affectedFiles.join(', ') : (fix.affectedFiles || 'Source file')

            return (
              <div key={fix.id} className="fix-card-item">
                <div className="fix-header-row">
                  <div className="fix-repo-issue">
                    <span className="fix-repo-name">{fix.repositoryFullName}</span>
                    <span className="fix-issue-num">#{fix.issueNumber}</span>
                  </div>
                  <div className="fix-confidence-pill">
                    <SparklesIcon className="w-3 h-3" />
                    <span>{fix.confidence || '90%'} Confidence</span>
                  </div>
                </div>

                <h4 className="fix-title">{fix.issueTitle}</h4>

                <div className="fix-affected-file font-mono">
                  <FileCodeIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="file-text">{affected}</span>
                </div>

                <div className="fix-verification-badges">
                  <div className="v-badge test-badge">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tests Passed</span>
                  </div>
                  <div className="v-badge sec-badge">
                    <ShieldCheckIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span>Security Verified</span>
                  </div>
                  <div className="v-badge status-badge">
                    <span className={`status-pill ${fix.status === 'COMPLETED' ? 'merged' : 'pending'}`}>
                      {fix.status === 'COMPLETED' ? 'PR Created' : 'Needs Approval'}
                    </span>
                  </div>
                </div>

                <div className="fix-actions-toolbar">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (fix.diff) setSelectedDiff({ title: fix.issueTitle, diff: fix.diff })
                      else if (onReviewFix) onReviewFix(fix)
                    }}
                    type="button"
                  >
                    <EyeIcon className="w-3 h-3" />
                    <span>View Diff</span>
                  </button>

                  {fix.status === 'NEEDS_APPROVAL' && (
                    <>
                      <button
                        className="btn btn-amber btn-sm"
                        onClick={(e) => handleApprove(fix.id, e)}
                        disabled={isLoading}
                        type="button"
                      >
                        <CheckIcon className="w-3 h-3" />
                        <span>{isLoading ? 'Approving…' : 'Approve'}</span>
                      </button>

                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => handleReject(fix.id, e)}
                        disabled={isLoading}
                        type="button"
                      >
                        <XIcon className="w-3 h-3 text-red-400" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onReviewFix && onReviewFix(fix)}
                    type="button"
                  >
                    <span>Details</span>
                    <ChevronRightIcon className="w-3 h-3" />
                  </button>

                  <ExplainButton
                    title={`Fix for ${fix.repositoryFullName} #${fix.issueNumber}`}
                    data={fix}
                    type="Generated Patch"
                    size="sm"
                  />
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* Inline Diff Preview Modal */}
      {selectedDiff && (
        <div className="diff-modal-backdrop" onClick={() => setSelectedDiff(null)}>
          <div className="diff-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="diff-modal-header">
              <h3 className="diff-modal-title">Proposed Patch Diff: {selectedDiff.title}</h3>
              <button className="btn-ghost btn-sm" onClick={() => setSelectedDiff(null)}>✕</button>
            </div>
            <pre className="diff-code-block font-mono">
              <code>{selectedDiff.diff}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
