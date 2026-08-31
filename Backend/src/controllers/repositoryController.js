import { asyncHandler } from '../utils/asyncHandler.js'
import * as repositoryService from '../services/repositoryService.js'

export const createRepository = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null
  const repo = await repositoryService.createRepository(req.body, userId)
  res.status(201).json({
    success: true,
    data: repo
  })
})

export const getRepositories = asyncHandler(async (req, res) => {
  const repos = await repositoryService.getRepositories(req.user.id)
  res.status(200).json({
    success: true,
    data: repos
  })
})

export const getRepositoryById = asyncHandler(async (req, res) => {
  const repo = await repositoryService.getRepositoryById(req.params.id, req.user.id)
  res.status(200).json({
    success: true,
    data: repo
  })
})

export const updateRepository = asyncHandler(async (req, res) => {
  const updated = await repositoryService.updateRepository(req.params.id, req.body, req.user.id)
  res.status(200).json({
    success: true,
    data: updated
  })
})

export const deleteRepository = asyncHandler(async (req, res) => {
  const result = await repositoryService.deleteRepository(req.params.id, req.user.id)
  res.status(200).json({
    success: true,
    data: result
  })
})

export const scanRepository = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params
  const scanResult = await repositoryService.scanRepository(req.user.id, owner, repo)
  res.status(200).json({
    success: true,
    data: scanResult
  })
})
