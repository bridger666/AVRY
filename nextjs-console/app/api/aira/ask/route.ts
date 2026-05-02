import { NextRequest } from 'next/server'
import { getConfig } from '@/lib/config'

// FIXED: TIMEOUT INCREASE — 120s to match bridge + Zeroclaw timeout
export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, messages, context } = body

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
      // Strip sensitive fields before forwarding to bridge — defense in depth
      const safeContext: Record<string, unknown> = {}
      if (context?.page) safeContext.page = context.page
      if (context?.mode) safeContext.mode = context.mode
      if (context?.source_tab) safeContext.source_tab = context.source_tab
      if (context?.roadmap) safeContext.roadmap = context.roadmap
      // Explicitly exclude: session_id, organization_id, pageContext internals

      bridgeResponse = await fetch(bridgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': config.VPS_BRIDGE_API_KEY,
        },
        body: JSON.stringify({
          message: messages.filter((m: { role: string }) => m.role === 'user').at(-1)?.content ?? '',
          context: { history: messages, ...safeContext }
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
    // Bridge now returns both final_text (cleaned) and raw_agent_response (compat)
    const bridgeData = await bridgeResponse.json() as {
      raw_agent_response?: string
      final_text?: string
      mode?: string
      model?: string
      skill?: string
    }
    const text = bridgeData.final_text ?? bridgeData.raw_agent_response ?? ''
    const enc = new TextEncoder()

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    ;(async () => {
      try {
        // Stream the response in chunks of 20 characters
        const step = 20
        for (let i = 0; i < text.length; i += step) {
          const piece = text.slice(i, i + step)

          await writer.write(
            enc.encode(
              `data: ${JSON.stringify({ type: 'chunk', content: piece })}\n\n`
            )
          )
        }

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
    console.error('[aira/ask] error:', error)
    // Return specific error message for context tab fix as per requirements
    return Response.json(
      { error: true, message: 'Aivory tidak dapat membaca context tab ini. Coba refresh halaman.' },
      { status: 400 }
    )
  }
}
