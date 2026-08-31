import React from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import RepositoryList from '../components/RepositoryList'

export default function Repositories() {
  const { githubStatus, onConnectGithub } = useOutletContext()
  const navigate = useNavigate()

  return (
    <div className="card" style={{ padding: '32px' }}>
      <RepositoryList
        githubStatus={githubStatus}
        onConnectGithub={onConnectGithub}
        onSelectRepo={(repo) => navigate(`/repositories/${repo.owner}/${repo.name}/issues`)}
      />
    </div>
  )
}
