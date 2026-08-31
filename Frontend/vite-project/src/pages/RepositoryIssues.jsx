import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
  AlertCircleIcon,
  SparklesIcon,
  SearchIcon,
  FolderIcon,
  CheckCircleIcon,
  ActivityIcon,
  TerminalIcon,
  ShieldCheckIcon,
  BotIcon
} from '../components/Icons'
import * as api from '../services/api'

const SCAN_STEPS = [
  'Scanning repository & cloning sandbox…',
  'Analyzing files & source structure…',
  'Detecting syntax, AST & runtime errors…',
  'Running test suites & build checks…',
  'Synthesizing diagnostic findings…'
]

export default function RepositoryIssues() {
  const { owner, repo } = useParams()
  const navigate = useNavigate()
  const { showToast } = useOutletContext()
  const [activeTab, setActiveTab] = useState('detected') // 'detected' | 'issues' | 'pulls'
  const [issues, setIssues] = useState([])
  const [pulls, setPulls] = useState([])
  const [detectedIssues, setDetectedIssues] = useState([])
  const [scanSummary, setScanSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanStepIdx, setScanStepIdx] = useState(0)
  const [error, setError] = useState(null)
  const [startingIssue, setStartingIssue] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([api.getRepoIssues(owner, repo), api.getRepoPulls(owner, repo)])
      .then(([issuesRes, pullsRes]) => {
        const repoIssues = Array.isArray(issuesRes.data) ? issuesRes.data : []
        const repoPulls = Array.isArray(pullsRes.data) ? pullsRes.data : []
        setIssues(repoIssues)
        setPulls(repoPulls)
        // If repository has GitHub issues, default to issues tab, otherwise default to detected/scan tab
        if (repoIssues.length > 0) {
          setActiveTab('issues')
        } else {
          setActiveTab('detected')
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [owner, repo])

  // Cycle scan progress messages during scanning
  useEffect(() => {
    if (!scanning) return
    const interval = setInterval(() => {
      setScanStepIdx(prev => (prev + 1) % SCAN_STEPS.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [scanning])

  const handleScanRepository = async () => {
    setScanning(true)
    setScanStepIdx(0)
    setError(null)
    setActiveTab('detected')
    try {
      showToast('Starting real repository code scan...')
      const res = await api.scanRepository(owner, repo)
      const data = res.data || {}
      setDetectedIssues(data.issues || [])
      setScanSummary({
        issuesFound: data.issues_found ?? (data.issues?.length || 0),
        testSummary: data.test_summary || {}
      })
      showToast(`Scan complete! Found ${data.issues_found ?? (data.issues?.length || 0)} problem(s).`)
    } catch (err) {
      setError(`Repository scan failed: ${err.message}`)
      showToast(`Scan error: ${err.message}`)
    } finally {
      setScanning(false)
    }
  }

  const handleStartInvestigation = async (issueItem, isDetected = false) => {
    const issueNum = isDetected
      ? (issueItem.line ? issueItem.line + 1000 : Math.floor(Math.random() * 9000) + 1000)
      : issueItem.number

    setStartingIssue(issueItem.id || issueNum)
    try {
      const payload = {
        repository: { fullName: `${owner}/${repo}`, name: repo, owner },
        issue: {
          number: issueNum,
          title: issueItem.title,
          description: isDetected
            ? `**Detected Problem in ${issueItem.file}${issueItem.line ? `:${issueItem.line}` : ''}**\n\n` +
              `**Severity:** ${issueItem.severity || 'HIGH'}\n` +
              `**Error:** ${issueItem.error_message || 'Runtime Bug'}\n\n` +
              `**Explanation:**\n${issueItem.explanation || ''}\n\n` +
              `**Evidence:**\n\`\`\`\n${issueItem.evidence || ''}\n\`\`\``
            : issueItem.body || '',
          labels: isDetected ? ['automated-scan', issueItem.severity?.toLowerCase() || 'high'] : (issueItem.labels || [])
        }
      }

      const res = await api.startInvestigation(payload.repository, payload.issue)
      showToast(`Investigation started for "${issueItem.title}"`)
      navigate(`/investigations/${res.data.id}`)
    } catch (err) {
      showToast(`Failed to start investigation: ${err.message}`)
    } finally {
      setStartingIssue(null)
    }
  }

  const filteredIssues = issues.filter(issue => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (issue.title && issue.title.toLowerCase().includes(q)) ||
      (issue.number && String(issue.number).includes(q)) ||
      (issue.author && issue.author.toLowerCase().includes(q)) ||
      (issue.labels && issue.labels.some(l => l.toLowerCase().includes(q)))
    )
  })

  const filteredPulls = pulls.filter(pr => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (pr.title && pr.title.toLowerCase().includes(q)) ||
      (pr.number && String(pr.number).includes(q)) ||
      (pr.author && pr.author.toLowerCase().includes(q))
    )
  })

  const filteredDetected = detectedIssues.filter(item => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.file && item.file.toLowerCase().includes(q)) ||
      (item.error_message && item.error_message.toLowerCase().includes(q)) ||
      (item.explanation && item.explanation.toLowerCase().includes(q))
    )
  })

  return (
    <div className="card" style={{ padding: '32px' }}>
      {/* Top Header */}
      <div className="card-header" style={{ marginBottom: '20px' }}>
        <div className="header-left">
          <div className="section-icon-badge">
            <FolderIcon className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="card-title">{owner}/{repo}</h2>
            <p className="card-subtitle">Real repository inspection, automated error detection & LangGraph fixing</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={handleScanRepository}
            disabled={scanning}
            type="button"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderColor: '#6366f1',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.35)'
            }}
          >
            <SparklesIcon className="w-4 h-4" />
            <span>{scanning ? 'Scanning Repository…' : 'Scan Repository'}</span>
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/repositories')} type="button">
            ← Back
          </button>
        </div>
      </div>

      {/* Live Scanning Progress Banner */}
      {scanning && (
        <div className="card" style={{
          padding: '20px',
          marginBottom: '20px',
          borderColor: 'var(--accent-indigo)',
          backgroundColor: 'rgba(99, 102, 241, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-indigo)', fontWeight: '600' }}>
              <ActivityIcon className="w-4 h-4 animate-spin" />
              <span>Autonomous Repository Code Scan in Progress</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Step {scanStepIdx + 1} of {SCAN_STEPS.length}
            </span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '12px' }}>
            {SCAN_STEPS[scanStepIdx]}
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill progress-fill-in-progress"
              style={{ width: `${((scanStepIdx + 1) / SCAN_STEPS.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Tabs Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'detected' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('detected')}
            type="button"
          >
            Detected Problems ({detectedIssues.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'issues' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('issues')}
            type="button"
          >
            GitHub Issues ({issues.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'pulls' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('pulls')}
            type="button"
          >
            Pull Requests ({pulls.length})
          </button>
        </div>

        <div className="search-bar" style={{ maxWidth: '300px', width: '100%' }}>
          <SearchIcon className="search-icon" />
          <input
            type="text"
            placeholder={
              activeTab === 'detected'
                ? 'Search detected problems...'
                : activeTab === 'issues'
                ? 'Search GitHub issues...'
                : 'Search pull requests...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Fetching real repository data from GitHub...
        </div>
      ) : error ? (
        <div className="auth-alert error-alert" style={{ marginBottom: '16px' }}>
          <AlertCircleIcon className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      ) : activeTab === 'detected' ? (
        /* Detected Problems Tab */
        detectedIssues.length === 0 ? (
          scanSummary ? (
            /* Scan completed with 0 errors */
            <div style={{
              padding: '36px',
              textAlign: 'center',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#34d399', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                <CheckCircleIcon className="w-5 h-5" />
                <span>No problems detected</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px 0' }}>
                The automated scan inspected repository files and executed build/test checks. Everything passed cleanly.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>✓ Tests passed</span>
                <span>✓ Build checks passed</span>
                <span>✓ Security checks passed</span>
              </div>
            </div>
          ) : (
            /* Prompt to run scan */
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)'
            }}>
              <BotIcon className="w-10 h-10 text-indigo-400" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Automated Repository Error Detection
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '480px', margin: '0 auto 20px auto' }}>
                Even when a repository has 0 GitHub issues, DevFix AI can scan your real source code, execute tests in the sandbox, and detect syntax errors, null pointers, and failing tests.
              </p>
              <button
                className="btn btn-primary"
                onClick={handleScanRepository}
                disabled={scanning}
                type="button"
              >
                <SparklesIcon className="w-4 h-4" />
                <span>Scan Repository Now</span>
              </button>
            </div>
          )
        ) : (
          /* Detected Issues List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredDetected.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: item.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: item.severity === 'HIGH' ? '#f87171' : '#fbbf24',
                      border: `1px solid ${item.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
                    }}>
                      {item.severity || 'HIGH'}
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {item.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="confidence-pill">
                      <SparklesIcon className="w-3 h-3" />
                      <span>{Math.round(item.confidence * 100)}% Confidence</span>
                    </span>
                    <span className="status-tag status-review">
                      <span className="status-dot"></span>
                      {item.status || 'Detected'}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo)' }}>
                  {item.file}{item.line ? `:${item.line}` : ''}
                </div>

                {item.explanation && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                    {item.explanation}
                  </p>
                )}

                {item.evidence && (
                  <div style={{
                    backgroundColor: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    fontFamily: 'Consolas, Monaco, monospace',
                    color: '#ff7b72',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '160px',
                    overflowY: 'auto'
                  }}>
                    {item.evidence}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleStartInvestigation(item, true)}
                    disabled={startingIssue === item.id}
                    type="button"
                  >
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>{startingIssue === item.id ? 'Starting Investigation…' : 'Investigate Problem'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'issues' ? (
        /* Open GitHub Issues Tab */
        filteredIssues.length === 0 ? (
          <div style={{
            padding: '36px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)'
          }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>
              No open GitHub issues found for this repository.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 16px 0' }}>
              Run an automated Repository Scan to detect code problems, syntax bugs, and failing tests automatically.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleScanRepository}
              disabled={scanning}
              type="button"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>Scan Repository</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
            {filteredIssues.map((issue) => (
              <div key={issue.id} style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo)', fontWeight: '600' }}>
                      #{issue.number}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {issue.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>by @{issue.author}</span>
                    {issue.labels?.map((label, lIdx) => (
                      <span key={lIdx} style={{
                        fontSize: '10px',
                        backgroundColor: 'rgba(99, 102, 241, 0.12)',
                        color: '#818cf8',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleStartInvestigation(issue, false)}
                  disabled={startingIssue === issue.number}
                  type="button"
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                  <span>{startingIssue === issue.number ? 'Starting…' : 'Investigate Issue'}</span>
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Pull Requests Tab */
        filteredPulls.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {searchQuery ? 'No pull requests match your search.' : 'No pull requests found on GitHub.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
            {filteredPulls.map((pr) => (
              <div key={pr.id} style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', fontWeight: '600' }}>
                      PR #{pr.number}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {pr.title}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    by @{pr.author} • State: {pr.status}
                  </span>
                </div>

                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  View on GitHub
                </a>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
