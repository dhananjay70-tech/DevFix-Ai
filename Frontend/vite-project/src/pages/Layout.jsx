import React, { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { CheckCircleIcon } from '../components/Icons'
import { AssistantProvider } from '../context/AssistantContext'
import GlobalAssistantDrawer from '../components/assistant/GlobalAssistantDrawer'
import * as api from '../services/api'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [toastMessage, setToastMessage] = useState(null)
  const [githubStatus, setGithubStatus] = useState(null)

  const showToast = useCallback((msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }, [])

  const fetchGithubStatus = useCallback(() => {
    api.getGithubStatus()
      .then(data => setGithubStatus(data.data))
      .catch(err => console.error('[GITHUB STATUS ERROR]:', err.message))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const githubParam = params.get('github')
    const errorParam = params.get('error')

    if (githubParam || errorParam) {
      window.history.replaceState({}, document.title, location.pathname)
    }
    if (githubParam === 'connected') {
      showToast('GitHub connected successfully!')
      fetchGithubStatus()
    } else if (errorParam) {
      showToast(`GitHub Connection Error: ${decodeURIComponent(errorParam)}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  useEffect(() => {
    fetchGithubStatus()
  }, [fetchGithubStatus])

  const handleConnectGithub = () => {
    window.location.href = `${api.API_ROOT}/api/github/connect`
  }

  const handleDisconnectGithub = async () => {
    try {
      await api.disconnectGithub()
      setGithubStatus({ connected: false })
      showToast('GitHub disconnected successfully.')
    } catch (err) {
      showToast(`Error: ${err.message}`)
    }
  }

  return (
    <AssistantProvider>
      <div className="app-container">
        <Sidebar />

        <main className="main-content">
          <Header
            githubStatus={githubStatus}
            onNewInvestigation={() => navigate('/repositories')}
            onConnectGithub={handleConnectGithub}
            onDisconnectGithub={handleDisconnectGithub}
          />

          <Outlet context={{ githubStatus, showToast, onConnectGithub: handleConnectGithub }} />
        </main>

        <GlobalAssistantDrawer />

        {toastMessage && (
          <div className="toast-notification">
            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </AssistantProvider>
  )
}

