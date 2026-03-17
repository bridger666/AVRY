"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import styles from './ChatMessage.module.css'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  compact?: boolean
}

/**
 * Normalizes plain-text LLM output so ReactMarkdown renders proper paragraphs.
 * Single newlines become double newlines (markdown paragraph breaks).
 * Already-doubled newlines are preserved.
 */
function normalizeMarkdown(text: string): string {
  // Replace single \n (not already doubled) with \n\n
  return text.replace(/\n(?!\n)/g, '\n\n')
}

type ResponseTab = 'summary' | 'json' | 'workflow'

interface ParsedResponse {
  hasTabs: boolean
  summary?: string
  json?: string
  workflow?: string
}

interface CodeBlockProps {
  inline?: boolean
  className?: string
  children?: React.ReactNode
}

function CodeBlock({ inline, className, children, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  // FIXED: NULL CHECK — lazy-load SyntaxHighlighter only on client to prevent
  // removeChild errors from hydration mismatch in React 18 Strict Mode
  const [Highlighter, setHighlighter] = useState<any>(null)
  const [highlightStyle, setHighlightStyle] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      import('react-syntax-highlighter').then(m => m.Prism),
      import('react-syntax-highlighter/dist/esm/styles/prism').then(m => m.vscDarkPlus),
    ]).then(([hl, style]) => {
      setHighlighter(() => hl)
      setHighlightStyle(style)
    })
  }, [])

  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''
  const code = String(children).replace(/\n$/, '')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (inline) {
    return (
      <code className={styles.inlineCode} {...props}>
        {children}
      </code>
    )
  }

  return (
    <div className={styles.codeBlockWrapper}>
      <div className={styles.codeBlockHeader}>
        <span className={styles.codeLanguage}>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className={styles.copyButton}
          aria-label="Copy code"
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3 11V3C3 2.44772 3.44772 2 4 2H10" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          )}
        </button>
      </div>
      {/* FIXED: STRICT MODE SAFE — only render after client mount to avoid removeChild crash */}
      {Highlighter && highlightStyle ? (
        <Highlighter
          language={language}
          style={highlightStyle}
          customStyle={{
            margin: 0,
            borderRadius: '0 0 8px 8px',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
          {...props}
        >
          {code}
        </Highlighter>
      ) : (
        <pre style={{ margin: 0, borderRadius: '0 0 8px 8px', fontSize: '14px', lineHeight: '1.5', padding: '12px', background: '#1e1e1e', overflowX: 'auto' }}>
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}

// Inline typing indicator shown inside the assistant bubble while waiting for first token
function InlineTypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {[0, 200, 400].map((delay, i) => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%', background: '#00e59e', flexShrink: 0,
            animation: 'typingBounce 1.2s ease-in-out infinite',
            animationDelay: `${delay}ms`,
            display: 'inline-block',
          }}
        />
      ))}
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 4, fontStyle: 'italic' }}>
        AIRA is thinking
      </span>
    </div>
  )
}

export default function ChatMessage({ role, content, isStreaming = false, compact = false }: ChatMessageProps) {
  const [activeTab, setActiveTab] = useState<ResponseTab>('summary')
  
  // Parse content to detect multiple response types
  const parseResponse = (text: string): ParsedResponse => {
    const summaryMatch = text.match(/###\s*SUMMARY\s*###\s*([\s\S]*?)(?=###\s*(?:JSON|WORKFLOW)\s*###|$)/i)
    const jsonMatch = text.match(/###\s*JSON\s*###\s*([\s\S]*?)(?=###\s*(?:SUMMARY|WORKFLOW)\s*###|$)/i)
    const workflowMatch = text.match(/###\s*WORKFLOW\s*###\s*([\s\S]*?)(?=###\s*(?:SUMMARY|JSON)\s*###|$)/i)
    
    const hasTabs = !!(summaryMatch || jsonMatch || workflowMatch)
    
    return {
      hasTabs,
      summary: summaryMatch ? summaryMatch[1].trim() : (!hasTabs ? text : undefined),
      json: jsonMatch ? jsonMatch[1].trim() : undefined,
      workflow: workflowMatch ? workflowMatch[1].trim() : undefined,
    }
  }
  
  const parsedResponse = role === 'assistant' ? parseResponse(content) : { hasTabs: false }
  
  const renderTabContent = () => {
    if (!parsedResponse.hasTabs) {
      return (
        <ReactMarkdown
          components={{
            code: CodeBlock as any,
          }}
        >
          {normalizeMarkdown(content)}
        </ReactMarkdown>
      )
    }
    
    let tabContent = ''
    if (activeTab === 'summary' && parsedResponse.summary) {
      tabContent = parsedResponse.summary
    } else if (activeTab === 'json' && parsedResponse.json) {
      tabContent = parsedResponse.json
    } else if (activeTab === 'workflow' && parsedResponse.workflow) {
      tabContent = parsedResponse.workflow
    }
    
    return (
      <ReactMarkdown
        components={{
          code: CodeBlock as any,
        }}
      >
        {normalizeMarkdown(tabContent)}
      </ReactMarkdown>
    )
  }
  
  return (
    <div className={`${styles.chatMessageRow} ${role === 'user' ? styles.user : styles.ai}`}>
      {role === 'user' ? (
        /* ── User: keep original bubble layout ── */
        <div className={`${styles.chatBubble} ${styles.userBubble} ${compact ? styles.compactBubble : ''}`}>
          <div className={`${styles.messageContent} ${compact ? styles.compactContent : ''}`}>
            {content}
          </div>
        </div>
      ) : (
        /* ── Assistant: flat card layout ── */
        <div className={`${styles.airaCard} ${compact ? styles.airaCardCompact : ''}`}>
          <div className={styles.airaCardHeader}>
            <Image
              src="/Aivory_Avatar.svg"
              alt="Aivory"
              width={22}
              height={22}
              className={styles.airaCardAvatar}
            />
          </div>

          {parsedResponse.hasTabs && (
            <div className={styles.tabsContainer}>
              {parsedResponse.summary && (
                <button
                  className={`${styles.tab} ${activeTab === 'summary' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('summary')}
                >
                  Summary
                </button>
              )}
              {parsedResponse.json && (
                <button
                  className={`${styles.tab} ${activeTab === 'json' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('json')}
                >
                  JSON
                </button>
              )}
              {parsedResponse.workflow && (
                <button
                  className={`${styles.tab} ${activeTab === 'workflow' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('workflow')}
                >
                  Workflow
                </button>
              )}
            </div>
          )}

          <div className={`${styles.airaCardBody} ${compact ? styles.compactContent : ''}`}>
            {isStreaming && !content ? (
              <InlineTypingIndicator />
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      )}
    </div>
  )
}
