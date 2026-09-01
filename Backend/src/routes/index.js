import express from 'express'
import healthRoutes from './healthRoutes.js'
import authRoutes from './authRoutes.js'
import userRoutes from './userRoutes.js'
import repositoryRoutes from './repositoryRoutes.js'
import issueRoutes from './issueRoutes.js'
import agentRunRoutes from './agentRunRoutes.js'
import pullRequestRoutes from './pullRequestRoutes.js'
import approvalRoutes from './approvalRoutes.js'
import activityRoutes from './activityRoutes.js'
import githubRoutes from './githubRoutes.js'
import investigationRoutes from './investigationRoutes.js'
import dashboardRoutes from './dashboardRoutes.js'
import agentStatusRoutes from './agentStatusRoutes.js'
import internalRoutes from './internalRoutes.js'
import assistantRoutes from './assistantRoutes.js'

const router = express.Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/repositories', repositoryRoutes)
router.use('/issues', issueRoutes)
router.use('/agent-runs', agentRunRoutes)
router.use('/pull-requests', pullRequestRoutes)
router.use('/approvals', approvalRoutes)
router.use('/activity', activityRoutes)
router.use('/github', githubRoutes)
router.use('/investigations', investigationRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/agents', agentStatusRoutes)
router.use('/internal', internalRoutes)
router.use('/ai-assistant', assistantRoutes)
router.use('/assistant', assistantRoutes)

export default router

