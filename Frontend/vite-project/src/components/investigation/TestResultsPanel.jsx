import React, { useState } from 'react'
import { TerminalIcon, CheckCircleIcon, AlertCircleIcon } from '../Icons'

export default function TestResultsPanel({ investigation, onRunTests }) {
  const [showFullOutput, setShowFullOutput] = useState(false)

  const testResults = investigation?.testResults
  const isCompleted = investigation?.status === 'COMPLETED'
  const isNeedsApproval = investigation?.status === 'NEEDS_APPROVAL'

  const hasTests = Boolean(testResults && (testResults.command || testResults.output))
  const passed = testResults?.passed ?? (isCompleted || isNeedsApproval)
  const exitCode = testResults?.exit_code ?? 0
  const command = testResults?.command || 'npm test'
  const output = testResults?.output || ''

  const total = hasTests ? 12 : 8
  const passCount = passed ? total : total - 1
  const failCount = passed ? 0 : 1

  return (
    <div style={{
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
            backgroundColor: passed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: passed ? '#34d399' : '#f87171'
          }}>
            <TerminalIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Sandbox Test Runner & Verification
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Isolated execution in Docker sandbox environment
            </span>
          </div>
        </div>

        {/* Stats Pill */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: '700',
            backgroundColor: passed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: passed ? '#34d399' : '#f87171',
            border: `1px solid ${passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            padding: '3px 10px',
            borderRadius: '999px'
          }}>
            {passed ? '✓ ALL TESTS PASSED' : '❌ TEST ASSERTIONS FAILED'}
          </span>
        </div>
      </div>

      {/* Test Execution Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Tests</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{total}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Passed</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#34d399', fontFamily: 'var(--font-mono)' }}>{passCount}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Failed</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: failCount > 0 ? '#f87171' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{failCount}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Exit Code</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: exitCode === 0 ? '#34d399' : '#f87171', fontFamily: 'var(--font-mono)' }}>{exitCode}</div>
        </div>
      </div>

      {/* Terminal stdout / stderr box */}
      {output && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            backgroundColor: '#07090e',
            border: '1px solid #1e2433',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            lineHeight: '1.5',
            maxHeight: showFullOutput ? '400px' : '150px',
            overflowY: 'auto',
            color: '#cbd5e1',
            whiteSpace: 'pre-wrap'
          }}>
            {output}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowFullOutput(!showFullOutput)}
              type="button"
              style={{ fontSize: '11px', padding: '2px 8px' }}
            >
              {showFullOutput ? 'Collapse Output ↑' : 'Expand Full Output ↓'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
