"use client"

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react"
import UploadMenu, { Attachment } from "./UploadMenu"

interface ChatInputProps {
  onSend: (message: string, attachment?: Attachment) => void
  disabled?: boolean
  prefill?: string
  hasPendingFiles?: boolean
}

export default function ChatInput({ onSend, disabled = false, prefill, hasPendingFiles = false }: ChatInputProps) {
  const [message, setMessage] = useState(prefill ?? "")

  useEffect(() => {
    if (prefill) {
      setMessage(prefill)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
          textareaRef.current.focus()
        }
      }, 50)
    }
  }, [prefill])
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false)
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [toast, setToast] = useState("")
  const [extracting, setExtracting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed && !attachment && !hasPendingFiles) return
    if (disabled) return

    const finalMessage = trimmed || `Please analyze this ${attachment?.type === 'image' ? 'image' : attachment?.type === 'blueprint' ? 'blueprint' : 'file'}`
    onSend(finalMessage, attachment ?? undefined)
    setMessage("")
    setAttachment(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  const canSend = !disabled && !extracting && (!!message.trim() || !!attachment || hasPendingFiles)

  return (
    <div className="input-wrapper">
      {/* Toast */}
      {toast && (
        <div className="attachment-toast" role="status">{toast}</div>
      )}

      <div className="input-box">
        <button
          className="add-btn"
          onClick={() => setUploadMenuOpen(!uploadMenuOpen)}
          aria-label="Add attachment"
          aria-expanded={uploadMenuOpen}
        >
          +
        </button>

        {/* Attachment chip — shows extracting state while PDF/DOCX is being processed */}
        {(attachment || extracting) && (
          <div className="attachment-chip">
            <span className="attachment-chip-label">
              {extracting ? '⏳ Extracting…' : attachment?.label}
            </span>
            {!extracting && (
              <button
                className="attachment-chip-remove"
                onClick={() => setAttachment(null)}
                aria-label="Remove attachment"
              >
                ✕
              </button>
            )}
          </div>
        )}

        <textarea
          ref={textareaRef}
          placeholder="Send Message to AIRA..."
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!canSend}
        >
          Send
        </button>

        <UploadMenu
          isOpen={uploadMenuOpen}
          onClose={() => setUploadMenuOpen(false)}
          onAttach={(a) => { setAttachment(a); setUploadMenuOpen(false) }}
          onToast={showToast}
          onExtractingChange={setExtracting}
        />
      </div>
    </div>
  )
}
