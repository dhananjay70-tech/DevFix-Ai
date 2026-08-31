import { asyncHandler } from '../utils/asyncHandler.js'
import * as pullRequestService from '../services/pullRequestService.js'

export const createPullRequest = asyncHandler(async (req, res) => {
  const pr = await pullRequestService.createPullRequest(req.body, req.user.id)
  res.status(201).json({
    success: true,
    data: pr
  })
})

export const getPullRequests = asyncHandler(async (req, res) => {
  const prs = await pullRequestService.getPullRequests(req.user.id)
  res.status(200).json({
    success: true,
    data: prs
  })
})

export const getPullRequestById = asyncHandler(async (req, res) => {
  const pr = await pullRequestService.getPullRequestById(req.params.id, req.user.id)
  res.status(200).json({
    success: true,
    data: pr
  })
})

export const updatePullRequest = asyncHandler(async (req, res) => {
  const updated = await pullRequestService.updatePullRequest(req.params.id, req.body, req.user.id)
  res.status(200).json({
    success: true,
    data: updated
  })
})
