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

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = '/' + params.path.join('/')

  // Whitelist — hanya izinkan endpoint copilot yang dikenal
  const ALLOWED_PATHS = [
    '/workflows/clarify',
    '/workflows/generate',
    '/workflows/repair',
    '/workflows/edit',
    '/workflows/draft-test',
  ]

  if (!ALLOWED_PATHS.includes(path)) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const targetUrl = `${VPS_BRIDGE_URL}${path}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (VPS_BRIDGE_API_KEY) {
    headers['X-Api-Key'] = VPS_BRIDGE_API_KEY
  }

  try {
    const bridgeResponse = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      // Timeout via AbortController — 30s untuk sandbox test
      signal: AbortSignal.timeout(30_000),
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

      return NextResponse.json(
        { message: errorMsg },
        { status: bridgeResponse.status }
      )
    }

    return NextResponse.json(parsed ?? {}, { status: 200 })
  } catch (error: unknown) {
    const isTimeout =
      error instanceof Error && error.name === 'TimeoutError'

    console.error(`[/api/copilot${path}] error:`, error)

    return NextResponse.json(
      {
        message: isTimeout
          ? 'VPS Bridge timeout — sandbox test terlalu lama.'
          : `Gagal menghubungi VPS Bridge: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 502 }
    )
  }
}