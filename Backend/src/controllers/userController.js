import { asyncHandler } from '../utils/asyncHandler.js'
import * as userService from '../services/userService.js'

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getUserProfile(req.user.id)
  res.status(200).json({
    success: true,
    data: profile
  })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const updated = await userService.updateUserProfile(req.user.id, req.body)
  res.status(200).json({
    success: true,
    data: updated
  })
})
