import express from 'express'
import {
  startInvestigation,
  getInvestigations,
  getInvestigationById,
  approveInvestigation,
  rejectInvestigation,
  retryInvestigation
} from '../controllers/investigationController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.route('/')
  .get(protect, getInvestigations)
  .post(protect, startInvestigation)

router.get('/:id', protect, getInvestigationById)
router.post('/:id/approve', protect, approveInvestigation)
router.post('/:id/reject', protect, rejectInvestigation)
router.post('/:id/retry', protect, retryInvestigation)

export default router
