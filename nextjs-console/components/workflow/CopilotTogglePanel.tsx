'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useCopilotPanel } from '@/hooks/useCopilotPanel'
import { useWorkflowCopilot } from '@/hooks/useWorkflowCopilot'
import type { CopilotMessage, CopilotSuggestion } from '@/hooks/useWorkflowCopilot'
import type { SavedWorkflow } from '@/hooks/useWorkflows'

const WORKFLOW_KEYWORDS = [
  'workflow', 'automate', 'automation', 'trigger', 'step', 'build', 'create',
  'generate', 'connect', 'integrate', 'integration', 'when', 'then', 'if',
  'send email', 'notify', 'schedule', 'run', 'execute', 'pipeline',
]

function isWorkflowIntent(text: string): boolean {
  const lower = text.toLowerCase()
  return WORKFLOW_KEYWORDS.some(kw => lower.includes(kw))
}

interface CopilotTogglePanelProps {
  currentWorkflowName?: string
  currentSpec: SavedWorkflow | null
  onApplySuggestion?: (suggestion: CopilotSuggestion) => void
}

export function CopilotTogglePanel({
  currentWorkflowName,
  currentSpec,
  onApplySuggestion,
}: CopilotTogglePanelProps) {
  const { isOpen, open, close, toggle } = useCopilotPanel()
  const { messages, loading, error, lastSuggestion, sendChat, buildWorkflow, clearMessages } = useWorkflowCopilot({ currentSpec })

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30">
      {isOpen ? (
        <CopilotBarExpanded
          onClose={close}
          messages={messages}
          loading={loading}
          error={error}
          lastSuggestion={lastSuggestion}
          onSendChat={sendChat}
          onBuildWorkflow={buildWorkflow}
          onApplySuggestion={onApplySuggestion}
          clearMessages={clearMessages}
        />
      ) : (
        <CopilotBarCollapsed onClick={open} />
      )}
    </div>
  )
}

/* ── Collapsed bar (pill) ─────────────────────────────── */

function CopilotBarCollapsed({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2d2d2a] border border-white/10 text-[#e4e4e7] text-sm font-medium cursor-pointer shadow-lg hover:border-[#00e59e]/40 hover:shadow-xl transition-all duration-150 select-none"
      onClick={onClick}
      aria-label="Open Aivory Copilot"
    >
      <img src="/Aivory_Avatar.svg" alt="" className="w-4 h-4" aria-hidden="true" />
      <span>Aivory Copilot</span>
      <span className="text-xs text-[#a1a1aa] ml-1">/ or &#8984;K</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#a1a1aa] ml-0.5">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
  )
}

/* ── Expanded bar ─────────────────────────────────────── */

interface CopilotBarExpandedProps {
  onClose: () => void
  messages: CopilotMessage[]
  loading: boolean
  error: string | null
  lastSuggestion: CopilotSuggestion | null
  onSendChat: (msg: string) => void
  onBuildWorkflow: (prompt: string) => void
  onApplySuggestion?: (suggestion: CopilotSuggestion) => void
  clearMessages?: () => void
}

function CopilotBarExpanded({
  onClose, messages, loading, error,
  lastSuggestion, onSendChat, onBuildWorkflow,
  onApplySuggestion, clearMessages,
}: CopilotBarExpandedProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus textarea when bar opens
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 80)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(Math.max(ta.scrollHeight, 24), 120) + 'px'
  }

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    if (isWorkflowIntent(trimmed)) onBuildWorkflow(trimmed)
    else onSendChat(trimmed)
  }, [input, loading, onSendChat, onBuildWorkflow])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const hasMessages = messages.length > 0 || loading

  return (
    <div
      className="w-[520px] max-w-[90vw] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
      style={{ background: '#353531', maxHeight: 'calc(100vh - 160px)' }}
      role="dialog"
      aria-label="Aivory Copilot"
    >
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0 border-b border-white/10" style={{ background: '#2d2d2a' }}>
        <div className="flex items-center gap-2">
          <img src="/Aivory_Avatar.svg" alt="Aivory" className="w-4 h-4" />
          <span className="font-semibold text-xs text-[#e4e4e7]">Copilot</span>
          <span className="text-[10px] text-[#a1a1aa] px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.04]">AI beta</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {clearMessages && messages.length > 0 && (
            <button
              className="flex items-center justify-center w-6 h-6 rounded-md bg-transparent text-[#a1a1aa] hover:bg-white/5 hover:text-[#e4e4e7] transition-all duration-150"
              onClick={clearMessages}
              title="Clear"
              aria-label="Clear conversation"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
            </button>
          )}
          <button
            className="flex items-center justify-center w-6 h-6 rounded-md bg-transparent text-[#a1a1aa] hover:bg-white/5 hover:text-[#e4e4e7] transition-all duration-150"
            onClick={onClose}
            title="Collapse"
            aria-label="Collapse copilot"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Greeting (shown when no messages) ── */}
      {!hasMessages && (
        <div className="px-5 pt-3 pb-1.5 text-center">
          <h2 className="text-sm font-semibold text-[#e4e4e7] m-0 leading-tight">
            What would you like to automate?
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-0.5 m-0 leading-relaxed">
            Describe a workflow or ask about automation ideas.
          </p>
        </div>
      )}

      {/* ── Chat messages (shown when there are messages) ── */}
      {hasMessages && (
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5" style={{ maxHeight: '360px' }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="shrink-0 mt-0.5">
                  <img src="/Aivory_Avatar.svg" alt="Aivory" className="w-4 h-4" />
                </div>
              )}
              <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                <p className={`text-xs leading-relaxed m-0 px-3 py-2 rounded-[10px] whitespace-pre-wrap break-words ${
                  msg.role === 'user'
                    ? 'bg-[#282825] border border-white/5 text-[#e4e4e7] rounded-br-[2px]'
                    : 'bg-white/[0.04] border border-white/5 text-[#e4e4e7] rounded-bl-[2px]'
                }`}>
                  {msg.content}
                </p>
                {msg.suggestion && onApplySuggestion && (
                  <button
                    className="text-xs font-semibold px-3 py-1.5 rounded-md border border-[#10B981]/35 bg-[#10B981]/10 text-[#10B981] cursor-pointer hover:bg-[#10B981]/20 transition-colors duration-150"
                    onClick={() => onApplySuggestion(msg.suggestion!)}
                  >
                    Apply to canvas
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2">
              <div className="shrink-0 mt-0.5">
                <img src="/Aivory_Avatar.svg" alt="Aivory" className="w-4 h-4" />
              </div>
              <div className="px-3 py-2 bg-white/[0.04] border border-white/5 rounded-[10px] rounded-bl-[2px]">
                <div className="flex gap-1">
                  {[0, 1, 2].map((idx) => (
                    <span
                      key={idx}
                      className="w-[5px] h-[5px] rounded-full bg-[#a1a1aa] animate-bounce"
                      style={{ animationDelay: `${idx * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400 m-1 px-1">{error}</p>}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* ── Suggestion banner ── */}
      {lastSuggestion && onApplySuggestion && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#10B981]/[0.06] border-t border-[#10B981]/20 shrink-0">
          <span className="text-xs text-[#10B981] font-medium">Workflow ready — {lastSuggestion.steps.length} steps</span>
          <button
            className="text-xs font-semibold px-3 py-1 rounded-md border border-[#10B981]/35 bg-[#10B981]/10 text-[#10B981] cursor-pointer hover:bg-[#10B981]/20 transition-colors duration-150"
            onClick={() => onApplySuggestion(lastSuggestion)}
          >
            Apply to canvas
          </button>
        </div>
      )}

      {/* ── Input area ── */}
      <div className="shrink-0 px-4 py-3 border-t border-white/10" style={{ background: '#2d2d2a' }}>
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg text-[#e4e4e7] text-sm px-3 py-2 outline-none resize-none leading-relaxed overflow-y-auto transition-colors duration-150 focus:border-[#10B981]/40 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[#a1a1aa]"
            style={{ minHeight: '24px', maxHeight: '120px' }}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter an idea or app name to get started"
            disabled={loading}
            rows={1}
            aria-label="Message Aivory"
          />
          <button
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#10B981] text-black shrink-0 cursor-pointer hover:bg-[#10B981]/90 transition-colors duration-150 disabled:opacity-35 disabled:cursor-not-allowed"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            aria-label="Send"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"/>
              <polyline points="5 12 12 5 19 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
