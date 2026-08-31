import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './components/LoginPage'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import Repositories from './pages/Repositories'
import RepositoryIssues from './pages/RepositoryIssues'
import Investigations from './pages/Investigations'
import InvestigationDetail from './pages/InvestigationDetail'
import PullRequests from './pages/PullRequests'
import './App.css'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="login-page-overlay">
        <div style={{ color: 'var(--accent-indigo)', fontSize: '16px', fontWeight: '600' }}>
          Loading DevFix AI Session...
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={user ? <Layout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="repositories" element={<Repositories />} />
        <Route path="repositories/:owner/:repo/issues" element={<RepositoryIssues />} />
        <Route path="investigations" element={<Investigations />} />
        <Route path="investigations/:id" element={<InvestigationDetail />} />
        <Route path="pull-requests" element={<PullRequests />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
