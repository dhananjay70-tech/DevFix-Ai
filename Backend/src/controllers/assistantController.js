import { processAssistantChat } from '../services/assistantService.js'

export async function chatWithAssistant(req, res) {
  try {
    const userId = req.user?.id
    const { message, context, history } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'A valid "message" string is required.'
      })
    }

    const result = await processAssistantChat({
      userId,
      message: message.trim(),
      context: context || {},
      history: Array.isArray(history) ? history : []
    })

    return res.status(200).json(result)
  } catch (err) {
    console.error('[ASSISTANT CONTROLLER ERROR]:', err)
    return res.status(500).json({
      success: false,
      error: 'Failed to process AI assistant message: ' + err.message
    })
  }
}
