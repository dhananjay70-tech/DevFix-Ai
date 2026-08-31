import React from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import KpiSection from '../components/KpiSection'
import ActiveInvestigations from '../components/ActiveInvestigations'
import SystemStatus from '../components/SystemStatus'
import PendingApprovals from '../components/PendingApprovals'
import RecentActivity from '../components/RecentActivity'
import RepositoryList from '../components/RepositoryList'

export default function Dashboard() {
  const { githubStatus, onConnectGithub } = useOutletContext()
  const navigate = useNavigate()

  return (
    <>
      <KpiSection />

      <div className="dashboard-main-grid">
        <ActiveInvestigations onViewInvestigation={(item) => navigate(`/investigations/${item.id}`)} />
        <SystemStatus />
      </div>

      <PendingApprovals onReview={(item) => navigate(`/investigations/${item.id}`)} />

      <div className="dashboard-bottom-grid">
        <RecentActivity />
        <RepositoryList
          githubStatus={githubStatus}
          onConnectGithub={onConnectGithub}
          onSelectRepo={(repo) => navigate(`/repositories/${repo.owner}/${repo.name}/issues`)}
        />
      </div>
    </>
  )
}
