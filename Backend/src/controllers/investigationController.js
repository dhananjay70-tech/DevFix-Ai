import { asyncHandler } from '../utils/asyncHandler.js'
import * as investigationService from '../services/investigationService.js'

export const startInvestigation = asyncHandler(async (req, res) => {
  const run = await investigationService.startInvestigation(req.user.id, req.body)
  res.status(201).json({ success: true, data: run })
})

export const getInvestigations = asyncHandler(async (req, res) => {
  const { status } = req.query
  const runs = await investigationService.getInvestigations(req.user.id, status)
  res.status(200).json({ success: true, data: runs })
})

export const getInvestigationById = asyncHandler(async (req, res) => {
  const run = await investigationService.getInvestigationById(req.user.id, req.params.id)
  res.status(200).json({ success: true, data: run })
})

export const syncAgentRun = asyncHandler(async (req, res) => {
  const run = await investigationService.syncAgentRun(req.params.id, req.body)
  res.status(200).json({ success: true, data: run })
})

export const approveInvestigation = asyncHandler(async (req, res) => {
  const approval = await investigationService.setApproval(req.user.id, req.params.id, 'APPROVED')
  res.status(200).json({ success: true, data: approval })
})

export const rejectInvestigation = asyncHandler(async (req, res) => {
  const approval = await investigationService.setApproval(req.user.id, req.params.id, 'REJECTED')
  res.status(200).json({ success: true, data: approval })
})

export const retryInvestigation = asyncHandler(async (req, res) => {
  const run = await investigationService.retryInvestigation(req.user.id, req.params.id)
  res.status(200).json({ success: true, data: run })
})
