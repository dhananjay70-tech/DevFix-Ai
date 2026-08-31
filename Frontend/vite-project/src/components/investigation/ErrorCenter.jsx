import React, { useState } from 'react'
import { AlertCircleIcon, SparklesIcon, CheckCircleIcon } from '../Icons'

export default function ErrorCenter({ investigation, onAskAi }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  const hasTestError = investigation?.testResults && !investigation.testResults.passed
  const hasSystemError = Boolean(investigation?.errorMessage)
  const isCompleted = investigation?.status === 'COMPLETED'

  const errors = []

  if (hasSystemError) {
    errors.push({
      id: 'err-1',
      type: 'Runtime Error',
      category: 'Runtime',
      severity: 'CRITICAL',
      message: investigation.errorMessage,
      file: Array.isArray(investigation.affectedFiles) && investigation.affectedFiles[0] ? investigation.affectedFiles[0] : 'System/Sandbox',
      agent: 'Supervisor / Sandbox',
      status: isCompleted ? 'RESOLVED' : 'ACTIVE'
    })
  }

  if (hasTestError) {
    errors.push({
      id: 'err-2',
      type: 'Test Assertion Failure',
      category: 'Test Failures',
      severity: 'HIGH',
      message: `Test runner exited with failure status (exit code ${investigation.testResults?.exit_code || 1})`,
      file: 'tests/suite',
      agent: 'Test Runner',
      status: isCompleted ? 'RESOLVED' : 'ACTIVE'
    })
  }

  if (investigation?.rootCause && errors.length === 0) {
    errors.push({
      id: 'err-3',
      type: 'Localized Defect',
      category: 'Runtime',
      severity: 'HIGH',
      message: investigation.rootCause,
      file: Array.isArray(investigation.affectedFiles) && investigation.affectedFiles[0] ? investigation.affectedFiles[0] : 'Source Code',
      agent: 'Root Cause Analyzer',
      status: isCompleted ? 'RESOLVED' : 'PATCH_PREPARED'
    })
  }

  const criticalCount = errors.filter(e => e.severity === 'CRITICAL').length
  const highCount = errors.filter(e => e.severity === 'HIGH').length
  const mediumCount = errors.filter(e => e.severity === 'MEDIUM').length

  const filteredErrors = selectedCategory === 'ALL'
    ? errors
    : errors.filter(e => e.category === selectedCategory)

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
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f87171'
          }}>
            <AlertCircleIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Error Diagnostics Center
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Comprehensive failure taxonomy & defect tracking
            </span>
          </div>
        </div>

        {/* Severity Count Badges */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            🔴 {criticalCount} Critical
          </span>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            🟠 {highCount} High
          </span>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            🟡 {mediumCount} Medium
          </span>
        </div>
      </div>

      {errors.length === 0 ? (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <div style={{ color: '#34d399', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <CheckCircleIcon className="w-4 h-4" />
            <span>0 Active Errors • All Verification Checks Passed</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredErrors.map((err) => (
            <div
              key={err.id}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: err.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: err.severity === 'CRITICAL' ? '#f87171' : '#fbbf24'
                  }}>
                    {err.severity}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {err.type}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Detected by {err.agent}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {err.file}
                </div>

                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                  {err.message}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onAskAi && onAskAi(`Explain error in ${err.file}: ${err.message}`)}
                  type="button"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                >
                  <SparklesIcon className="w-3 h-3" />
                  <span>Ask AI</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
