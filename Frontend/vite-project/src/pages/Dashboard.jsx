import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import KpiSection from '../components/KpiSection'
import QuickActions from '../components/QuickActions'
import RepositoryHealth from '../components/RepositoryHealth'
import AgentActivityTimeline from '../components/AgentActivityTimeline'
import InvestigationPipeline from '../components/InvestigationPipeline'
import DetectedProblems from '../components/DetectedProblems'
import FixCenter from '../components/FixCenter'
import SecurityOverviewCard from '../components/SecurityOverviewCard'
import TestingOverviewCard from '../components/TestingOverviewCard'
import SystemStatus from '../components/SystemStatus'
import RecentInvestigations from '../components/RecentInvestigations'
import { RefreshIcon, SparklesIcon, GithubIcon } from '../components/Icons'
import * as api from '../services/api'

export default function Dashboard() {
  const { githubStatus, onConnectGithub } = useOutletContext()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [repos, setRepos] = useState([])
  const [investigations, setInvestigations] = useState([])
  const [activities, setActivities] = useState([])
  const [agents, setAgents] = useState([])
  const [detectedProblems, setDetectedProblems] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true)
    setError(null)

    try {
      const [statsRes, reposRes, invRes, actRes, agentRes] = await Promise.allSettled([
        api.getDashboardStats(),
        api.getGithubRepos(),
        api.getInvestigations(),
        api.getActivityLogs(),
        api.getAgentsStatus()
      ])

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
      if (reposRes.status === 'fulfilled') setRepos(Array.isArray(reposRes.value.data) ? reposRes.value.data : [])
      if (invRes.status === 'fulfilled') setInvestigations(Array.isArray(invRes.value.data) ? invRes.value.data : [])
      if (actRes.status === 'fulfilled') setActivities(Array.isArray(actRes.value.data) ? actRes.value.data : [])
      if (agentRes.status === 'fulfilled') setAgents(Array.isArray(agentRes.value.data) ? agentRes.value.data : [])

      // Synthesize detected problems from repositories with open issues or failed investigations
      const problemsList = []
      if (invRes.status === 'fulfilled' && Array.isArray(invRes.value.data)) {
        invRes.value.data.forEach((inv) => {
          if (inv.status === 'FAILED' || inv.status === 'NEEDS_APPROVAL' || inv.status === 'RUNNING') {
            problemsList.push({
              id: `prob-inv-${inv.id}`,
              severity: inv.status === 'FAILED' ? 'HIGH' : 'MEDIUM',
              title: inv.issueTitle,
              errorType: inv.rootCause ? 'Root Cause Identified' : 'Triage Required',
              file: Array.isArray(inv.affectedFiles) ? inv.affectedFiles[0] : null,
              explanation: inv.rootCause || inv.errorMessage || 'Active automated analysis in progress.',
              detectedAt: inv.createdAt,
              status: inv.status === 'RUNNING' ? 'INVESTIGATING' : 'OPEN',
              raw: inv
            })
          }
        })
      }

      // Add from repos if no investigation problems exist yet
      if (reposRes.status === 'fulfilled' && Array.isArray(reposRes.value.data)) {
        reposRes.value.data.forEach((r) => {
          if (r.openIssues > 0 && problemsList.length < 8) {
            problemsList.push({
              id: `prob-repo-${r.id}`,
              severity: r.openIssues > 5 ? 'HIGH' : 'MEDIUM',
              title: `${r.fullName}: ${r.openIssues} unresolved issue${r.openIssues === 1 ? '' : 's'}`,
              errorType: 'Repository Issue',
              file: `${r.fullName}/issues`,
              explanation: `Repository has ${r.openIssues} open issues requiring triage and automated verification.`,
              detectedAt: r.updatedAt,
              status: 'OPEN',
              repo: r
            })
          }
        })
      }

      setDetectedProblems(problemsList)
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('[DASHBOARD DATA FETCH ERROR]:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    // Periodic refresh every 10 seconds for real-time status
    const timer = setInterval(() => fetchDashboardData(true), 10000)
    return () => clearInterval(timer)
  }, [fetchDashboardData])

  const handleScanComplete = (scanResult) => {
    // Incorporate scan results into detected problems
    if (scanResult?.issues && Array.isArray(scanResult.issues)) {
      const mappedScanProblems = scanResult.issues.map((iss) => ({
        id: `scan-${iss.id}`,
        severity: iss.severity || 'HIGH',
        title: iss.title || iss.error_message,
        errorType: 'Code Bug & Vulnerability',
        file: iss.file,
        line: iss.line,
        explanation: iss.explanation || iss.evidence || iss.error_message,
        detectedAt: new Date().toISOString(),
        status: 'OPEN'
      }))
      setDetectedProblems(prev => [...mappedScanProblems, ...prev])
    }
    fetchDashboardData(true)
  }

  const handleInvestigateProblem = (prob) => {
    if (prob.raw) {
      navigate(`/investigations/${prob.raw.id}`)
    } else if (prob.repo) {
      navigate(`/repositories/${prob.repo.owner}/${prob.repo.name}/issues`)
    } else {
      navigate('/repositories')
    }
  }

  return (
    <div className="dashboard-page-container">
      {/* Dashboard Top Utility Bar */}
      <div className="dashboard-top-bar">
        <div className="top-bar-left">
          <div className="platform-brand-badge">
            <SparklesIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>DevFix Autonomous Engineering System</span>
          </div>
          <span className="last-sync-tag">
            Synced: {lastRefreshed.toLocaleTimeString()}
          </span>
        </div>

        <div className="top-bar-right">
          {githubStatus?.connected ? (
            <div className="github-connected-tag">
              <GithubIcon className="w-3.5 h-3.5" />
              <span>@{githubStatus.username}</span>
            </div>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={onConnectGithub} type="button">
              <GithubIcon className="w-3.5 h-3.5" />
              <span>Connect GitHub</span>
            </button>
          )}

          <button
            className={`btn btn-secondary btn-sm ${refreshing ? 'btn-refreshing' : ''}`}
            onClick={() => fetchDashboardData(false)}
            disabled={refreshing}
            type="button"
            title="Refresh dashboard data"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${refreshing ? 'spin-icon' : ''}`} />
            <span>{refreshing ? 'Syncing…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 1. TOP OVERVIEW */}
      <KpiSection
        stats={stats}
        loading={loading}
        error={error}
        onRetry={() => fetchDashboardData(false)}
      />

      {/* 10. QUICK ACTIONS */}
      <QuickActions
        onScanRepo={() => navigate('/repositories')}
        onRunTests={() => navigate('/repositories')}
        onRunSecurityScan={() => navigate('/repositories')}
      />

      {/* 4. INVESTIGATION PIPELINE */}
      <InvestigationPipeline
        investigations={investigations}
        onViewInvestigation={(item) => navigate(`/investigations/${item.id}`)}
      />

      {/* 5. DETECTED PROBLEMS / ISSUES */}
      <DetectedProblems
        problems={detectedProblems}
        onInvestigate={handleInvestigateProblem}
        onViewCode={(prob) => {
          if (prob.repo) navigate(`/repositories/${prob.repo.owner}/${prob.repo.name}/issues`)
          else navigate('/repositories')
        }}
      />

      {/* 6. FIX CENTER */}
      <FixCenter
        investigations={investigations}
        onReviewFix={(item) => navigate(`/investigations/${item.id}`)}
        onActionComplete={() => fetchDashboardData(true)}
      />

      {/* 7 & 8. SECURITY OVERVIEW & TESTING OVERVIEW */}
      <div className="dashboard-two-col-grid">
        <SecurityOverviewCard
          stats={stats}
          onRunScan={() => navigate('/repositories')}
        />
        <TestingOverviewCard
          stats={stats}
          onRunTests={() => navigate('/repositories')}
        />
      </div>

      {/* 3 & 9. AI AGENT ACTIVITY & AI SYSTEM STATUS */}
      <div className="dashboard-two-col-grid">
        <AgentActivityTimeline
          activities={activities}
          investigations={investigations}
          onViewInvestigation={(item) => navigate(`/investigations/${item.id}`)}
        />
        <SystemStatus
          agents={agents}
          loading={loading}
          error={error}
        />
      </div>

      {/* 2. REPOSITORY HEALTH */}
      <RepositoryHealth
        repos={repos}
        githubStatus={githubStatus}
        onConnectGithub={onConnectGithub}
        onSelectRepo={(repo) => navigate(`/repositories/${repo.owner}/${repo.name}/issues`)}
        onScanComplete={handleScanComplete}
      />

      {/* 11. RECENT INVESTIGATIONS */}
      <RecentInvestigations
        investigations={investigations}
        onViewInvestigation={(item) => navigate(`/investigations/${item.id}`)}
      />
    </div>
  )
}
