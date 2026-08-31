import { asyncHandler } from '../utils/asyncHandler.js'
import * as dashboardService from '../services/dashboardService.js'

export const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats(req.user.id)
  res.status(200).json({ success: true, data: stats })
})
