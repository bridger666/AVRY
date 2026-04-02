"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import ChatMessage from "@/components/ChatMessage"
import ChatInput from "@/components/ChatInput"
import { getSessionId } from "@/lib/session"
import { streamConsoleResponse } from "@/lib/streaming"
import { loadRoadmap } from "@/hooks/useRoadmap"
import type { AiryRoadmap } from "@/types/roadmap"
import type { Attachment } from "@/components/UploadMenu"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
}

// Pages where the FAB should be visible
const ALLOWED_PATHS = ["/diagnostics", "/blueprint", "/roadmap", "/workflows"]

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
  // Context from non-console tab triggers
  const [activeSourceTab, setActiveSourceTab] = useState<string>("")
  const [activePageContext, setActivePageContext] = useState<Record<string, unknown>>({})
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
      const detail = (e as CustomEvent<{ prefill?: string; sourceTab?: string; pageContext?: Record<string, unknown> }>).detail
      setOpen(true)
      if (detail?.prefill) {
        setPrefill(detail.prefill)
      }
      if (detail?.sourceTab) {
        setActiveSourceTab(detail.sourceTab)
      }
      if (detail?.pageContext) {
        setActivePageContext(detail.pageContext)
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
    setActiveSourceTab("")
    setActivePageContext({})
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
      // Single canonical path for ALL tabs: /api/aira/stream → /bridge/aira → Zeroclaw
      // Tab-specific context (source_tab + pageContext) is passed via the `context` field.
      // When on roadmap page, include mode=roadmap_explain and the full AiryRoadmap object.
      const effectiveSourceTab = activeSourceTab || pageContext || "unknown"
      const isRoadmap = effectiveSourceTab === "roadmap"
      const currentRoadmap: AiryRoadmap | null = isRoadmap ? loadRoadmap() : null
      const contextPrefix =
        messages.length === 0 && effectiveSourceTab
          ? `[Context: user is on the ${effectiveSourceTab} page] `
          : ""

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
        context: {
          page: effectiveSourceTab,
          mode: isRoadmap ? "roadmap_explain" : "general",
          source_tab: activeSourceTab || pageContext || "unknown",
          ...(isRoadmap && currentRoadmap ? { roadmap: currentRoadmap } : {}),
          pageContext: activePageContext,
        },
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
                      ? `${accumulated}\n\nError: ${err}`
                      : `Error: ${err}`,
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
                  content: "Aivory didn't respond. Please try again.",
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
                  ? `${m.content}\n\nError: ${msg}`
                  : `Error: ${msg}`,
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
          className="md:hidden fixed inset-0 bg-black/55 z-[1001]"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Floating panel */}
      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-6 right-6 z-50 w-80 md:w-96 rounded-2xl overflow-hidden bg-[#353531] backdrop-blur-xl border border-white/8 flex flex-col animate-in fade-in-0 zoom-in-95 duration-200 ease-out"
          style={{
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            borderTop: '2px solid transparent',
            background: '#353531'
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Aivory assistant"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-soft flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <Image
                src="/Aivory_Avatar.svg"
                alt=""
                width={20}
                height={20}
                aria-hidden="true"
              />
              <span className="font-semibold text-sm text-text-primary">Aivory</span>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online</span>
              </div>
            </div>
            {(activeSourceTab || pageContext) && (
              <span className="text-xs text-white/35 uppercase tracking-wider">{activeSourceTab || pageContext}</span>
            )}
            <button
              ref={closeBtnRef}
              className="text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-white/8 transition-colors duration-150"
              onClick={handleClose}
              aria-label="Close Aivory assistant"
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

          <div ref={chatAreaRef} className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1 scrollbar-thin scrollbar-thumb-white/1 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-6">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center animate-pulse">
                  <Image
                    src="/Aivory_Avatar.svg"
                    alt=""
                    width={32}
                    height={32}
                  />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-text-primary mb-2">Ask Aivory</div>
                  <div className="text-text-secondary text-sm max-w-xs">
                    Ask about your diagnostics, blueprints, roadmap, or workflows.
                  </div>
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

          <div className="border-t border-border-soft p-3 flex-shrink-0">
            <ChatInput onSend={handleSend} disabled={isLoading} prefill={prefill} />
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        ref={fabRef}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg hover:scale-105 transition-transform duration-200 flex items-center justify-center flex-shrink-0 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-3"
        style={{
          background: 'rgba(0,229,158,0.15)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(0,229,158,0.3)',
        }}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close Aivory assistant" : "Open Aivory assistant"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Image
          src="/Aivory_Avatar.svg"
          alt=""
          width={20}
          height={20}
          aria-hidden="true"
        />
      </button>
    </>
  )
}
