import { asyncHandler } from '../utils/asyncHandler.js'
import * as issueService from '../services/issueService.js'

export const createIssue = asyncHandler(async (req, res) => {
  const issue = await issueService.createIssue(req.body, req.user.id)
  res.status(201).json({
    success: true,
    data: issue
  })
})

export const getIssues = asyncHandler(async (req, res) => {
  const issues = await issueService.getIssues(req.user.id)
  res.status(200).json({
    success: true,
    data: issues
  })
})

export const getIssueById = asyncHandler(async (req, res) => {
  const issue = await issueService.getIssueById(req.params.id, req.user.id)
  res.status(200).json({
    success: true,
    data: issue
  })
})

export const updateIssue = asyncHandler(async (req, res) => {
  const updated = await issueService.updateIssue(req.params.id, req.body, req.user.id)
  res.status(200).json({
    success: true,
    data: updated
  })
})

export const deleteIssue = asyncHandler(async (req, res) => {
  const result = await issueService.deleteIssue(req.params.id, req.user.id)
  res.status(200).json({
    success: true,
    data: result
  })
})
