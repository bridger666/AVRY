/**
 * CANONICAL AIRA ENTRY POINT — do NOT add alternative routes or branch by tab here.
 * All AIRA chat traffic from every tab (console, roadmap, diagnostic, workflow, blueprint)
 * flows through this single route.
 *
 * Path: AiraFloatingAssistant → POST /api/aira/stream → /bridge/aira → Zeroclaw → OpenRouter
 *
 * Tab-specific context (source_tab + pageContext) is forwarded via the `context` field.
 * Proxies to /bridge/aira on the VPS bridge (Zeroclaw-orchestrated).
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
    // Route through /bridge/aira — the single ZeroClaw entry point
    const bridgeUrl = `${config.VPS_BRIDGE_URL}/bridge/aira`

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
        body: JSON.stringify({
        message: messages.filter((m: { role: string }) => m.role === 'user').at(-1)?.content ?? '',
        context: { session_id, organization_id, history: messages, ...context }
      }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!bridgeResponse.ok) {
      let msg = 'Bridge error'
      try { const e = await bridgeResponse.json(); msg = e.message || e.detail || msg } catch { /* ignore */ }
      return Response.json({ error: true, message: msg }, { status: bridgeResponse.status })
    }

    // /bridge/aira returns JSON — convert to SSE for the frontend chat stream
    const bridgeData = await bridgeResponse.json() as { raw_agent_response?: string }
    const text = bridgeData.raw_agent_response ?? ''
    const enc = new TextEncoder()

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    ;(async () => {
      try {
        await writer.write(enc.encode(
          `data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`
        ))
        await writer.write(enc.encode(
          `data: ${JSON.stringify({ type: 'done' })}\n\n`
        ))
      } finally {
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
