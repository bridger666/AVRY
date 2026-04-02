import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const bridgeUrl = process.env.VPS_BRIDGE_URL ?? 'http://43.156.108.96:3003'
  const apiKey = process.env.VPS_BRIDGE_API_KEY ?? ''

  try {
    // Use /bridge/aira endpoint (same as console/aira/stream) for intent classification
    const res = await fetch(`${bridgeUrl}/bridge/aira`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({
        session_id: 'intent-classifier',
        organization_id: 'default',
        message: body.message,
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return NextResponse.json({ error: 'Bridge error' }, { status: res.status })

    const data = await res.json()
    console.log('[IntentAPI] raw bridge response:', JSON.stringify(data))
    console.log('[IntentAPI] raw_agent_response:', data?.raw_agent_response)
    
    const raw: string = data?.raw_agent_response ?? data?.rawagentresponse ?? data?.response ?? data?.content ?? ''

    return NextResponse.json({ rawagentresponse: raw }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Bridge unreachable' }, { status: 503 })
  }
}
