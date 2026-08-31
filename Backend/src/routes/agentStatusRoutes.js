import express from 'express'
import { getAgentsStatus } from '../controllers/agentStatusController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/status', protect, getAgentsStatus)

export default router
