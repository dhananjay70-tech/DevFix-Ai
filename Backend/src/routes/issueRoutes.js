import express from 'express'
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue
} from '../controllers/issueController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.route('/')
  .get(protect, getIssues)
  .post(protect, createIssue)

router.route('/:id')
  .get(protect, getIssueById)
  .put(protect, updateIssue)
  .delete(protect, deleteIssue)

export default router
