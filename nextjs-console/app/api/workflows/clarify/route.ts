/**
 * POST /api/workflows/clarify
 *
 * Dedicated proxy for workflow clarification requests.
 * Forwards to VPS Bridge → /workflows/clarify → Zeroclaw.
 *
 * Request body:
 *   {
 *     session_id:            string   (required)
 *     organization_id:       string   (required)
 *     user_request:          string   (required)
 *     conversation_history?: array    (optional)
 *   }
 *
 * Success response (200):
 *   { message: string }
 *
 * Error response:
 *   { error: { code: string, message: string, details?: string } }
 */

import { NextRequest, NextResponse } from 'next/server'

// ── Config ────────────────────────────────────────────────────────────────────

const VPS_BRIDGE_URL = (
  process.env.VPS_BRIDGE_URL ||
  process.env.NEXT_PUBLIC_VPS_BRIDGE_URL ||
  'http://43.156.108.96:3003'
).replace(/\/$/, '')

const VPS_BRIDGE_API_KEY =
  process.env.VPS_BRIDGE_API_KEY ||
  process.env.NEXT_PUBLIC_VPS_BRIDGE_API_KEY ||
  ''
const UPSTREAM_PATH = '/workflows/clarify'
const TIMEOUT_MS    = 10_000   // 10s — clarify is a quick LLM call; fail fast

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClarifyRequestBody {
  session_id:            string
  organization_id:       string
  user_request:          string
  conversation_history?: unknown[]
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── 1. Parse & validate body ──────────────────────────────────────────────
  let body: ClarifyRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      { status: 400 }
    )
  }

  const { session_id, organization_id, user_request, conversation_history } = body

  if (!session_id || typeof session_id !== 'string') {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'session_id is required' } },
      { status: 400 }
    )
  }
  if (!organization_id || typeof organization_id !== 'string') {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'organization_id is required' } },
      { status: 400 }
    )
  }
  if (!user_request || typeof user_request !== 'string') {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'user_request is required' } },
      { status: 400 }
    )
  }

  // ── 2. Log incoming request ───────────────────────────────────────────────
  console.log('[/api/workflows/clarify] incoming request', {
    session_id,
    organization_id,
    user_request_length: user_request.length,
    has_history: Array.isArray(conversation_history) && conversation_history.length > 0,
  })

  // ── Guard: API key must be configured ────────────────────────────────────
  if (!VPS_BRIDGE_API_KEY) {
    console.error('[/api/workflows/clarify] SERVER_MISCONFIG: VPS_BRIDGE_API_KEY is not set')
    return NextResponse.json(
      { error: { code: 'SERVER_MISCONFIG', message: 'VPS_BRIDGE_API_KEY is not set on the backend' } },
      { status: 500 }
    )
  }

  // ── 3. Proxy to VPS Bridge ────────────────────────────────────────────────
  const targetUrl = `${VPS_BRIDGE_URL}${UPSTREAM_PATH}`

  const upstreamBody: Record<string, unknown> = {
    session_id,
    organization_id,
    user_request,
  }
  if (Array.isArray(conversation_history)) {
    upstreamBody.conversation_history = conversation_history
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key':    VPS_BRIDGE_API_KEY,
  }

  // ── Log outgoing VPS call ─────────────────────────────────────────────────
  console.log('[/api/workflows/clarify] upstream config', {
    vpsUrl:    targetUrl,
    hasApiKey: !!VPS_BRIDGE_API_KEY,
    timeoutMs: TIMEOUT_MS,
  })
  console.log('[/api/workflows/clarify] → VPS', {
    session_id,
    organization_id,
    user_request_length: user_request.length,
  })
  const t0 = Date.now()
  let bridgeResponse: Response
  try {
    bridgeResponse = await fetch(targetUrl, {
      method:  'POST',
      headers,
      body:    JSON.stringify(upstreamBody),
      signal:  AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err: unknown) {
    const elapsed   = Date.now() - t0
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    const details   = err instanceof Error ? err.message : String(err)

    console.error('[/api/workflows/clarify] upstream error', {
      cause:     details,
      isTimeout,
      elapsedMs: elapsed,
      timeoutMs: TIMEOUT_MS,
    })

    return NextResponse.json(
      {
        error: {
          code:    'GATEWAY_ERROR',
          message: isTimeout
            ? `Workflow gateway timed out after ${TIMEOUT_MS}ms`
            : 'Failed to contact workflow gateway',
          details,
        },
      },
      { status: 502 }
    )
  }

  // ── 4. Log upstream status ────────────────────────────────────────────────
  console.log('[/api/workflows/clarify] ← VPS', {
    status:    bridgeResponse.status,
    elapsedMs: Date.now() - t0,
    url:       targetUrl,
  })

  // ── 5. Parse upstream response ────────────────────────────────────────────
  const rawText = await bridgeResponse.text()
  let parsed: unknown = null
  try {
    parsed = rawText ? JSON.parse(rawText) : null
  } catch {
    parsed = null
  }

  // ── 6. Forward error from VPS Bridge ─────────────────────────────────────
  if (!bridgeResponse.ok) {
    // If VPS Bridge returned a structured error, forward it
    if (
      parsed &&
      typeof parsed === 'object' &&
      'error' in (parsed as Record<string, unknown>)
    ) {
      return NextResponse.json(parsed, { status: bridgeResponse.status })
    }

    // Otherwise wrap in our standard error shape
    const message =
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as Record<string, unknown>).message === 'string'
        ? (parsed as Record<string, unknown>).message as string
        : rawText || `VPS Bridge returned ${bridgeResponse.status}`

    return NextResponse.json(
      {
        error: {
          code:    'UPSTREAM_ERROR',
          message,
          details: `HTTP ${bridgeResponse.status} from ${UPSTREAM_PATH}`,
        },
      },
      { status: bridgeResponse.status }
    )
  }

  // ── 7. Return success ─────────────────────────────────────────────────────
  // VPS Bridge should return { message: string }
  return NextResponse.json(parsed ?? {}, { status: 200 })
}
