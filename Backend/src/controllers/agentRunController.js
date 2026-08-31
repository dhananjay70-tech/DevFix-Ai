import { asyncHandler } from '../utils/asyncHandler.js'
import * as agentRunService from '../services/agentRunService.js'

export const createAgentRun = asyncHandler(async (req, res) => {
  const agentRun = await agentRunService.createAgentRun(req.body, req.user.id)
  res.status(201).json({
    success: true,
    data: agentRun
  })
})

export const getAgentRuns = asyncHandler(async (req, res) => {
  const agentRuns = await agentRunService.getAgentRuns(req.user.id)
  res.status(200).json({
    success: true,
    data: agentRuns
  })
})

export const getAgentRunById = asyncHandler(async (req, res) => {
  const agentRun = await agentRunService.getAgentRunById(req.params.id, req.user.id)
  res.status(200).json({
    success: true,
    data: agentRun
  })
})

export const updateAgentRun = asyncHandler(async (req, res) => {
  const updated = await agentRunService.updateAgentRun(req.params.id, req.body, req.user.id)
  res.status(200).json({
    success: true,
    data: updated
  })
})
