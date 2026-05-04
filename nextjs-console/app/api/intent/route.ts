import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const bridgeUrl = process.env.VPS_BRIDGE_URL ?? 'http://43.156.108.96:3003'
  const apiKey = process.env.VPS_BRIDGE_API_KEY ?? ''

  try {
    // /aria/stream returns SSE — consume it and collect the full text
    const res = await fetch(`${bridgeUrl}/aria/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        session_id: 'intent-classifier',
        organization_id: 'default',
        message: body.message,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Bridge error' }, { status: res.status })
    }

    // Consume SSE stream and collect all chunk content
    const reader = res.body?.getReader()
    if (!reader) {
      return NextResponse.json({ error: 'No response body' }, { status: 502 })
    }

    const decoder = new TextDecoder()
    let accumulated = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      // Parse SSE lines: "data: {...}\n\n"
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue
        try {
          const event = JSON.parse(line.slice(6))
          if (event.type === 'chunk' && event.content) {
            accumulated += event.content
          } else if (event.type === 'done') {
            break
          }
        } catch {
          // ignore malformed SSE lines
        }
      }
    }

    console.log('[IntentAPI] accumulated response:', accumulated.slice(0, 200))

    return NextResponse.json({ rawagentresponse: accumulated }, { status: 200 })
  } catch (err) {
    console.error('[IntentAPI] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Bridge unreachable' }, { status: 503 })
  }
}
