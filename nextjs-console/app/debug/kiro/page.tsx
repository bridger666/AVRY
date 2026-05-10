'use client'

import { useState } from 'react'

export default function DebugKiroPage() {
  const [message, setMessage] = useState('')
  const [sessionId, setSessionId] = useState(`dev-${Date.now().toString(36)}`)
  const [response, setResponse] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) return
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const res = await fetch('/api/bridge/kiro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim(), sessionId }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(JSON.stringify(data, null, 2))
      } else {
        setResponse(JSON.stringify(data, null, 2))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 20px', fontFamily: 'monospace' }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Debug: Kiro via VPS Bridge</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
        POST /api/bridge/kiro → localhost:3003 (SSH tunnel) → VPS Bridge → Zeroclaw
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Session ID</label>
        <input
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, color: '#eee', fontSize: 13 }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Message</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={4}
          placeholder="Type a message for Kiro..."
          style={{ width: '100%', padding: '8px 10px', background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, color: '#eee', fontSize: 13, resize: 'vertical' }}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSend() }}
        />
      </div>

      <button
        onClick={handleSend}
        disabled={loading || !message.trim()}
        style={{
          padding: '10px 24px', background: loading ? '#333' : '#10b981', color: '#000',
          border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Sending...' : 'Send to Kiro via VPS Bridge'}
      </button>

      {error && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 14, color: '#f87171', marginBottom: 8 }}>Error</h3>
          <pre style={{ background: '#1a1a1a', border: '1px solid #f87171', borderRadius: 8, padding: 16, fontSize: 12, overflow: 'auto', color: '#f87171' }}>
            {error}
          </pre>
        </div>
      )}

      {response && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 14, color: '#10b981', marginBottom: 8 }}>Response from Zeroclaw</h3>
          <pre style={{ background: '#1a1a1a', border: '1px solid #10b981', borderRadius: 8, padding: 16, fontSize: 12, overflow: 'auto', color: '#f7f7f7' }}>
            {response}
          </pre>
        </div>
      )}
    </div>
  )
}
