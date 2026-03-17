"use client"

import { useRouter } from "next/navigation"
import { useState, useRef, useEffect, useCallback } from "react"
import ChatMessage from "@/components/ChatMessage"
import ChatInput from "@/components/ChatInput"
import ConsoleTopBar from "@/components/console/ConsoleTopBar"
import { getSessionId, clearSession, generateSessionId, saveSession } from "@/lib/session"
import { streamConsoleResponse, validateFileSize } from "@/lib/streaming"
import { extractTextFromFile } from "@/lib/fileExtractor"
import { saveSessionMessages, loadSessionMessages, listSessions, ChatStorageError } from "@/lib/chatPersistence"
import type { Attachment } from "@/components/UploadMenu"
import styles from "./console.module.css"

interface Message { id: string; role: "user" | "assistant"; content: string; isStreaming?: boolean }
interface ChatSession { id: string; title: string; messages: Message[]; createdAt: number; pinned?: boolean }
interface Toast { id: string; type: "success" | "error"; message: string }

const QUICK_TEMPLATES = [
  "Generate onboarding workflow", "Check compliance gap", "Summarize my diagnostics",
  "Suggest automation opportunities", "Review my AI readiness",
]
const ALLOWED_TYPES = [
  "text/plain", "text/csv", "text/markdown", "application/json", "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png", "image/jpeg", "image/gif", "image/webp",
]

export default function ConsolePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const router = useRouter()
  const [currentSessionId, setCurrentSessionId] = useState<string>("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isDragging, setIsDragging] = useState(false)
  // Tracks message IDs where workflow/automation intent was detected
  const [workflowHints, setWorkflowHints] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const sid = getSessionId() || generateSessionId()
    saveSession(sid)
    setCurrentSessionId(sid)
    // Load persisted messages for this session
    const restored = loadSessionMessages(sid)
    if (restored.length > 0) setMessages(restored)
    // Load all sessions for sidebar
    setSessions(listSessions())
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(p => [...p, { id, type, message }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }, [])

  const handleSend = useCallback(async (text: string, atts: Attachment[]) => {
    if (!text.trim() && atts.length === 0) return
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text }
    setMessages(p => [...p, userMsg])
    setAttachments([])
    setIsStreaming(true)
    const assistantId = (Date.now() + 1).toString()
    setMessages(p => [...p, { id: assistantId, role: "assistant", content: "", isStreaming: true }])
    let finalContent = ""
    let streamError = false
    try {
      const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      const stream = streamConsoleResponse("/api/console/stream", {
        session_id: currentSessionId,
        organization_id: "default",
        messages: allMessages,
      })
      for await (const chunk of stream) {
        if (chunk.type === "chunk" && chunk.content) {
          finalContent += chunk.content
          setMessages(p => p.map(m => m.id === assistantId ? { ...m, content: m.content + chunk.content } : m))
        } else if (chunk.type === "workflow_spec" && chunk.workflow) {
          // AIRA detected a workflow intent — show hint to use Workflows tab
          setWorkflowHints(prev => new Set(prev).add(assistantId))
        } else if (chunk.type === "error") {
          addToast("error", chunk.error || "Something went wrong.")
          setMessages(p => p.filter(m => m.id !== assistantId))
          streamError = true
          break
        } else if (chunk.type === "done") {
          setMessages(p => p.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m))
        }
      }
    } catch {
      addToast("error", "Something went wrong. Please try again.")
      setMessages(p => p.filter(m => m.id !== assistantId))
      streamError = true
    } finally {
      setIsStreaming(false)
      // Persist messages after streaming completes successfully
      if (!streamError) {
        try {
          const updatedMessages = [...messages, userMsg, { id: assistantId, role: "assistant" as const, content: finalContent, isStreaming: false }]
          saveSessionMessages(currentSessionId, updatedMessages)
          setSessions(listSessions())
        } catch (e) {
          if (e instanceof ChatStorageError) {
            addToast("error", "Chat history storage is full. Messages may not be saved.")
          }
        }
      }
    }
  }, [currentSessionId, messages, addToast])

  const handleNewChat = useCallback(() => {
    // Save current session before clearing
    if (messages.length > 0) {
      try {
        saveSessionMessages(currentSessionId, messages)
      } catch (e) {
        if (e instanceof ChatStorageError) {
          addToast("error", "Chat history storage is full.")
        }
      }
    }
    clearSession()
    const sid = generateSessionId()
    saveSession(sid)
    setCurrentSessionId(sid)
    setMessages([])
    setWorkflowHints(new Set())
    setSessions(listSessions())
  }, [currentSessionId, messages, addToast])

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) { addToast("error", `Unsupported file: ${file.name}`); continue }
      const err = validateFileSize(file.size, file.name)
      if (err) { addToast("error", err); continue }
      const text = await extractTextFromFile(file)
      const attType: Attachment["type"] = file.type.startsWith("image/") ? "image" : "file"
      setAttachments(p => [...p, { type: attType, label: file.name, filename: file.name, content: text }])
    }
  }, [addToast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  /** Detect workflow/automation intent in a message */
  const hasWorkflowIntent = useCallback((text: string) => {
    const keywords = /\b(workflow|automation|otomasi|automate|build workflow|buat workflow|alur kerja|n8n)\b/i
    return keywords.test(text)
  }, [])

  /**
   * CTA language is derived from last user message language, not hardcoded.
   * Simple heuristic: if last user message contains common Indonesian markers → 'id', else 'en'.
   */
  const detectConversationLang = useCallback((): "en" | "id" => {
    const lastUserMsg = messages.filter(m => m.role === "user").slice(-1)[0]?.content || ""
    if (!lastUserMsg) return "en"
    const idMarkers = /\b(saya|aku|tolong|buat|buatkan|bagaimana|cara|dengan|untuk|dari|yang|ini|itu|sudah|belum|bisa|tidak|mau|ingin|mohon|silakan|terima kasih|otomasi|alur kerja)\b/i
    return idMarkers.test(lastUserMsg) ? "id" : "en"
  }, [messages])

  return (
    <div className={styles.consoleWrapper} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
      <ConsoleTopBar onNewChat={handleNewChat} />

      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <div key={toast.id} className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}>
            {toast.message}
          </div>
        ))}
      </div>

      <div className={styles.consoleBody}>
        <div className={styles.consoleContainer}>
          <div className={styles.chatArea}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateTitle}>Meet A.I.R.A™ (Aivory Intelligence & Reasoning Agent)</p>
                <p className={styles.emptyStateText}>Ask AIRA™ about your business goals, diagnostics, or AI System Blueprint, then turn them into workflows and automation.</p>
                <div className={styles.templates}>
                  {QUICK_TEMPLATES.map(tpl => (
                    <button key={tpl} className={styles.templateBtn} onClick={() => handleSend(tpl, [])}>
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map(m => (
                  <div key={m.id}>
                    <ChatMessage role={m.role} content={m.content} isStreaming={m.isStreaming} />
                    {/* Show workflow CTA hint when AIRA produced a workflow_spec or user message has workflow intent */}
                    {m.role === "assistant" && !m.isStreaming && (workflowHints.has(m.id) || hasWorkflowIntent(m.content)) && (() => {
                      const lang = detectConversationLang()
                      return (
                        <div className={styles.workflowCta}>
                          <span className={styles.workflowCtaIcon}>✦</span>
                          <span className={styles.workflowCtaText}>
                            {lang === "id"
                              ? "Untuk membangun dan mengaktifkan automation, gunakan AIRA Copilot di tab Workflows."
                              : "To build and activate automations, use AIRA Copilot in the Workflows tab."}
                          </span>
                          <button
                            className={styles.workflowCtaBtn}
                            onClick={() => router.push("/workflows")}
                          >
                            {lang === "id" ? "Buka Workflows →" : "Open Workflows →"}
                          </button>
                        </div>
                      )
                    })()}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className={styles.inputZone}>
            <ChatInput
              onSend={(text: string) => handleSend(text, attachments)}
              disabled={isStreaming}
            />
          </div>
        </div>

        {/* Sidebar toggle button */}
        <button
          className={`${styles.sidebarToggle} ${sidebarOpen ? styles.sidebarToggleOpen : ""}`}
          onClick={() => setSidebarOpen(p => !p)}
          title={sidebarOpen ? "Close history" : "Open history"}
        >
          {sidebarOpen ? "›" : "‹"}
        </button>

        {/* History sidebar */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? "" : styles.sidebarClosed}`}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>Chat History</span>
            <button className={styles.sidebarCloseBtn} onClick={() => setSidebarOpen(false)}>✕</button>
          </div>
          <div className={styles.sidebarList}>
            {sessions.length === 0
              ? <p className={styles.sidebarEmpty}>No chat history yet.</p>
              : sessions.map(s => (
                  <div
                    key={s.id}
                    className={`${styles.sidebarItem} ${s.id === currentSessionId ? styles.sidebarItemActive : ""}`}
                    onClick={() => {
                      if (s.id === currentSessionId) return
                      // Save current session first
                      if (messages.length > 0) {
                        try { saveSessionMessages(currentSessionId, messages) } catch {}
                      }
                      // Load target session
                      const loaded = loadSessionMessages(s.id)
                      setMessages(loaded)
                      setCurrentSessionId(s.id)
                      setWorkflowHints(new Set())
                      setSessions(listSessions())
                    }}
                  >
                    <div className={styles.sidebarItemContent}>
                      <div className={styles.sidebarItemTitle}>{s.title || "New chat"}</div>
                    </div>
                  </div>
                ))
            }
          </div>
        </aside>
      </div>

      {isDragging && (
        <div className={styles.dragOverlay}>
          <div className={styles.dragOverlayInner}>
            Drop files to attach
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" multiple hidden accept={ALLOWED_TYPES.join(",")}
        onChange={e => handleFileSelect(e.target.files)} />
    </div>
  )
}
