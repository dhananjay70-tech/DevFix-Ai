import { asyncHandler } from '../utils/asyncHandler.js'
import * as agentStatusService from '../services/agentStatusService.js'

export const getAgentsStatus = asyncHandler(async (req, res) => {
  const agents = await agentStatusService.getAgentsStatus(req.user.id)
  res.status(200).json({ success: true, data: agents })
})
