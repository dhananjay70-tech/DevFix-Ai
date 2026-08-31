import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboardIcon, FolderIcon, ActivityIcon, GitPullRequestIcon, BotIcon, ShieldCheckIcon } from './Icons'
import * as api from '../services/api'

export default function Sidebar() {
  const [activeCount, setActiveCount] = useState(null)
  const [prCount, setPrCount] = useState(null)
  const [agentSummary, setAgentSummary] = useState(null)

  useEffect(() => {
    api.getDashboardStats()
      .then(res => {
        if (res?.data) {
          setActiveCount(res.data.activeInvestigations || null)
          setPrCount(res.data.pullRequests || null)
        }
      })
      .catch(() => {})

    api.getAgentsStatus()
      .then(res => {
        const agents = res.data || []
        setAgentSummary({ running: agents.filter(a => a.status === 'Running').length, total: agents.length })
      })
      .catch(() => {})
  }, [])

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboardIcon,
      badge: null
    },
    {
      to: '/repositories',
      label: 'Repositories',
      icon: FolderIcon,
      badge: null
    },
    {
      to: '/investigations',
      label: 'Investigations',
      icon: ActivityIcon,
      badge: activeCount ? `${activeCount} Active` : null
    },
    {
      to: '/pull-requests',
      label: 'Pull Requests',
      icon: GitPullRequestIcon,
      badge: prCount ? `${prCount}` : null
    }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <BotIcon className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="brand-info">
          <span className="brand-name">DevFix AI</span>
          <span className="brand-badge">v2.4 Pro</span>
        </div>
      </div>

      <div className="sidebar-status-banner">
        <span className="pulse-dot"></span>
        <span className="status-text">Autonomous Engine Active</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group-label">Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <Icon className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className={`nav-badge ${isActive ? 'badge-active' : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-health-mini">
          <div className="health-header">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Agent Cluster Health</span>
          </div>
          <span className="health-meta">
            {agentSummary ? `${agentSummary.running}/${agentSummary.total} agents running` : 'Loading agent status…'}
          </span>
        </div>
      </div>
    </aside>
  )
}
