/**
 * OAuth API Route — Nango Connect Session
 *
 * GET /api/integrations/oauth?action=session
 *   → Creates a Nango connect session token for the frontend SDK
 *
 * GET /api/integrations/oauth?action=status
 *   → Returns OAuth connections list
 *
 * POST /api/integrations/oauth  { action: 'revoke', appId }
 *   → Revokes a connection in Nango
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  nango,
  getProviderConfigKey,
  buildConnectionId,
  deleteNangoConnection,
} from '@/lib/nangoClient'

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') ?? 'default'
}

export async function GET(req: NextRequest) {
  const tenantId = getTenantId(req)
  const action = req.nextUrl.searchParams.get('action')

  // Create a connect session token for the frontend SDK
  if (action === 'session') {
    try {
      const result = await nango.createConnectSession({
        tags: {
          end_user_id: tenantId,
        },
      })
      return NextResponse.json({ token: result.data.token })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session'
      console.error('[OAuth Session] Error:', message)
      return NextResponse.json({ error: message }, { status: 503 })
    }
  }

  // Status endpoint
  if (action === 'status') {
    return NextResponse.json([])
  }

  return NextResponse.json({ error: 'Unknown action. Use ?action=session or ?action=status' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const tenantId = getTenantId(req)

  let body: { action?: string; appId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.action === 'revoke' && body.appId) {
    const providerConfigKey = getProviderConfigKey(body.appId)
    if (!providerConfigKey) {
      return NextResponse.json({ error: 'Unknown app' }, { status: 400 })
    }

    const nangoConnectionId = buildConnectionId(tenantId, body.appId)
    try {
      await deleteNangoConnection(providerConfigKey, nangoConnectionId)
      return NextResponse.json({ success: true })
    } catch (err) {
      console.error('[OAuth Revoke] Error:', err)
      return NextResponse.json({ success: true })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
