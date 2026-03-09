"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import ChatMessage from "@/components/ChatMessage"
import ChatInput from "@/components/ChatInput"
import ConsoleTopBar from "@/components/console/ConsoleTopBar"
import { getSessionId, clearSession, generateSessionId, saveSession } from "@/lib/session"
import { streamConsoleResponse, validateFileSize, MAX_FILE_BYTES } from "@/lib/streaming"
import { extractTextFromFile } from "@/lib/fileExtractor"
import type { Attachment } from "@/components/UploadMenu"
import styles from './console.module.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  pinned?: boolean
}

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

const QUICK_TEMPLATES = [
  'Generate onboarding workflow',
  'Check compliance gap',
  'Summarize my diagnostics',
  'Suggest automation opportunities',
  'Review my AI readiness',
]

const ALLOWED_TYPES = [
  'text/plain', 'text/csv', 'text/markdown',
  'application/json', 'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
]

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export default function ConsolePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<Array<{ name: string; content: string; type: string }>>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string>('')
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [prefill, setPrefill] = useState('')
  const chatAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  // Prevent browser from opening files on dragover only.
  // drop is NOT blocked here — React onDrop on the wrapper div handles it.
  useEffect(() => {
    const blockDragover = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }
    document.addEventListener('dragover', blockDragover, { capture: true })
    window.addEventListener('dragover', blockDragover, { capture: true })
    return () => {
      document.removeEventListener('dragover', blockDragover, { capture: true })
      window.removeEventListener('dragover', blockDragover, { capture: true })
    }
  }, [])

  // Session init
  useEffect(() => {
    const sid = getSessionId()
    setSessionId(sid)
    setActiveSessionId(sid)
    try {
      const stored = localStorage.getItem('aira_sessions')
      if (stored) setSessions(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  // Persist sessions
  useEffect(() => {
    if (sessions.length > 0) {
      try { localStorage.setItem('aira_sessions', JSON.stringify(sessions)) } catch { /* ignore */ }
    }
  }, [sessions])

  const scrollToBottom = useCallback(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight
    }
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, type, message }])
    const timer = window.setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
    return timer
  }, [])

  const saveCurrentSession = useCallback((msgs: Message[]) => {
    if (msgs.length === 0) return
    const title = msgs[0].content.slice(0, 48) + (msgs[0].content.length > 48 ? '...' : '')
    setSessions(prev => {
      const existing = prev.find(s => s.id === activeSessionId)
      if (existing) {
        return prev.map(s => s.id === activeSessionId ? { ...s, messages: msgs, title } : s)
      }
      return [{ id: activeSessionId, title, messages: msgs, createdAt: Date.now() }, ...prev]
    })
  }, [activeSessionId])

  const handleNewChat = useCallback(() => {
    if (messages.length > 0) saveCurrentSession(messages)
    clearSession()
    const newSid = generateSessionId()
    saveSession(newSid)
    setSessionId(newSid)
    setActiveSessionId(newSid)
    setMessages([])
    setPendingFiles([])
    setPrefill('')
  }, [messages, saveCurrentSession])

  const loadSession = useCallback((session: ChatSession) => {
    if (messages.length > 0) saveCurrentSession(messages)
    setMessages(session.messages)
    setActiveSessionId(session.id)
    setSessionId(session.id)
    setShowSidebar(false)
  }, [messages, saveCurrentSession])

  const togglePin = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSessions(prev => prev.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s))
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const processDroppedFile = useCallback(async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith('.md')) {
      showToast('error', `File type not supported: ${file.name}`)
      return
    }
    // Use centralised size check from streaming lib (5 MB limit)
    const sizeError = validateFileSize(file.size, file.name)
    if (sizeError) {
      showToast('error', sizeError)
      return
    }
    try {
      const text = await extractTextFromFile(file)
      setPendingFiles(prev => [...prev, { name: file.name, content: text, type: file.type }])
      showToast('success', `File ready: ${file.name}`)
    } catch {
      showToast('error', `Could not read file: ${file.name}`)
    }
  }, [showToast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processDroppedFile(file)
  }, [processDroppedFile])

  const handleDropzoneClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processDroppedFile(file)
    e.target.value = ''
  }, [processDroppedFile])

  const handleSend = useCallback(async (content: string, attachment?: Attachment) => {
    const trimmedContent = content.trim()
    const defaultMsg = attachment
      ? `Please analyze this ${attachment.type === 'image' ? 'image' : attachment.type === 'blueprint' ? 'blueprint' : 'file'} and provide insights.`
      : ''

    if (!trimmedContent && !attachment && pendingFiles.length === 0) return

    if (!sessionId) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Session error: Unable to send message. Please refresh the page.',
        isStreaming: false
      }])
      return
    }

    const MAX_CONTENT_CHARS = 20000
    const userInstruction = trimmedContent || defaultMsg
    let messageContent = userInstruction

    if (pendingFiles.length > 0 && !attachment) {
      const fileParts = pendingFiles.map(f => {
        const body = f.content.length <= MAX_CONTENT_CHARS
          ? f.content
          : f.content.substring(0, MAX_CONTENT_CHARS) + '\n\n[Content truncated at 20,000 characters.]'
        return `File: ${f.name}\n\nContent:\n${body}`
      })
      messageContent = fileParts.join('\n\n---\n\n') + `\n\nUser question: ${userInstruction}`
    }

    if (attachment) {
      const truncate = (text: string) =>
        text.length <= MAX_CONTENT_CHARS ? text : text.substring(0, MAX_CONTENT_CHARS) + '\n\n[Content truncated.]'
      if (attachment.type === 'json_schema' || attachment.type === 'file') {
        messageContent = `File uploaded: ${attachment.filename}\n\nContent:\n${truncate(attachment.content ?? '')}\n\nUser question: ${userInstruction}`
      } else if (attachment.type === 'image') {
        messageContent = `Image uploaded: ${attachment.filename}\n\nUser question: ${userInstruction}`
      } else if (attachment.type === 'blueprint') {
        messageContent = `Blueprint uploaded: version ${attachment.version}\n\nContent:\n${truncate(JSON.stringify(attachment.data, null, 2))}\n\nUser question: ${userInstruction}`
      }
    }

    const fileNote = pendingFiles.length > 0
      ? `\n\n+ ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''} attached: ${pendingFiles.map(f => f.name).join(', ')}`
      : ''
    setPendingFiles([])
    setPrefill('')

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: (trimmedContent || defaultMsg) + fileNote
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', isStreaming: true }])

    try {
      const apiMessages = [...messages, { ...userMessage, content: messageContent }].map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      let accumulatedContent = ''
      let hasError = false

      for await (const chunk of streamConsoleResponse('/api/console/stream', {
        session_id: sessionId,
        organization_id: 'demo_org',
        messages: apiMessages
      })) {
        if (chunk.type === 'chunk' && chunk.content) {
          accumulatedContent += chunk.content
          setMessages(prev => prev.map(msg =>
            msg.id === assistantId ? { ...msg, content: accumulatedContent, isStreaming: true } : msg
          ))
          scrollToBottom()
        } else if (chunk.type === 'error') {
          hasError = true
          const errorMessage = chunk.error || chunk.content || 'An error occurred during streaming'
          if (process.env.NODE_ENV === 'development') {
            console.error('[console] stream error chunk:', { errorMessage, accumulatedContent: accumulatedContent.length })
          }
          setMessages(prev => prev.map(msg =>
            msg.id === assistantId
              ? { ...msg, content: accumulatedContent ? `${accumulatedContent}\n\nError: ${errorMessage}` : `Error: ${errorMessage}`, isStreaming: false }
              : msg
          ))
          showToast('error', 'AIRA encountered an error')
          break
        } else if (chunk.type === 'done') {
          // chunk.receivedContent is set by our streaming lib — true if tokens were streamed
          if (!accumulatedContent && !chunk.receivedContent) {
            // Server finished but sent nothing — genuine empty response
            hasError = true
            if (process.env.NODE_ENV === 'development') {
              console.error('[console] done event with no content received')
            }
            setMessages(prev => prev.map(msg =>
              msg.id === assistantId
                ? { ...msg, content: 'AIRA returned an empty response. Please try again.', isStreaming: false }
                : msg
            ))
          } else {
            setMessages(prev => prev.map(msg =>
              msg.id === assistantId ? { ...msg, isStreaming: false } : msg
            ))
          }
          break
        }
      }

      // Only show fallback if the loop ended without any content AND no error was already shown
      if (!accumulatedContent && !hasError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[console] stream loop exited with no content and no error — possible SSE framing issue')
        }
        setMessages(prev => prev.map(msg =>
          msg.id === assistantId
            ? { ...msg, content: 'AIRA returned an empty response. Please try again.', isStreaming: false }
            : msg
        ))
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      if (process.env.NODE_ENV === 'development') {
        console.error('[console] handleSend caught:', error)
      }
      setMessages(prev => prev.map(msg => {
        if (msg.id !== assistantId) return msg
        return { ...msg, content: msg.content ? `${msg.content}\n\nConnection error: ${errorMsg}` : `Connection error: ${errorMsg}`, isStreaming: false }
      }))
      showToast('error', 'Connection error')
    } finally {
      setIsLoading(false)
      setMessages(prev => { saveCurrentSession(prev); return prev })
    }
  }, [messages, sessionId, pendingFiles, scrollToBottom, showToast, saveCurrentSession])

  const filteredSessions = sessions
    .filter(s => s.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt)

  // Show standalone typing row only before the streaming assistant bubble is added.
  // Once the assistant message exists (even empty), ChatMessage renders the inline indicator.
  const hasStreamingBubble = messages.some(m => m.role === 'assistant' && m.isStreaming)

  return (
    <div
      className={styles.consoleWrapper}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ConsoleTopBar onNewChat={handleNewChat} />

      <div className={styles.toastContainer}>
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${t.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
            {t.type === 'success'
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            }
            {t.message}
          </div>
        ))}
      </div>

      {isDragging && (
        <div className={styles.dragOverlay}>
          <div className={styles.dragOverlayInner}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Drop file to attach
          </div>
        </div>
      )}

      <div className={styles.consoleBody}>
        <div className={styles.consoleContainer}>
          <div className={styles.chatArea} ref={chatAreaRef}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateTitle}>
                  Meet A.I.R.A<span style={{ color: '#fff' }}>&trade;</span> (Aivory Intelligence &amp; Readiness Assistant)
                </div>
                <div className={styles.emptyStateText}>
                  Ask AIRA<span style={{ color: '#fff' }}>&trade;</span> about your business goals, diagnostics, or AI System Blueprint, then turn them into workflows and automation.
                </div>
                <div className={styles.templates} style={{ marginTop: 8 }}>
                  {QUICK_TEMPLATES.map(tpl => (
                    <button key={tpl} className={styles.templateBtn} onClick={() => setPrefill(tpl)}>
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(message => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  isStreaming={message.isStreaming}
                />
              ))
            )}

            {isLoading && !hasStreamingBubble && (
              <div className={styles.typingRow}>
                <div className={styles.typingBubble}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingLabel}>AIRA is thinking</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.inputZone}>
            {pendingFiles.length > 0 && (
              <div className={styles.pendingFilesList}>
                {pendingFiles.map((f, i) => (
                  <div key={i} className={styles.pendingFile}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>{f.name}</span>
                    <button className={styles.pendingFileRemove} onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))} aria-label="Remove file">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {messages.length > 0 && (
              <div className={styles.templates}>
                {QUICK_TEMPLATES.map(tpl => (
                  <button key={tpl} className={styles.templateBtn} onClick={() => setPrefill(tpl)}>
                    {tpl}
                  </button>
                ))}
              </div>
            )}

            <div
              className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleDropzoneClick}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleDropzoneClick()}
              aria-label="Attach file"
            >
              <svg className={styles.dropzoneIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span className={styles.dropzoneText}>Drag files here or click — TXT, CSV, MD, JSON, PDF, DOCX, images (max 10MB)</span>
            </div>
            <input
              ref={fileInputRef}
              id="console-file-input"
              name="console-file-input"
              type="file"
              accept=".txt,.csv,.md,.json,.pdf,.docx,image/*"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />

            <ChatInput onSend={handleSend} disabled={isLoading} prefill={prefill} hasPendingFiles={pendingFiles.length > 0} />
          </div>
        </div>

        <button
          className={styles.sidebarToggle}
          onClick={() => setShowSidebar(v => !v)}
          aria-label={showSidebar ? 'Close history' : 'Open history'}
          title="Chat history"
        >
          {showSidebar
            ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          }
        </button>

        {showSidebar && (
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarTitle}>Chat History</span>
              <button className={styles.sidebarCloseBtn} onClick={() => setShowSidebar(false)} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.sidebarSearch}>
              <input
                id="sidebar-search"
                name="sidebar-search"
                className={styles.sidebarSearchInput}
                placeholder="Search chats..."
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
              />
            </div>
            <div className={styles.sidebarList}>
              {filteredSessions.length === 0 ? (
                <div className={styles.sidebarEmpty}>
                  {sessions.length === 0 ? 'No chat history yet.\nStart a conversation to save it here.' : 'No results found.'}
                </div>
              ) : filteredSessions.map(session => (
                <div
                  key={session.id}
                  className={`${styles.sidebarItem} ${session.id === activeSessionId ? styles.sidebarItemActive : ''} ${session.pinned ? styles.sidebarItemPinned : ''}`}
                  onClick={() => loadSession(session)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && loadSession(session)}
                >
                  <div className={styles.sidebarItemContent}>
                    <div className={styles.sidebarItemTitle}>{session.title}</div>
                    <div className={styles.sidebarItemMeta}>{relativeTime(session.createdAt)}</div>
                  </div>
                  <button
                    className={`${styles.sidebarPinBtn} ${session.pinned ? styles.sidebarPinBtnActive : ''}`}
                    onClick={e => togglePin(session.id, e)}
                    aria-label={session.pinned ? 'Unpin' : 'Pin'}
                    title={session.pinned ? 'Unpin' : 'Pin'}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={session.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
