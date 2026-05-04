/**
 * /app/api/copilot/[...path]/route.ts
 *
 * Server-side proxy: browser → /api/copilot/* → VPS Bridge
 * Solves CORS — browser tidak pernah langsung menyentuh VPS Bridge.
 *
 * Endpoints yang diproxy:
 *   POST /api/copilot/workflows/clarify
 *   POST /api/copilot/workflows/generate
 *   POST /api/copilot/workflows/repair
 *   POST /api/copilot/workflows/edit
 *   POST /api/copilot/workflows/draft-test
 *
 * Auth: single internal token passed as x-api-key.
 * The VPS Bridge is the only auth boundary — no re-validation downstream.
 */

import { NextRequest, NextResponse } from 'next/server'

const VPS_BRIDGE_URL = (
  process.env.VPS_BRIDGE_URL ||
  process.env.NEXT_PUBLIC_VPS_BRIDGE_URL ||
  'http://43.156.108.96:3003'
).replace(/\/$/, '')

const VPS_BRIDGE_API_KEY =
  process.env.VPS_BRIDGE_API_KEY ||
  process.env.NEXT_PUBLIC_VPS_BRIDGE_API_KEY ||
  ''

// Internal token for service-to-service calls (Next.js → VPS Bridge).
// The bridge passes this through without re-validating downstream.
const INTERNAL_TOKEN =
  process.env.INTERNAL_TOKEN || 'aivory-internal-2026'

// Per-endpoint timeouts (ms).
// All copilot endpoints can be slow (LLM + sandbox) — give them 120s.
const TIMEOUT_BY_PATH: Record<string, number> = {
  '/workflows/clarify':    120_000,
  '/workflows/generate':   120_000,
  '/workflows/repair':     120_000,
  '/workflows/edit':       120_000,
  '/workflows/draft-test': 120_000,
}
const DEFAULT_TIMEOUT_MS = 120_000

// Whitelist — only allow known copilot endpoints
const ALLOWED_PATHS = [
  '/workflows/clarify',
  '/workflows/generate',
  '/workflows/repair',
  '/workflows/edit',
  '/workflows/draft-test',
]

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = '/' + params.path.join('/')

  if (!ALLOWED_PATHS.includes(path)) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }

  // ── Guard: API key must be configured ────────────────────────────────────
  if (!VPS_BRIDGE_API_KEY) {
    console.error(`[/api/copilot${path}] SERVER_MISCONFIG: VPS_BRIDGE_API_KEY is not set`)
    return NextResponse.json(
      { error: { code: 'SERVER_MISCONFIG', message: 'VPS_BRIDGE_API_KEY is not set on the backend' } },
      { status: 500 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const targetUrl = `${VPS_BRIDGE_URL}${path}`
  const timeoutMs = TIMEOUT_BY_PATH[path] ?? DEFAULT_TIMEOUT_MS

  // ── Special case: /workflows/clarify → route through /console/stream ─────
  // Zeroclaw does not have a /workflows/clarify endpoint — it only handles
  // requests via /webhook (exposed as /console/stream on the VPS Bridge).
  // Rewrite the target and transform the body to match Zeroclaw's schema.
  const isClarify = path === '/workflows/clarify'
  const effectiveTargetUrl = isClarify
    ? `${VPS_BRIDGE_URL}/console/stream`
    : targetUrl

  // Single auth header — x-api-key is the external key, X-Internal-Key is
  // the internal service-to-service token. Both are sent so the bridge can
  // accept either pattern without re-validating downstream.
  const headers: Record<string, string> = {
    'Content-Type':   'application/json',
    'x-api-key':      VPS_BRIDGE_API_KEY,
    'X-Internal-Key': INTERNAL_TOKEN,
  }

  // ── Log outgoing request ──────────────────────────────────────────────────
  const bodyRecord = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  console.log(`[/api/copilot${path}] → VPS`, {
    targetUrl: effectiveTargetUrl,
    timeoutMs,
    session_id:          bodyRecord.session_id ?? null,
    organization_id:     bodyRecord.organization_id ?? null,
    user_request_length: typeof bodyRecord.user_request === 'string'
      ? bodyRecord.user_request.length
      : null,
    history_length: Array.isArray(bodyRecord.conversation_history)
      ? bodyRecord.conversation_history.length
      : null,
  })

  // Transform body for clarify → console/stream schema
  const outboundBody = isClarify
    ? {
        message: bodyRecord.user_request ?? '',
        session_id: bodyRecord.session_id ?? 'copilot',
        organization_id: bodyRecord.organization_id ?? 'default',
        context: {
          mode: 'workflow_clarify',
          source_tab: 'workflows',
          history: Array.isArray(bodyRecord.conversation_history)
            ? bodyRecord.conversation_history
            : [],
        },
      }
    : body

  const t0 = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), timeoutMs)

    let bridgeResponse: Response
    try {
      bridgeResponse = await fetch(effectiveTargetUrl, {
        method:  'POST',
        headers,
        body:    JSON.stringify(outboundBody),
        signal:  controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    const elapsed = Date.now() - t0
    console.log(`[/api/copilot${path}] ← VPS`, {
      status:    bridgeResponse.status,
      elapsedMs: elapsed,
    })

    const rawBody = await bridgeResponse.text()

    let parsed: unknown = null
    try {
      parsed = rawBody ? JSON.parse(rawBody) : null
    } catch {
      parsed = null
    }

    if (!bridgeResponse.ok) {
      const errorMsg =
        parsed && typeof (parsed as Record<string, unknown>).message === 'string'
          ? (parsed as Record<string, unknown>).message
          : rawBody || `VPS Bridge error ${bridgeResponse.status}`

      console.error(`[/api/copilot${path}] upstream error`, {
        status:    bridgeResponse.status,
        elapsedMs: elapsed,
        message:   errorMsg,
      })

      return NextResponse.json(
        { message: errorMsg },
        { status: bridgeResponse.status }
      )
    }

    // For clarify: Zeroclaw returns { model, response } — normalize to { message }
    if (isClarify && parsed && typeof parsed === 'object') {
      const p = parsed as Record<string, unknown>
      const responseText = typeof p.response === 'string' ? p.response
        : typeof p.message === 'string' ? p.message
        : rawBody || ''
      console.log(`[/api/copilot${path}] clarify message_length:`, responseText.length)
      return NextResponse.json({ message: responseText }, { status: 200 })
    }

    return NextResponse.json(parsed ?? {}, { status: 200 })
  } catch (error: unknown) {
    const elapsed    = Date.now() - t0
    const isTimeout  = error instanceof Error &&
      (error.name === 'TimeoutError' || error.name === 'AbortError')
    const errMessage = error instanceof Error ? error.message : String(error)

    console.error(`[/api/copilot${path}] fetch error`, {
      isTimeout,
      elapsedMs: elapsed,
      timeoutMs,
      cause:     errMessage,
    })

    return NextResponse.json(
      {
        message: isTimeout
          ? `VPS Bridge timeout after ${timeoutMs}ms — ${path} terlalu lama.`
          : `Gagal menghubungi VPS Bridge: ${errMessage}`,
      },
      { status: 502 }
    )
  }
}