const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').trim().replace(/\/+$/, '')
const API_BASE = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`
export const API_ROOT = API_BASE.replace(/\/api$/, '')

async function request(path, options = {}) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const finalPath = cleanPath.startsWith('/api/') ? cleanPath.slice(4) : cleanPath
  const url = `${API_BASE}${finalPath}`

  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    // no JSON body
  }

  if (!res.ok || (data && data.success === false)) {
    throw new Error(data?.message || `Request failed with HTTP ${res.status}`)
  }

  return data
}

// Auth
export const getMe = () => request('/auth/me')
export const sendOtp = (email) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ email }) })
export const verifyOtp = (email, otp) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) })
export const logout = () => request('/auth/logout', { method: 'POST' })

// GitHub
export const getGithubStatus = () => request('/github/status')
export const disconnectGithub = () => request('/github/disconnect', { method: 'POST' })
export const getGithubRepos = () => request('/github/repos')
export const getRepoIssues = (owner, repo) => request(`/github/repos/${owner}/${repo}/issues`)
export const getRepoPulls = (owner, repo) => request(`/github/repos/${owner}/${repo}/pulls`)
export const scanRepository = (owner, repo) => request(`/repositories/${owner}/${repo}/scan`, { method: 'POST' })

// Dashboard & agents
export const getDashboardStats = () => request('/dashboard/stats')
export const getAgentsStatus = () => request('/agents/status')

// Investigations
export const startInvestigation = (repository, issue) =>
  request('/investigations', { method: 'POST', body: JSON.stringify({ repository, issue }) })
export const getInvestigations = (status) =>
  request(`/investigations${status ? `?status=${status}` : ''}`)
export const getInvestigation = (id) => request(`/investigations/${id}`)
export const approveInvestigation = id => request(`/investigations/${id}/approve`, { method: 'POST' })
export const rejectInvestigation = id => request(`/investigations/${id}/reject`, { method: 'POST' })
export const retryInvestigation = id => request(`/investigations/${id}/retry`, { method: 'POST' })

// Pull requests & Activity
export const getPullRequests = () => request('/pull-requests')
export const getActivityLogs = () => request('/activity')
export const getRepositories = () => request('/repositories')
export const getApprovals = () => request('/approvals')
export const chatWithAssistant = (message, context, history) =>
  request('/ai-assistant/chat', { method: 'POST', body: JSON.stringify({ message, context, history }) })
