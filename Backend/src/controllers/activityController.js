import { asyncHandler } from '../utils/asyncHandler.js'
import * as activityService from '../services/activityService.js'

export const createActivityLog = asyncHandler(async (req, res) => {
  const log = await activityService.createActivityLog({ ...req.body, userId: req.user.id })
  res.status(201).json({
    success: true,
    data: log
  })
})

export const getActivityLogs = asyncHandler(async (req, res) => {
  const logs = await activityService.getActivityLogs(req.user.id)
  res.status(200).json({
    success: true,
    data: logs
  })
})
