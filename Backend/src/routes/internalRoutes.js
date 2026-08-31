import express from 'express'
import { syncAgentRun } from '../controllers/investigationController.js'
import { verifyInternalKey } from '../middleware/internalAuth.js'

const router = express.Router()

// Called by the AI backend to push real investigation progress — never by the frontend.
router.post('/agent-runs/:id/sync', verifyInternalKey, syncAgentRun)

export default router
