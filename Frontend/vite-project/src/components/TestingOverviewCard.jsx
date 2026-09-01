import React from 'react'
import { CheckCircleIcon, AlertCircleIcon, PlayIcon, TerminalIcon } from './Icons'
import ExplainButton from './assistant/ExplainButton'

function timeAgo(dateString) {
  if (!dateString) return 'No runs yet'
  const diffMs = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function TestingOverviewCard({ stats, onRunTests }) {
  const passed = stats?.testsPassed ?? 0
  const failed = stats?.testsFailed ?? 0
  const coverage = stats?.testCoverage
  const lastRun = stats?.lastTestRun
  const failingNames = stats?.failingTestNames || []

  return (
    <div className="card testing-overview-card">
      <div className="card-header">
        <div className="header-left">
          <div className="section-icon-badge">
            <TerminalIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="card-title">Sandbox Testing & Verification</h2>
            <p className="card-subtitle">Automated pytest, jest & integration assertions</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="test-coverage-badge">
            <span className="coverage-label">Coverage:</span>
            <span className="coverage-val">{coverage !== null && coverage !== undefined ? `${coverage}%` : 'Sandbox Managed'}</span>
          </div>
          <ExplainButton
            title="Sandbox Test Results"
            data={stats}
            type="Test Suite Status"
            size="xs"
          />
        </div>
      </div>

      <div className="testing-stats-grid">
        <div className="test-stat-box passed">
          <div className="test-stat-icon-wrap">
            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="test-stat-count">{passed}</span>
            <span className="test-stat-label">Tests Passed</span>
          </div>
        </div>

        <div className="test-stat-box failed">
          <div className="test-stat-icon-wrap">
            <AlertCircleIcon className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="test-stat-count">{failed}</span>
            <span className="test-stat-label">Tests Failing</span>
          </div>
        </div>
      </div>

      {failingNames.length > 0 ? (
        <div className="failing-tests-list">
          <span className="failing-title">Failing Assertions:</span>
          <div className="failing-tags-wrap font-mono">
            {failingNames.slice(0, 4).map((name, idx) => (
              <span key={idx} className="failing-test-pill">✕ {name}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="tests-clean-note">
          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>All active test suites passing in sandbox verification environment.</span>
        </div>
      )}

      <div className="testing-footer-row">
        <div className="test-last-run">
          <span className="label">Last Executed:</span>
          <span className="val">{timeAgo(lastRun)}</span>
        </div>
        {onRunTests && (
          <button className="btn btn-secondary btn-sm" onClick={onRunTests} type="button">
            <PlayIcon className="w-3 h-3" />
            <span>Run Tests</span>
          </button>
        )}
      </div>
    </div>
  )
}

