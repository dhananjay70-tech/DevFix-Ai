import React, { useState } from 'react'
import { LayersIcon, ChevronRightIcon, CheckCircleIcon, ActivityIcon, ClockIcon, AlertCircleIcon, SparklesIcon, BotIcon } from './Icons'

const PIPELINE_STAGES = [
  { id: 'repo', label: 'Repository Context', agent: 'Repository Analyzer', minProgress: 10 },
  { id: 'detection', label: 'Issue Detection', agent: 'Supervisor', minProgress: 20 },
  { id: 'localization', label: 'Code Localization', agent: 'Code Localizer', minProgress: 35 },
  { id: 'root_cause', label: 'Root Cause Analysis', agent: 'Root Cause Agent', minProgress: 50 },
  { id: 'fix_generation', label: 'Fix Generation', agent: 'Code/Fix Agent', minProgress: 65 },
  { id: 'testing', label: 'Testing & Verification', agent: 'Test Agent', minProgress: 80 },
  { id: 'security', label: 'Security Review', agent: 'Security Agent', minProgress: 90 },
  { id: 'human_approval', label: 'Human Approval', agent: 'Review Gate', minProgress: 95 },
  { id: 'pull_request', label: 'Pull Request', agent: 'Finalize Agent', minProgress: 100 }
]

export default function InvestigationPipeline({ investigations = [], onViewInvestigation }) {
  const [selectedId, setSelectedId] = useState(null)

  // Default to active or most recent investigation
  const activeInvestigation = investigations.find(i => i.status === 'RUNNING' || i.status === 'NEEDS_APPROVAL') || investigations[0]
  const current = (selectedId ? investigations.find(i => i.id === selectedId) : null) || activeInvestigation

  const getStageStatus = (stage, inv) => {
    if (!inv) return 'not_started'
    const progress = Number(inv.progress) || 0
    const status = inv.status

    if (status === 'FAILED' && progress >= stage.minProgress - 15 && progress < stage.minProgress + 10) {
      return 'failed'
    }
    if (progress >= stage.minProgress) {
      return 'completed'
    }
    if (progress >= stage.minProgress - 15) {
      if (stage.id === 'human_approval' && status === 'NEEDS_APPROVAL') return 'waiting'
      return status === 'RUNNING' ? 'running' : 'waiting'
    }
    return 'not_started'
  }

  const getStageBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="stage-badge-pill completed"><CheckCircleIcon className="w-3 h-3" /> Done</span>
      case 'running':
        return <span className="stage-badge-pill running"><ActivityIcon className="w-3 h-3" /> Running</span>
      case 'waiting':
        return <span className="stage-badge-pill waiting"><ClockIcon className="w-3 h-3" /> Waiting</span>
      case 'failed':
        return <span className="stage-badge-pill failed"><AlertCircleIcon className="w-3 h-3" /> Failed</span>
      default:
        return <span className="stage-badge-pill not-started">Pending</span>
    }
  }

  return (
    <div className="card investigation-pipeline-card">
      <div className="card-header">
        <div className="header-left">
          <div className="section-icon-badge">
            <LayersIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="card-title">Investigation Pipeline</h2>
            <p className="card-subtitle">End-to-end autonomous debugging lifecycle from ingestion to merged PR</p>
          </div>
        </div>
        {investigations.length > 0 && (
          <div className="pipeline-selector-wrap">
            <select
              className="pipeline-select-input"
              value={current?.id || ''}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {investigations.slice(0, 8).map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.repositoryFullName} #{inv.issueNumber} ({inv.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!current ? (
        <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No active or past investigations to display. Select an issue from any repository to launch the pipeline.
        </div>
      ) : (
        <div className="pipeline-container">
          <div className="pipeline-banner-header">
            <div className="pipeline-target-info">
              <span className="pipeline-repo-tag">{current.repositoryFullName}</span>
              <span className="pipeline-issue-pill">Issue #{current.issueNumber}</span>
              <span className="pipeline-issue-title-snippet">"{current.issueTitle}"</span>
            </div>
            <div className="pipeline-progress-meta">
              <span className="pipeline-progress-val">{current.progress ?? 0}% Completed</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onViewInvestigation && onViewInvestigation(current)}
                type="button"
              >
                <span>Full Investigation View</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="pipeline-stepper-grid">
            {PIPELINE_STAGES.map((stage, idx) => {
              const stageStatus = getStageStatus(stage, current)
              return (
                <div key={stage.id} className={`pipeline-step-box status-${stageStatus}`}>
                  <div className="step-number-row">
                    <span className="step-num">0{idx + 1}</span>
                    {getStageBadge(stageStatus)}
                  </div>
                  <div className="step-title">{stage.label}</div>
                  <div className="step-agent-name font-mono">{stage.agent}</div>
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <div className="step-connector-line"></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
