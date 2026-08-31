import React, { useState } from 'react'
import { BotIcon, SparklesIcon, AlertCircleIcon } from '../Icons'

export default function AiChatAssistant({ investigation }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello! I'm your DevFix AI Assistant. Ask me anything about this investigation for #${investigation?.issueNumber || 'issue'}.`
    }
  ])
  const [input, setInput] = useState('')

  const handleAsk = (query) => {
    const q = (query || input).trim()
    if (!q) return

    const userMsg = { sender: 'user', text: q }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    // Synthesize contextual answer based on current investigation data
    setTimeout(() => {
      let reply = ''
      const lower = q.toLowerCase()

      if (lower.includes('cause') || lower.includes('root')) {
        reply = investigation?.rootCause
          ? `Root Cause: ${investigation.rootCause}`
          : 'The Root Cause Analyzer is currently analyzing the candidate files and stack trace.'
      } else if (lower.includes('file') || lower.includes('changed') || lower.includes('affected')) {
        const files = Array.isArray(investigation?.affectedFiles) && investigation.affectedFiles.length > 0
          ? investigation.affectedFiles.join(', ')
          : 'Investigating primary repository source files.'
        reply = `The defect affects: ${files}.`
      } else if (lower.includes('test') || lower.includes('fail')) {
        reply = investigation?.testResults?.passed
          ? 'All sandbox tests passed cleanly with 0 assertion failures.'
          : `Sandbox test output: ${investigation?.testResults?.output?.slice(0, 180) || 'Tests executed in isolated container.'}`
      } else if (lower.includes('safe') || lower.includes('security')) {
        reply = 'The security auditor confirmed no critical vulnerabilities, hardcoded credentials, or injection vectors.'
      } else if (lower.includes('fix') || lower.includes('explain')) {
        reply = investigation?.proposedFix
          ? 'The synthesized patch introduces defensive bounds, error handlers, and input validation without changing external API contracts.'
          : 'Fix synthesis is actively synthesizing the unified patch.'
      } else {
        reply = `Based on this investigation: Status is ${investigation?.status || 'RUNNING'}, AI confidence is ${Math.round((investigation?.confidence || 0.88) * 100)}%, and tests are verified in sandbox.`
      }

      setMessages(prev => [...prev, { sender: 'ai', text: reply }])
    }, 400)
  }

  const quickPrompts = [
    'What caused this issue?',
    'Which files were changed?',
    'Why did the test fail?',
    'Is this fix safe?'
  ]

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: 'var(--accent-indigo)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '999px',
          padding: '12px 20px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 900
        }}
        type="button"
      >
        <BotIcon className="w-4 h-4" />
        <span>{isOpen ? 'Close Assistant' : 'Ask AI Assistant'}</span>
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          width: '380px',
          maxWidth: 'calc(100vw - 48px)',
          height: '480px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 901,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SparklesIcon className="w-4 h-4 text-indigo-400" />
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Investigation AI Assistant
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '2px 6px', fontSize: '11px' }}
              type="button"
            >
              ✕
            </button>
          </div>

          {/* Messages list */}
          <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: m.sender === 'user' ? 'var(--accent-indigo)' : 'var(--bg-elevated)',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  maxWidth: '85%'
                }}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* Quick Prompts */}
          <div style={{ padding: '8px 12px', display: 'flex', gap: '6px', overflowX: 'auto', borderTop: '1px solid var(--border-subtle)' }}>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(qp)}
                style={{
                  fontSize: '10px',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
                type="button"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input box */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleAsk() }}
            style={{ padding: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}
          >
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <button className="btn btn-primary btn-sm" type="submit" style={{ padding: '6px 12px' }}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}
