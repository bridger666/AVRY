import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const bridgeUrl = process.env.VPS_BRIDGE_URL ?? 'http://43.156.108.96:3003'
  const apiKey = process.env.VPS_BRIDGE_API_KEY ?? ''

  try {
    // Zeroclaw /webhook returns JSON: { model: "...", response: "..." }
    // Both /console/stream and /aria/stream proxy to the same /webhook endpoint
    const res = await fetch(`${bridgeUrl}/aria/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        message: body.message,
        session_id: 'intent-classifier',
        organization_id: 'default',
        context: body.context ?? {},
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('[IntentAPI] bridge error:', res.status, detail.slice(0, 200))
      return NextResponse.json({ error: 'Bridge error' }, { status: res.status })
    }

    // Zeroclaw returns JSON with { model, response } — extract the response field
    const data = await res.json()
    const raw: string = data?.response ?? data?.raw_agent_response ?? data?.final_text ?? ''

    console.log('[IntentAPI] upstream response field:', raw.slice(0, 200))

    return NextResponse.json({ rawagentresponse: raw }, { status: 200 })
  } catch (err) {
    console.error('[IntentAPI] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Bridge unreachable' }, { status: 503 })
  }
}
