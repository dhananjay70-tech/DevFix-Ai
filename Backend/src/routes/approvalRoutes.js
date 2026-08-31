import express from 'express'
import {
  createApproval,
  getApprovals,
  getApprovalById,
  updateApproval
} from '../controllers/approvalController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.route('/')
  .get(protect, getApprovals)
  .post(protect, createApproval)

router.route('/:id')
  .get(protect, getApprovalById)
  .put(protect, updateApproval)

export default router
