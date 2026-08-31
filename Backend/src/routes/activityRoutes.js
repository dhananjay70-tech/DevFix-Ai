import express from 'express'
import { createActivityLog, getActivityLogs } from '../controllers/activityController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.route('/')
  .get(protect, getActivityLogs)
  .post(protect, createActivityLog)

export default router
