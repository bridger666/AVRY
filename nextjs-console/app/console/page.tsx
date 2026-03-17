"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import ChatMessage from "@/components/ChatMessage"
import ChatInput from "@/components/ChatInput"
import ConsoleTopBar from "@/components/console/ConsoleTopBar"
import { getSessionId, clearSession, generateSessionId, saveSession } from "@/lib/session"
import { streamConsoleResponse, validateFileSize, MAX_FILE_BYTES } from "@/lib/streaming"
import { extractTextFromFile } from "@/lib/fileExtractor"
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
  const [currentSessionId, setCurrentSessionId] = useState<string>("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const sid = getSessionId() || generateSessionId()
    saveSession(sid)
    setCurrentSessionId(sid)
    const saved = localStorage.getItem("aivory_sessions")
    if (saved) setSessions(JSON.parse(saved))
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
    try {
      await streamConsoleResponse(
        text, atts, currentSessionId,
        (chunk) => setMessages(p => p.map(m => m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
        () => setMessages(p => p.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m))
      )
    } catch {
      addToast("error", "Something went wrong. Please try again.")
      setMessages(p => p.filter(m => m.id !== assistantId))
    } finally {
      setIsStreaming(false)
    }
  }, [currentSessionId, addToast])

  const handleNewChat = useCallback(() => {
    clearSession()
    const sid = generateSessionId()
    saveSession(sid)
    setCurrentSessionId(sid)
    setMessages([])
  }, [])

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) { addToast("error", `Unsupported file: ${file.name}`); continue }
      const err = validateFileSize(file, MAX_FILE_BYTES)
      if (err) { addToast("error", err); continue }
      const text = await extractTextFromFile(file)
      setAttachments(p => [...p, { name: file.name, content: text, type: file.type }])
    }
  }, [addToast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleGenerateWorkflow = useCallback(() => {
    const lastUserMsg = messages.filter(m => m.role === "user").slice(-1)[0]?.content || ""
    window.location.href = `/workflows?generate=${encodeURIComponent(lastUserMsg || "Generate a workflow")}`
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
                <button className={styles.generateWorkflowBtn} onClick={handleGenerateWorkflow}>
                  ✦ Generate Workflow on Canvas
                </button>
              </div>
            ) : (
              <>
                {messages.map(m => <ChatMessage key={m.id} message={m} />)}
                <div className={styles.generateBtnFloating}>
                  <button className={styles.generateWorkflowBtn} onClick={handleGenerateWorkflow}>
                    ✦ Generate Workflow on Canvas
                  </button>
                </div>
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className={styles.inputZone}>
            <ChatInput
              onSend={handleSend}
              onFileSelect={handleFileSelect}
              attachments={attachments}
              onRemoveAttachment={(i) => setAttachments(p => p.filter((_, idx) => idx !== i))}
              isStreaming={isStreaming}
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
                    onClick={() => setCurrentSessionId(s.id)}
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
