import express from 'express'
import {
  createRepository,
  getRepositories,
  getRepositoryById,
  updateRepository,
  deleteRepository,
  scanRepository
} from '../controllers/repositoryController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.route('/')
  .get(protect, getRepositories)
  .post(protect, createRepository)

router.post('/:owner/:repo/scan', protect, scanRepository)

router.route('/:id')
  .get(protect, getRepositoryById)
  .put(protect, updateRepository)
  .delete(protect, deleteRepository)

export default router
