import { NextRequest, NextResponse } from 'next/server'

const FALLBACK = NextResponse.json(
  { rawagentresponse: '{"route":"console","confidence":0,"reason":"Staying in Console","tabLabel":"Console"}' },
  { status: 200 }
)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const bridgeUrl = process.env.VPS_BRIDGE_URL ?? 'http://43.156.108.96:3003'
  const apiKey = process.env.VPS_BRIDGE_API_KEY ?? ''

  try {
    // 8s hard timeout — intent classification is best-effort, never blocks the user
    const res = await fetch(`${bridgeUrl}/aria/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        message: body.message ?? '',
        session_id: 'intent-classifier',
        organization_id: 'default',
        context: body.context ?? {},
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      // Non-2xx from bridge → silent fallback, never 503
      return FALLBACK
    }

    // Zeroclaw returns JSON: { model, response }
    const data = await res.json()
    const raw: string = data?.response ?? data?.raw_agent_response ?? data?.final_text ?? ''

    if (!raw) return FALLBACK

    return NextResponse.json({ rawagentresponse: raw }, { status: 200 })
  } catch {
    // Timeout, network error, parse error → silent fallback, never 503
    return FALLBACK
  }
}
