/**
 * Floating AIRA Streaming Proxy
 * Proxies to /aria/stream on the VPS bridge (Zeroclaw-orchestrated).
 * Keeps /api/console/stream untouched for the main AI Console tab.
 */

import { NextRequest } from 'next/server'
import { getConfig } from '@/lib/config'

// FIXED: TIMEOUT INCREASE — 120s to match bridge + Zeroclaw timeout
export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, organization_id, messages, context } = body

    if (!session_id || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: true, message: 'session_id and messages are required' },
        { status: 400 }
      )
    }

    const config = getConfig()
    const bridgeUrl = `${config.VPS_BRIDGE_URL}/aria/stream`

    // FIXED: TIMEOUT INCREASE — abort after 115s
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 115000)

    let bridgeResponse: Response
    try {
      bridgeResponse = await fetch(bridgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': config.VPS_BRIDGE_API_KEY,
        },
        body: JSON.stringify({ session_id, organization_id, messages, context }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!bridgeResponse.ok) {
      let msg = 'Bridge error'
      try { const e = await bridgeResponse.json(); msg = e.message || msg } catch { /* ignore */ }
      return Response.json({ error: true, message: msg }, { status: bridgeResponse.status })
    }

    // Stream bridge response straight through — bridge already sends heartbeats
    const sourceBody = bridgeResponse.body!
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    ;(async () => {
      const reader = sourceBody.getReader()
      // FIXED: STREAM HEARTBEAT — extra SSE ping every 8s in case bridge heartbeat is delayed
      const heartbeat = setInterval(async () => {
        try { await writer.write(new TextEncoder().encode(': ping\n\n')) } catch { /* closed */ }
      }, 8000)
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          await writer.write(value)
        }
      } catch { /* upstream closed */ } finally {
        clearInterval(heartbeat)
        try { await writer.close() } catch { /* already closed */ }
      }
    })()

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return Response.json({ error: true, message: 'Request timed out' }, { status: 504 })
    }
    console.error('[aira/stream] error:', error)
    return Response.json({ error: true, message: 'Internal error' }, { status: 500 })
  }
}
