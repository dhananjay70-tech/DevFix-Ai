import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BotIcon,
  SparklesIcon,
  XIcon,
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  SendIcon,
  TrashIcon,
  FolderIcon,
  AlertCircleIcon,
  GitPullRequestIcon,
  LayersIcon
} from '../Icons'
import { useAssistant } from '../../context/AssistantContext'

// Simple Markdown Formatter for Assistant Messages
function renderMarkdown(content) {
  if (!content) return null

  // Split into lines
  const lines = content.split('\n')
  return lines.map((line, idx) => {
    // Header 3
    if (line.startsWith('### ')) {
      return <h4 key={idx} className="assistant-md-h4">{line.replace('### ', '')}</h4>
    }
    // Header 2
    if (line.startsWith('## ')) {
      return <h3 key={idx} className="assistant-md-h3">{line.replace('## ', '')}</h3>
    }
    // Header 1
    if (line.startsWith('# ')) {
      return <h2 key={idx} className="assistant-md-h2">{line.replace('# ', '')}</h2>
    }
    // Bullet point
    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
      const bulletText = line.replace(/^[•\-*]\s+/, '')
      return (
        <li key={idx} className="assistant-md-li">
          <span dangerouslySetInnerHTML={{ __html: formatInline(bulletText) }} />
        </li>
      )
    }
    // Empty line
    if (!line.trim()) {
      return <div key={idx} className="assistant-md-spacer" />
    }

    return (
      <p
        key={idx}
        className="assistant-md-p"
        dangerouslySetInnerHTML={{ __html: formatInline(line) }}
      />
    )
  })
}

function formatInline(text) {
  if (!text) return ''
  return text
    // bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // code
    .replace(/`([^`]+)`/g, '<code class="assistant-code-inline">$1</code>')
}

export default function GlobalAssistantDrawer() {
  const navigate = useNavigate()
  const {
    isOpen,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    messages,
    currentContext,
    sendMessage,
    clearChat,
    isThinking,
    toolActivity
  } = useAssistant()

  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isThinking, toolActivity, isOpen])

  // Focus textarea when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150)
    }
  }, [isOpen])

  const handleSend = () => {
    const text = input.trim()
    if (!text || isThinking) return
    sendMessage(text)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaInput = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  // Dynamic Suggested Prompts based on Current Page Context
  const getSuggestedPrompts = () => {
    const page = currentContext.page || 'dashboard'

    if (page === 'investigation') {
      return [
        'Explain this investigation',
        'What caused this bug?',
        'Why did the test fail?',
        'Is this fix safe?',
        'Generate fix'
      ]
    }
    if (page === 'repository_issues' || page === 'repositories') {
      return [
        'Analyze this repository',
        'Find risky files',
        'Check security issues',
        'What should I fix first?',
        'Summarize repository health'
      ]
    }
    if (page === 'pull_requests') {
      return [
        'Review this PR',
        'Find potential bugs',
        'Check security vulnerabilities',
        'What could break?'
      ]
    }

    // Default Dashboard Prompts
    return [
      'What needs my attention?',
      'Why did my repository health change?',
      'Show high-risk repositories',
      'What should I fix first?',
      'Summarize recent activity'
    ]
  }

  const getPageIcon = (page) => {
    switch (page) {
      case 'investigation':
      case 'investigations':
        return <LayersIcon className="w-3 h-3 text-indigo-400" />
      case 'repositories':
      case 'repository_issues':
        return <FolderIcon className="w-3 h-3 text-blue-400" />
      case 'pull_requests':
        return <GitPullRequestIcon className="w-3 h-3 text-purple-400" />
      default:
        return <SparklesIcon className="w-3 h-3 text-emerald-400" />
    }
  }

  const getPageLabel = (page) => {
    switch (page) {
      case 'investigation':
        return currentContext.investigationId ? `Investigation #${currentContext.investigationId.slice(0, 8)}` : 'Investigation Details'
      case 'repository_issues':
        return currentContext.repository ? `Repository: ${currentContext.repository}` : 'Repository Issues'
      case 'repositories':
        return 'Repositories'
      case 'pull_requests':
        return 'Pull Requests'
      default:
        return 'Dashboard Overview'
    }
  }

  const handleActionClick = (act) => {
    if (act.action === 'ask') {
      sendMessage(act.label)
    } else if (act.action === 'show_risks' || act.action === 'view_issues' || act.action === 'scan_repo') {
      navigate('/repositories')
    } else if (act.action === 'review_fix' || act.action === 'run_tests') {
      navigate('/investigations')
    } else if (act.action === 'start_investigation') {
      navigate('/repositories')
    } else {
      sendMessage(act.label)
    }
  }

  return (
    <>
      {/* Floating Global Trigger Button */}
      <button
        className={`global-assistant-float-btn ${isOpen ? 'active' : ''}`}
        onClick={toggleAssistant}
        type="button"
        title="Open DevFix AI Assistant"
      >
        <div className="btn-icon-wrapper">
          <BotIcon className="w-4 h-4 text-white" />
        </div>
        <span className="btn-text">
          {isOpen ? 'Close Assistant' : 'Ask AI Assistant'}
        </span>
        <span className="pulse-dot green"></span>
      </button>

      {/* Slide-out Assistant Drawer Panel */}
      <div className={`global-assistant-drawer ${isOpen ? 'open' : ''}`}>
        {/* Drawer Header */}
        <div className="assistant-drawer-header">
          <div className="header-title-group">
            <div className="assistant-avatar-badge">
              <SparklesIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="assistant-title">DevFix AI Assistant</h3>
              <div className="assistant-status-line">
                <span className="pulse-dot green"></span>
                <span className="status-text">7 Autonomous Agents Active</span>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="btn-drawer-tool"
              onClick={clearChat}
              title="Clear chat history"
              type="button"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
            <button
              className="btn-drawer-tool"
              onClick={closeAssistant}
              title="Close drawer"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Context Banner */}
        <div className="assistant-context-banner">
          <div className="context-pill">
            {getPageIcon(currentContext.page)}
            <span className="context-pill-text">{getPageLabel(currentContext.page)}</span>
          </div>
          {currentContext.repository && currentContext.page === 'investigation' && (
            <span className="context-sub-tag font-mono">{currentContext.repository}</span>
          )}
        </div>

        {/* Chat Messages Stream */}
        <div className="assistant-messages-stream">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`assistant-msg-bubble ${msg.sender === 'user' ? 'msg-user' : 'msg-ai'}`}
            >
              {msg.sender === 'ai' && (
                <div className="msg-ai-header">
                  <div className="agent-badge">
                    <BotIcon className="w-3 h-3 text-indigo-400" />
                    <span>{msg.agent || 'DevFix AI'}</span>
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="sources-badge">
                      <span>Source: {msg.sources[0]}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="msg-content">
                {msg.sender === 'ai' ? renderMarkdown(msg.text) : msg.text}
              </div>

              {/* Action Buttons attached to AI reply */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="msg-action-chips">
                  {msg.suggestedActions.map((act, idx) => (
                    <button
                      key={idx}
                      className="action-chip-btn"
                      onClick={() => handleActionClick(act)}
                      type="button"
                    >
                      <SparklesIcon className="w-2.5 h-2.5 text-indigo-400" />
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Thinking & Tool Activity State */}
          {isThinking && (
            <div className="assistant-thinking-card">
              <div className="thinking-spinner-line">
                <span className="pulse-dot indigo"></span>
                <span className="thinking-title">DevFix Agents Thinking…</span>
              </div>

              {toolActivity.length > 0 && (
                <div className="tool-stepper-list">
                  {toolActivity.map((step, idx) => (
                    <div key={idx} className="tool-step-item">
                      <span className="step-bullet">•</span>
                      <span className="step-text">{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Prompts Bar */}
        <div className="assistant-suggested-bar">
          <span className="suggested-heading">Suggested Prompts:</span>
          <div className="suggested-chips-scroll">
            {getSuggestedPrompts().map((prompt, idx) => (
              <button
                key={idx}
                className="suggested-prompt-chip"
                onClick={() => sendMessage(prompt)}
                disabled={isThinking}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="assistant-input-panel">
          <div className="input-box-wrap">
            <textarea
              ref={textareaRef}
              className="assistant-textarea"
              placeholder="Ask DevFix AI anything about your codebase, bugs, or tests…"
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isThinking}
            />
            <button
              className="btn-assistant-send"
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              type="button"
              title="Send message (Enter)"
            >
              <SendIcon className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <div className="assistant-footer-caption">
            <span>Verified with real AST localization & sandbox test runners</span>
          </div>
        </div>
      </div>
    </>
  )
}
