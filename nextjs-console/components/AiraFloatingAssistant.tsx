"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import ChatMessage from "@/components/ChatMessage"
import ChatInput from "@/components/ChatInput"
import { getSessionId } from "@/lib/session"
import { streamConsoleResponse } from "@/lib/streaming"
import type { Attachment } from "@/components/UploadMenu"
import styles from "./aira-fab.module.css"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
}

// Pages where the FAB should be visible
const ALLOWED_PATHS = ["/console", "/diagnostics", "/blueprint", "/roadmap", "/workflows"]

function getPageContext(pathname: string): string {
  if (pathname.startsWith("/console")) return "console"
  if (pathname.startsWith("/diagnostics")) return "diagnostic"
  if (pathname.startsWith("/blueprint")) return "blueprint"
  if (pathname.startsWith("/roadmap")) return "roadmap"
  if (pathname.startsWith("/workflows")) return "workflows"
  return ""
}

export default function AiraFloatingAssistant() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState("")
  const [prefill, setPrefill] = useState("")
  const [mounted, setMounted] = useState(false)
  const chatAreaRef = useRef<HTMLDivElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const pageContext = getPageContext(pathname)
  const visible = ALLOWED_PATHS.some(p => pathname.startsWith(p))

  // Init session once
  useEffect(() => {
    setSessionId(getSessionId())
  }, [])

  // Hydration guard
  useEffect(() => { setMounted(true) }, [])

  // Listen for aira:open events from other pages (e.g. Roadmap)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ prefill?: string }>).detail
      setOpen(true)
      if (detail?.prefill) {
        setPrefill(detail.prefill)
      }
    }
    window.addEventListener('aira:open', handler)
    return () => window.removeEventListener('aira:open', handler)
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight
    }
  }, [messages])

  // Focus close button when panel opens; return focus to FAB on close
  useEffect(() => {
    if (open) {
      setTimeout(() => closeBtnRef.current?.focus(), 50)
      // Clear prefill after panel opens so it doesn't persist on next open
      if (prefill) setTimeout(() => setPrefill(""), 200)
    }
  }, [open])

  // Escape key closes panel
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  // Focus trap inside panel
  useEffect(() => {
    if (!open || !panelRef.current) return
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener("keydown", trap)
    return () => document.removeEventListener("keydown", trap)
  }, [open, messages])

  const handleClose = useCallback(() => {
    setOpen(false)
    setTimeout(() => fabRef.current?.focus(), 50)
  }, [])

  const handleSend = async (content: string, attachment?: Attachment) => {
    const trimmed = content.trim()
    if (!trimmed && !attachment) return
    if (!sessionId) return

    const defaultMsg = attachment
      ? `Please analyze this ${attachment.type === "image" ? "image" : attachment.type === "blueprint" ? "blueprint" : "file"}`
      : ""

    let messageContent = trimmed || defaultMsg

    if (attachment) {
      const MAX = 20000
      const truncate = (t: string) =>
        t.length <= MAX ? t : t.substring(0, MAX) + "\n\n[Content truncated]"

      if (attachment.type === "json_schema" || attachment.type === "file") {
        messageContent = `File: ${attachment.filename}\n\nContent:\n${truncate(attachment.content ?? "")}\n\nQuestion: ${trimmed || defaultMsg}`
      } else if (attachment.type === "blueprint") {
        messageContent = `Blueprint v${attachment.version}\n\nContent:\n${truncate(JSON.stringify(attachment.data, null, 2))}\n\nQuestion: ${trimmed || defaultMsg}`
      }
    }

    // Inject page context into first message
    const contextPrefix =
      messages.length === 0 && pageContext
        ? `[Context: user is on the ${pageContext} page] `
        : ""

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed || defaultMsg,
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", isStreaming: true },
    ])

    try {
      const apiMessages = [
        ...messages,
        { ...userMsg, content: contextPrefix + messageContent },
      ].map(m => ({ role: m.role, content: m.content }))

      let accumulated = ""
      let hasError = false

      for await (const chunk of streamConsoleResponse("/api/aira/stream", {
        session_id: sessionId,
        organization_id: "demo_org",
        messages: apiMessages,
        // Pass page context so Zeroclaw can route skills appropriately
        context: { page: pageContext || "unknown" },
      } as any)) {
        if (chunk.type === "chunk" && chunk.content) {
          accumulated += chunk.content
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, content: accumulated, isStreaming: true }
                : m
            )
          )
        } else if (chunk.type === "error") {
          hasError = true
          const err = chunk.error || chunk.content || "Streaming error"
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? {
                    ...m,
                    content: accumulated
                      ? `${accumulated}\n\n⚠️ ${err}`
                      : `⚠️ ${err}`,
                    isStreaming: false,
                  }
                : m
            )
          )
          break
        } else if (chunk.type === "done") {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId ? { ...m, isStreaming: false } : m
            )
          )
          break
        }
      }

      if (!accumulated && !hasError) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "AIRA didn't respond. Please try again.",
                  isStreaming: false,
                }
              : m
          )
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                content: m.content
                  ? `${m.content}\n\n⚠️ ${msg}`
                  : `⚠️ ${msg}`,
                isStreaming: false,
              }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted || !visible) return null

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className={styles.overlay}
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Floating panel */}
      {open && (
        <div
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-label="AIRA assistant"
        >
          <div className={styles.panelHeader}>
            <Image
              src="/Aivory_Avatar.svg"
              alt=""
              width={24}
              height={24}
              aria-hidden="true"
            />
            <span className={styles.panelTitle}>AIRA</span>
            {pageContext && (
              <span className={styles.panelContext}>{pageContext}</span>
            )}
            <button
              ref={closeBtnRef}
              className={styles.closeBtn}
              onClick={handleClose}
              aria-label="Close AIRA assistant"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div ref={chatAreaRef} className={styles.chatArea}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateTitle}>Ask AIRA&trade;</div>
                <div className={styles.emptyStateText}>
                  Ask about your diagnostics, blueprints, roadmap, or workflows.
                </div>
              </div>
            ) : (
              messages.map(m => (
                <ChatMessage
                  key={m.id}
                  role={m.role}
                  content={m.content}
                  isStreaming={m.isStreaming}
                />
              ))
            )}
          </div>

          <div className={styles.inputArea}>
            <ChatInput onSend={handleSend} disabled={isLoading} prefill={prefill} />
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        ref={fabRef}
        className={styles.fab}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close AIRA assistant" : "Open AIRA assistant"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Image
          src="/Aivory_Avatar.svg"
          alt=""
          width={28}
          height={28}
          aria-hidden="true"
        />
      </button>
    </>
  )
}
