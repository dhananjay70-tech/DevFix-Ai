import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { AlertCircleIcon } from '../components/Icons'
import * as api from '../services/api'

import InvestigationHeader from '../components/investigation/InvestigationHeader'
import InvestigationHero from '../components/investigation/InvestigationHero'
import FixVerificationCard from '../components/investigation/FixVerificationCard'
import AgentPipeline from '../components/investigation/AgentPipeline'
import LiveTerminal from '../components/investigation/LiveTerminal'
import RootCauseCard from '../components/investigation/RootCauseCard'
import FixGeneratorCard from '../components/investigation/FixGeneratorCard'
import DiffViewerEnhanced from '../components/investigation/DiffViewerEnhanced'
import TestResultsPanel from '../components/investigation/TestResultsPanel'
import SecurityAuditCard from '../components/investigation/SecurityAuditCard'
import ErrorCenter from '../components/investigation/ErrorCenter'
import InvestigationAnalytics from '../components/investigation/InvestigationAnalytics'
import AiActivityTimeline from '../components/investigation/AiActivityTimeline'
import RepoExplorerModal from '../components/investigation/RepoExplorerModal'
import AiChatAssistant from '../components/investigation/AiChatAssistant'

const ACTIVE_STATUSES = ['PENDING', 'RUNNING']

export default function InvestigationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useOutletContext()
  const [investigation, setInvestigation] = useState(null)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [isExplorerOpen, setIsExplorerOpen] = useState(false)

  const load = useCallback(() => {
    api.getInvestigation(id)
      .then(res => setInvestigation(res.data))
      .catch(err => setError(err.message))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // Live auto-polling during execution
  useEffect(() => {
    if (!investigation || !ACTIVE_STATUSES.includes(investigation.status)) return
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [investigation, load])

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await api.approveInvestigation(id)
      showToast('Approval recorded. Finalizing branch push and pull request...')
      load()
    } catch (err) {
      showToast(`Failed to approve: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    setActionLoading(true)
    try {
      await api.rejectInvestigation(id)
      showToast('Investigation stopped.')
      load()
    } catch (err) {
      showToast(`Failed to stop: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRetry = async () => {
    setActionLoading(true)
    try {
      await api.retryInvestigation(id)
      showToast('Investigation restarted. Launching LangGraph agent...')
      load()
    } catch (err) {
      showToast(`Failed to restart: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleScrollToDiff = () => {
    const el = document.getElementById('diff-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '32px' }}>
        <div className="auth-alert error-alert">
          <AlertCircleIcon className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }} onClick={() => navigate('/investigations')} type="button">
          ← Back to Investigations
        </button>
      </div>
    )
  }

  if (!investigation) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Connecting to LangGraph agent thread...
      </div>
    )
  }

  const canApprove = investigation.status === 'NEEDS_APPROVAL'

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. Header */}
      <InvestigationHeader
        investigation={investigation}
        onRetry={handleRetry}
        onReject={handleReject}
        onRefresh={load}
        loading={actionLoading}
      />

      {/* 2. Overview Hero */}
      <InvestigationHero investigation={investigation} />

      {/* 3. Verification / PR Callout */}
      <FixVerificationCard
        investigation={investigation}
        onApprove={handleApprove}
        onReject={handleReject}
        actionLoading={actionLoading}
      />

      {/* 4. Multi-Agent Pipeline */}
      <AgentPipeline investigation={investigation} />

      {/* 5. Live Monospace Terminal */}
      <LiveTerminal investigation={investigation} />

      {/* 6. Root Cause Card */}
      <RootCauseCard
        investigation={investigation}
        onScrollToDiff={handleScrollToDiff}
        onOpenExplorer={() => setIsExplorerOpen(true)}
      />

      {/* 7. AI Fix Generator Card */}
      <FixGeneratorCard
        investigation={investigation}
        onScrollToDiff={handleScrollToDiff}
      />

      {/* 8. Unified Code Diff */}
      <DiffViewerEnhanced
        diffText={investigation.proposedFix}
        onAccept={handleApprove}
        onReject={handleReject}
        actionLoading={actionLoading}
        canApprove={canApprove}
      />

      {/* 9. Sandbox Test Results */}
      <TestResultsPanel
        investigation={investigation}
        onRunTests={load}
      />

      {/* 10. Security Audit */}
      <SecurityAuditCard investigation={investigation} />

      {/* 11. Error Center */}
      <ErrorCenter investigation={investigation} />

      {/* 12. Impact & Analytics */}
      <InvestigationAnalytics investigation={investigation} />

      {/* 13. Timeline */}
      <AiActivityTimeline investigation={investigation} />

      {/* 14. Repository Explorer Modal */}
      <RepoExplorerModal
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        repositoryFullName={investigation.repositoryFullName}
        affectedFiles={investigation.affectedFiles || []}
      />

      {/* 15. Floating AI Chat Assistant */}
      <AiChatAssistant investigation={investigation} />
    </div>
  )
}
