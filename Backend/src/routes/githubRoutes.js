import express from 'express'
import {
  connectGithub,
  githubCallback,
  getStatus,
  disconnect,
  getRepos,
  getRepoIssues,
  getRepoPulls
} from '../controllers/githubController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// OAuth flow routes
router.get('/connect', protect, connectGithub)
router.get('/callback', githubCallback)

// Account & Sync status routes (protected)
router.get('/status', protect, getStatus)
router.post('/disconnect', protect, disconnect)
router.get('/repos', protect, getRepos)
router.get('/repos/:owner/:repo/issues', protect, getRepoIssues)
router.get('/repos/:owner/:repo/pulls', protect, getRepoPulls)

export default router
