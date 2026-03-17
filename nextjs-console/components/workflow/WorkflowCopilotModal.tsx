'use client'

import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import type { CopilotMessage, CopilotSuggestion } from '@/hooks/useWorkflowCopilot'
import type { SavedWorkflow } from '@/hooks/useWorkflows'
import styles from './WorkflowCopilotModal.module.css'

interface WorkflowCopilotModalProps {
  isOpen: boolean
  onClose: () => void
  messages: CopilotMessage[]
  loading: boolean
  error: string | null
  mode: 'generate' | 'refine'
  currentWorkflowName?: string
  lastSuggestion: CopilotSuggestion | null
  onSendPrompt: (prompt: string) => void
  onApplySuggestion: (suggestion: CopilotSuggestion) => void
}

export function WorkflowCopilotModal({
  isOpen,
  onClose,
  messages,
  loading,
  error,
  mode,
  currentWorkflowName,
  lastSuggestion,
  onSendPrompt,
  onApplySuggestion,
}: WorkflowCopilotModalProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, loading, onClose])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setInput('')
    onSendPrompt(trimmed)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  const placeholder = mode === 'generate'
    ? "Describe your workflow… e.g. 'When a new client is added in CRM, validate with AI and send a welcome email'"
    : "Describe a change… e.g. 'Insert a Slack notification after step 2'"

  return (
    <>
      {/* Backdrop — click outside to close */}
      <div
        className={styles.backdrop}
        onClick={() => { if (!loading) onClose() }}
        aria-hidden="true"
      />

      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="AIRA Copilot"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <img src="/Aivory_Avatar.svg" alt="" width={18} height={18} aria-hidden="true" />
            <span className={styles.headerTitle}>AIRA Copilot</span>
            {mode === 'refine' && currentWorkflowName && (
              <span className={styles.contextBadge}>Refining: {currentWorkflowName}</span>
            )}
            {mode === 'generate' && (
              <span className={styles.modeBadge}>Generate</span>
            )}
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            disabled={loading}
            aria-label="Close Copilot"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Messages area */}
        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              {mode === 'generate' ? (
                <>
                  <p className={styles.emptyTitle}>Describe your workflow</p>
                  <p className={styles.emptyHint}>
                    Tell AIRA what you want to automate and it'll build the steps for you.
                  </p>
                </>
              ) : (
                <>
                  <p className={styles.emptyTitle}>Refine your workflow</p>
                  <p className={styles.emptyHint}>
                    Ask AIRA to add, remove, or modify steps in your current workflow.
                  </p>
                </>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAssistant}`}
            >
              {msg.role === 'assistant' && (
                <img src="/Aivory_Avatar.svg" alt="AIRA" width={16} height={16} className={styles.messageAvatar} />
              )}
              <div className={styles.messageBubble}>
                <pre className={styles.messageText}>{msg.content}</pre>
                {/* Apply button on the last assistant message with a suggestion */}
                {msg.role === 'assistant' && msg.suggestion && i === messages.length - 1 && (
                  <button
                    className={styles.applyBtn}
                    onClick={() => onApplySuggestion(msg.suggestion!)}
                  >
                    Apply to canvas
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className={`${styles.message} ${styles.messageAssistant}`}>
              <img src="/Aivory_Avatar.svg" alt="AIRA" width={16} height={16} className={styles.messageAvatar} />
              <div className={styles.messageBubble}>
                <span className={styles.typingDots}>
                  <span /><span /><span />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Apply banner — shown when there's a pending suggestion and user scrolled up */}
        {lastSuggestion && messages.length > 0 && !loading && (
          <div className={styles.applyBanner}>
            <span>AIRA has a suggestion ready</span>
            <button
              className={styles.applyBannerBtn}
              onClick={() => onApplySuggestion(lastSuggestion)}
            >
              Apply to canvas
            </button>
          </div>
        )}

        {/* Input area */}
        <div className={styles.inputArea}>
          <textarea
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={loading}
            rows={2}
            aria-label="Message AIRA"
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            {loading ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="6" width="12" height="12" rx="1"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
        <p className={styles.inputHint}>⌘↵ to send</p>
      </div>
    </>
  )
}
