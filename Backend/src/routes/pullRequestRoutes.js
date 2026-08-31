import express from 'express'
import {
  createPullRequest,
  getPullRequests,
  getPullRequestById,
  updatePullRequest
} from '../controllers/pullRequestController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.route('/')
  .get(protect, getPullRequests)
  .post(protect, createPullRequest)

router.route('/:id')
  .get(protect, getPullRequestById)
  .put(protect, updatePullRequest)

export default router
