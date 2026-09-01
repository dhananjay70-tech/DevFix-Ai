import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import * as api from '../services/api'

const AssistantContext = createContext(null)

export function AssistantProvider({ children }) {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [toolActivity, setToolActivity] = useState([])
  const [currentContext, setCurrentContext] = useState({
    page: 'dashboard',
    repository: null,
    investigationId: null,
    pullRequestId: null
  })

  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: "Hello! I'm your **DevFix AI Assistant**. I have real-time access to your repositories, AST diagnostic scans, investigations, test results, and pull requests.\n\nHow can I help you debug or review your codebase?",
      agent: 'Supervisor Agent',
      sources: ['DevFix AI Mesh'],
      suggestedActions: [
        { label: 'What needs my attention?', action: 'ask' },
        { label: 'Show high-risk repositories', action: 'ask' },
        { label: 'Check security status', action: 'ask' }
      ],
      timestamp: new Date()
    }
  ])

  // Automatically update page context based on URL route
  useEffect(() => {
    const path = location.pathname
    let page = 'dashboard'
    let repo = null
    let invId = null

    if (path.includes('/repositories/') && path.includes('/issues')) {
      page = 'repository_issues'
      const parts = path.split('/')
      if (parts.length >= 4) {
        repo = `${parts[2]}/${parts[3]}`
      }
    } else if (path.includes('/repositories')) {
      page = 'repositories'
    } else if (path.includes('/investigations/')) {
      page = 'investigation'
      const parts = path.split('/')
      invId = parts[2]
    } else if (path.includes('/investigations')) {
      page = 'investigations'
    } else if (path.includes('/pull-requests')) {
      page = 'pull_requests'
    }

    setCurrentContext(prev => ({
      ...prev,
      page,
      repository: repo || prev.repository,
      investigationId: invId || prev.investigationId
    }))
  }, [location.pathname])

  const setPageContext = useCallback((newContext) => {
    setCurrentContext(prev => ({ ...prev, ...newContext }))
  }, [])

  const sendMessage = useCallback(async (textQuery, contextOverride = {}) => {
    const text = (textQuery || '').trim()
    if (!text) return

    const userMessageId = `user-${Date.now()}`
    const userMessage = {
      id: userMessageId,
      sender: 'user',
      text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsThinking(true)
    setToolActivity(['Analyzing request...', 'Querying autonomous agents...'])

    const mergedContext = { ...currentContext, ...contextOverride }

    try {
      const historyPayload = messages.slice(-6).map(m => ({
        sender: m.sender,
        text: m.text
      }))

      const response = await api.chatWithAssistant(text, mergedContext, historyPayload)

      if (response && response.data) {
        const aiData = response.data
        if (aiData.tool_activity) {
          setToolActivity(aiData.tool_activity)
        }

        const aiMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiData.answer || 'I have analyzed your request.',
          agent: aiData.agent || 'Supervisor Agent',
          sources: aiData.sources || [],
          suggestedActions: aiData.suggested_actions || [],
          toolActivity: aiData.tool_activity || [],
          timestamp: new Date()
        }

        setMessages(prev => [...prev, aiMessage])
      }
    } catch (err) {
      console.error('[ASSISTANT CHAT ERROR]:', err)
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **Assistant Error:** ${err.message || 'Unable to connect to AI backend.'}`,
          agent: 'Supervisor Agent',
          timestamp: new Date()
        }
      ])
    } finally {
      setIsThinking(false)
      setTimeout(() => setToolActivity([]), 1500)
    }
  }, [currentContext, messages])

  const explainItem = useCallback(({ title, data, type = 'general' }) => {
    setIsOpen(true)
    const prompt = `Please explain this ${type}: "${title}". What does it mean for my repository, why did it occur, and what action should I take?`
    sendMessage(prompt, { explainTarget: { title, data, type } })
  }, [sendMessage])

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: 'Chat history cleared. I am ready to assist you with new questions about your code, investigations, or pull requests.',
        agent: 'Supervisor Agent',
        timestamp: new Date()
      }
    ])
  }, [])

  return (
    <AssistantContext.Provider
      value={{
        isOpen,
        openAssistant: () => setIsOpen(true),
        closeAssistant: () => setIsOpen(false),
        toggleAssistant: () => setIsOpen(prev => !prev),
        messages,
        currentContext,
        setPageContext,
        sendMessage,
        explainItem,
        clearChat,
        isThinking,
        toolActivity
      }}
    >
      {children}
    </AssistantContext.Provider>
  )
}

export function useAssistant() {
  const context = useContext(AssistantContext)
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider')
  }
  return context
}
