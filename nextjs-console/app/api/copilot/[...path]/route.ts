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
const INTERNAL_TOKEN =
  process.env.INTERNAL_TOKEN || 'aivory-internal-2026'

// n8n-as-code service URL (used for draft-test)
const N8N_AS_CODE_URL = (
  process.env.N8N_AS_CODE_URL || 'http://43.156.108.96:3500'
).replace(/\/$/, '')

// Per-endpoint timeouts (ms).
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

// ── Normalize Zeroclaw { model, response } → { workflow, message } ──────────
// Zeroclaw returns natural language or JSON in `response`. We try to parse it
// as a workflow object; if that fails we build a minimal placeholder.
function normalizeZeroclawToWorkflow(
  response: string,
  fallbackName: string,
): { workflow: Record<string, unknown>; message: string } {
  try {
    const parsed = JSON.parse(response)
    if (parsed && typeof parsed === 'object' && parsed.workflowName) {
      return { workflow: parsed as Record<string, unknown>, message: response }
    }
  } catch {
    // Not JSON — fall through to minimal workflow
  }
  return {
    workflow: {
      workflowName: fallbackName,
      steps: [],
      estimate_hours: 2,
      automation_score: 0.8,
      summary: response,
    },
    message: response,
  }
}

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

  const bodyRecord = body && typeof body === 'object' ? body as Record<string, unknown> : {}

  // ── Determine effective target URL and outbound body per endpoint ─────────
  const isClarify   = path === '/workflows/clarify'
  const isGenerate  = path === '/workflows/generate'
  const isRepair    = path === '/workflows/repair'
  const isEdit      = path === '/workflows/edit'
  const isDraftTest = path === '/workflows/draft-test'

  let effectiveTargetUrl: string
  let outboundBody: unknown

  if (isClarify) {
    // Zeroclaw only handles requests via /console/stream (webhook)
    effectiveTargetUrl = `${VPS_BRIDGE_URL}/console/stream`
    outboundBody = {
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
  } else if (isGenerate) {
    effectiveTargetUrl = `${VPS_BRIDGE_URL}/console/stream`
    outboundBody = {
      message: bodyRecord.user_request ?? '',
      history: Array.isArray(bodyRecord.conversation_history)
        ? bodyRecord.conversation_history
        : [],
      mode: 'console',
      channel: 'console_ui',
      entrypoint: 'workflow_generate',
      context: {
        session_id: bodyRecord.session_id,
        organization_id: bodyRecord.organization_id,
      },
    }
  } else if (isRepair) {
    effectiveTargetUrl = `${VPS_BRIDGE_URL}/console/stream`
    outboundBody = {
      message: `Repair these failed steps: ${JSON.stringify(bodyRecord.failed_steps)}. Current workflow: ${JSON.stringify(bodyRecord.current_workflow)}`,
      history: [],
      mode: 'console',
      channel: 'console_ui',
      entrypoint: 'workflow_repair',
      context: {
        session_id: bodyRecord.session_id,
        organization_id: bodyRecord.organization_id,
      },
    }
  } else if (isEdit) {
    effectiveTargetUrl = `${VPS_BRIDGE_URL}/console/stream`
    outboundBody = {
      message: bodyRecord.edit_request ?? bodyRecord.user_request ?? '',
      history: [],
      mode: 'console',
      channel: 'console_ui',
      entrypoint: 'workflow_edit',
      context: {
        session_id: bodyRecord.session_id,
        organization_id: bodyRecord.organization_id,
        current_workflow: bodyRecord.current_workflow,
      },
    }
  } else if (isDraftTest) {
    // draft-test goes directly to n8n-as-code, not console/stream
    effectiveTargetUrl = `${N8N_AS_CODE_URL}/drafts/build`
    outboundBody = body // pass through as-is
  } else {
    effectiveTargetUrl = `${VPS_BRIDGE_URL}${path}`
    outboundBody = body
  }

  const timeoutMs = TIMEOUT_BY_PATH[path] ?? DEFAULT_TIMEOUT_MS

  // Single auth header set
  const headers: Record<string, string> = {
    'Content-Type':   'application/json',
    'x-api-key':      VPS_BRIDGE_API_KEY,
    'X-Internal-Key': INTERNAL_TOKEN,
  }

  // ── Log outgoing request ──────────────────────────────────────────────────
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

    // ── Normalize Zeroclaw responses ──────────────────────────────────────

    if (isClarify && parsed && typeof parsed === 'object') {
      // Zeroclaw returns { model, response } — normalize to { message }
      const p = parsed as Record<string, unknown>
      const responseText = typeof p.response === 'string' ? p.response
        : typeof p.message === 'string' ? p.message
        : rawBody || ''
      console.log(`[/api/copilot${path}] clarify message_length:`, responseText.length)
      return NextResponse.json({ message: responseText }, { status: 200 })
    }

    if ((isGenerate || isRepair || isEdit) && parsed && typeof parsed === 'object') {
      const p = parsed as Record<string, unknown>
      // If Zeroclaw returned { model, response } instead of { workflow }
      if (!p.workflow && typeof p.response === 'string') {
        const fallbackName = isGenerate ? 'Generated Workflow'
          : isRepair ? 'Repaired Workflow'
          : 'Edited Workflow'
        const normalized = normalizeZeroclawToWorkflow(p.response, fallbackName)
        console.log(`[/api/copilot${path}] normalized Zeroclaw response → workflow:`, normalized.workflow.workflowName)
        return NextResponse.json(normalized, { status: 200 })
      }
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