import { asyncHandler } from '../utils/asyncHandler.js'
import * as approvalService from '../services/approvalService.js'

export const createApproval = asyncHandler(async (req, res) => {
  const reviewerId = req.user.id
  const approval = await approvalService.createApproval({ ...req.body, reviewerId }, req.user.id)
  res.status(201).json({
    success: true,
    data: approval
  })
})

export const getApprovals = asyncHandler(async (req, res) => {
  const approvals = await approvalService.getApprovals(req.user.id)
  res.status(200).json({
    success: true,
    data: approvals
  })
})

export const getApprovalById = asyncHandler(async (req, res) => {
  const approval = await approvalService.getApprovalById(req.params.id, req.user.id)
  res.status(200).json({
    success: true,
    data: approval
  })
})

export const updateApproval = asyncHandler(async (req, res) => {
  const reviewerId = req.user.id
  const updated = await approvalService.updateApproval(req.params.id, req.body, reviewerId, req.user.id)
  res.status(200).json({
    success: true,
    data: updated
  })
})
