import 'dotenv/config'
import app from './app.js'
import { isGithubConfigured } from './services/githubService.js'

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`🚀 DevFix AI Core Backend server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`)
  console.log(`GitHub OAuth: ${isGithubConfigured() ? 'configured' : 'not configured'}`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`)
  server.close(() => process.exit(1))
})
