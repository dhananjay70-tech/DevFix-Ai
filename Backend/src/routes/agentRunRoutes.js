import express from 'express'
import {
  createAgentRun,
  getAgentRuns,
  getAgentRunById,
  updateAgentRun
} from '../controllers/agentRunController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.route('/')
  .get(protect, getAgentRuns)
  .post(protect, createAgentRun)

router.route('/:id')
  .get(protect, getAgentRunById)
  .put(protect, updateAgentRun)

export default router
