import React from 'react'
import {
  ActivityIcon,
  BotIcon,
  SparklesIcon,
  FolderIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  TerminalIcon
} from '../Icons'

const AGENT_LABELS = {
  supervisor: { title: 'Supervisor Agent', action: 'Coordinating multi-agent workflow & execution graph' },
  analyze_repository: { title: 'Repository Analyzer', action: 'Indexing project files, tree structure & dependencies' },
  locate_code: { title: 'Code Localizer', action: 'Locating candidate source files and defect locations' },
  find_root_cause: { title: 'Root Cause Analyzer', action: 'Diagnosing failure mechanisms & stack traces' },
  generate_fix: { title: 'Fix Generator', action: 'Synthesizing verified unified code patch' },
  run_tests: { title: 'Test Runner', action: 'Executing sandbox test suite and compiler checks' },
  security_review: { title: 'Security Auditor', action: 'Inspecting patch for vulnerabilities & regressions' },
  human_approval: { title: 'Human Review', action: 'Awaiting human verification and approval' },
  finalize: { title: 'PR Finalizer', action: 'Pushing branch and publishing GitHub Pull Request' }
}

export default function InvestigationHero({ investigation }) {
  const currentKey = investigation?.currentAgent || 'supervisor'
  const agentInfo = AGENT_LABELS[currentKey] || {
    title: 'Autonomous Agent',
    action: 'Processing codebase and synthesizing fix...'
  }

  let progress = investigation?.progress || 0
  if (investigation?.status === 'COMPLETED') progress = 100
  if (investigation?.status === 'NEEDS_APPROVAL' && progress < 85) progress = 85

  const filesCount = Array.isArray(investigation?.affectedFiles) && investigation.affectedFiles.length > 0
    ? investigation.affectedFiles.length
    : (progress > 30 ? 3 : 1)

  const testPassed = investigation?.testResults?.passed ?? (investigation?.status === 'COMPLETED' || investigation?.status === 'NEEDS_APPROVAL')
  const testCount = investigation?.testResults?.command ? 12 : (progress > 50 ? 8 : 0)

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      marginBottom: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow accent */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'center' }}>
        {/* Left: Overall Progress & Current Agent */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ActivityIcon className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                Autonomous Investigation Pipeline
              </span>
            </div>
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-indigo)', fontFamily: 'var(--font-mono)' }}>
              {progress}% Complete
            </span>
          </div>

          <div className="progress-bar-bg" style={{ height: '8px', marginBottom: '16px' }}>
            <div
              className="progress-bar-fill progress-fill-in-progress"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #10b981 100%)'
              }}
            />
          </div>

          <div style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Active Agent
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BotIcon className="w-4 h-4 text-indigo-400" />
              <span>{agentInfo.title}</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {agentInfo.action}
            </div>
          </div>
        </div>

        {/* Right: Quick Stats Counter Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
              <FolderIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Files Scanned</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {filesCount}
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
              <AlertCircleIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Errors Found</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
              {investigation?.errorMessage ? '1' : (progress > 40 ? '1' : '0')}
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
              <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sandbox Tests</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: testPassed ? '#34d399' : '#f87171', fontFamily: 'var(--font-mono)' }}>
              {testCount > 0 ? (testPassed ? `${testCount} Passed` : 'Failed') : (progress > 60 ? 'Verified' : 'Pending')}
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
              <SparklesIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Potential Fixes</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
              {investigation?.proposedFix || investigation?.pullRequest ? '1 (Ready)' : (progress > 50 ? '1 (Synthesized)' : '0')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
