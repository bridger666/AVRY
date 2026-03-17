'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import type { CopilotMessage, CopilotSuggestion } from '@/hooks/useWorkflowCopilot'
import styles from './AiraCopilotFloating.module.css'

const WORKFLOW_KEYWORDS = [
  'workflow', 'automate', 'automation', 'trigger', 'step', 'build', 'create',
  'generate', 'connect', 'integrate', 'integration', 'when', 'then', 'if',
  'send email', 'notify', 'schedule', 'run', 'execute', 'pipeline',
]

function isWorkflowIntent(text: string): boolean {
  const lower = text.toLowerCase()
  return WORKFLOW_KEYWORDS.some(kw => lower.includes(kw))
}

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  messages: CopilotMessage[]
  loading: boolean
  error: string | null
  lastSuggestion: CopilotSuggestion | null
  onSendChat: (msg: string) => void
  onBuildWorkflow: (prompt: string) => void
  onApplySuggestion?: (suggestion: CopilotSuggestion) => void
  currentWorkflowName?: string
  clearMessages?: () => void
}

export function AiraCopilotFloating({
  isOpen, onOpenChange, messages, loading, error,
  lastSuggestion, onSendChat, onBuildWorkflow,
  onApplySuggestion, currentWorkflowName, clearMessages,
}: Props) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 80)
  }, [isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
  }

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    if (isWorkflowIntent(trimmed)) onBuildWorkflow(trimmed)
    else onSendChat(trimmed)
  }, [input, loading, onSendChat, onBuildWorkflow])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (!isOpen) {
    return (
      <button className={styles.pill} onClick={() => onOpenChange(true)} aria-label="Open AIRA Copilot">
        <img src="/Aivory_Avatar.svg" alt="AIRA" style={{ width: 18, height: 18 }} />
        <span className={styles.pillLabel}>AIRA Copilot</span>
        <span className={styles.pillHint}>/ or ⌘K</span>
        <span className={styles.pillChevron}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </button>
    )
  }

  return (
    <div className={styles.panel} role="dialog" aria-label="AIRA Copilot">
      <div className={styles.panelHeader}>
        <img src="/Aivory_Avatar.svg" alt="AIRA" style={{ width: 18, height: 18 }} />
        <span className={styles.panelHeaderTitle}>AIRA Copilot</span>
        {currentWorkflowName && <span className={styles.panelHeaderContext}>{currentWorkflowName}</span>}
        <div className={styles.panelHeaderActions}>
          {clearMessages && messages.length > 0 && (
            <button className={styles.panelHeaderBtn} onClick={clearMessages} title="Clear" aria-label="Clear conversation">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
            </button>
          )}
          <button className={styles.panelHeaderBtn} onClick={() => onOpenChange(false)} title="Minimize" aria-label="Minimize">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && !loading && (
          <div className={styles.emptyState}>
            <img src="/Aivory_Avatar.svg" alt="" style={{ width: 28, height: 28, opacity: 0.5 }} />
            <p className={styles.emptyTitle}>Ask AIRA anything</p>
            <p className={styles.emptyHint}>
              Get expert advice on automation, or describe a workflow to build it on the canvas.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={styles.message + ' ' + (msg.role === 'user' ? styles.messageUser : styles.messageAssistant)}>
            {msg.role === 'assistant' && (
              <div className={styles.messageAvatar}>
                <img src="/Aivory_Avatar.svg" alt="AIRA" style={{ width: 18, height: 18 }} />
              </div>
            )}
            <div className={styles.messageBubble}>
              <p className={styles.messageText}>{msg.content}</p>
              {msg.suggestion && onApplySuggestion && (
                <div className={styles.messageActions}>
                  <button className={styles.actionBtn} onClick={() => onApplySuggestion(msg.suggestion!)}>
                    Generate on canvas
                  </button>
                  <button className={styles.actionBtnSecondary} onClick={() => {}}>
                    Discard
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className={styles.message + ' ' + styles.messageAssistant}>
            <div className={styles.messageAvatar}>
              <img src="/Aivory_Avatar.svg" alt="AIRA" style={{ width: 18, height: 18 }} />
            </div>
            <div className={styles.typingDots}><span /><span /><span /></div>
          </div>
        )}
        {error && <p className={styles.errorText}>{error}</p>}
        <div ref={messagesEndRef} />
      </div>

      {lastSuggestion && onApplySuggestion && (
        <div className={styles.applyBanner}>
          <span>Workflow ready — {lastSuggestion.steps.length} steps generated</span>
          <button className={styles.applyBannerBtn} onClick={() => onApplySuggestion(lastSuggestion)}>Apply to canvas</button>
        </div>
      )}

      <div className={styles.inputRow}>
        <textarea
          ref={textareaRef}
          className={styles.input}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask AIRA anything, or describe a workflow to build..."
          disabled={loading}
          rows={1}
          aria-label="Message AIRA"
        />
        <button className={styles.sendBtn} onClick={handleSend} disabled={!input.trim() || loading} aria-label="Send">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <p className={styles.inputHint}>Enter to send · Shift+Enter for new line</p>
    </div>
  )
}
