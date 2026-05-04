/**
 * OAuth API Route — Composio Integration Sessions
 *
 * GET /api/integrations/oauth?action=session
 *   → Resolves the current user, fetches their Composio connected accounts,
 *     and returns a structured session payload.
 *
 * GET /api/integrations/oauth?action=status
 *   → Returns the list of connected apps for the current user.
 *
 * POST /api/integrations/oauth  { action: 'revoke', appId }
 *   → Deletes a Composio connected account for the current user.
 *
 * Error contract (no raw 500s):
 *   401  { error: { code: 'UNAUTHENTICATED', message: '...' } }
 *   400  { error: { code: 'BAD_REQUEST',     message: '...' } }
 *   500  { error: { code: 'COMPOSIO_ERROR',  message: '...', details: '...' } }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getComposioClient } from '@/lib/composio'

// ── User resolution ───────────────────────────────────────────────────────────
// Priority order:
//   1. x-tenant-id header (server-to-server / curl testing)
//   2. x-user-id header
//   3. Cookie-based session (when the browser hits this from the integrations page)
//   4. Fallback to 'default' tenant so the browser flow never gets a 401
//
// When real auth (JWT/session) is wired up, replace the fallback with a proper
// session lookup and remove the 'default' fallback.

function resolveUserId(req: NextRequest): string | null {
  // 1. Explicit header (curl / server-to-server)
  const tenantId = req.headers.get('x-tenant-id')
  if (tenantId && tenantId.trim() !== '') return tenantId.trim()

  const userId = req.headers.get('x-user-id')
  if (userId && userId.trim() !== '') return userId.trim()

  // 2. Cookie-based session (Next.js sets this via middleware or auth)
  const sessionCookie =
    req.cookies.get('session')?.value ||
    req.cookies.get('next-auth.session-token')?.value ||
    req.cookies.get('__session')?.value
  if (sessionCookie) return sessionCookie

  // 3. Fallback: use 'default' so the browser integrations page always works.
  //    Replace this with a real auth check once sessions are implemented.
  return 'default'
}

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const action = req.nextUrl.searchParams.get('action')

  // ── action=session ──────────────────────────────────────────────────────────
  if (action === 'session') {
    // 1. Resolve user
    const userId = resolveUserId(req)
    if (!userId) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHENTICATED',
            message: 'User is not authenticated',
          },
        },
        { status: 401 }
      )
    }

    // 2. Fetch connected accounts from Composio
    try {
      const composio = getComposioClient()
      const entity   = composio.getEntity(userId)
      const connections = await entity.getConnections()

      const connectedApps = Array.isArray(connections)
        ? connections.map((c: Record<string, unknown>) => ({
            appName:     c.appName     ?? c.appUniqueId ?? null,
            status:      c.status      ?? 'connected',
            connectedAt: c.createdAt   ?? null,
            accountId:   c.id          ?? null,
          }))
        : []

      const now = new Date().toISOString()

      return NextResponse.json({
        success: true,
        data: {
          userId,
          composioEntityId: userId,
          connectedApps,
          createdAt: now,
          updatedAt: now,
        },
      })
    } catch (err: unknown) {
      const details = err instanceof Error ? err.message : String(err)
      console.error('[integrations/oauth?action=session] Composio error:', details)

      // Surface a clear error if the API key is missing
      if (details.includes('COMPOSIO_API_KEY')) {
        return NextResponse.json(
          {
            error: {
              code:    'COMPOSIO_ERROR',
              message: 'Composio is not configured on this server',
              details,
            },
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          error: {
            code:    'COMPOSIO_ERROR',
            message: 'Failed to initialize Composio session',
            details,
          },
        },
        { status: 500 }
      )
    }
  }

  // ── action=status ───────────────────────────────────────────────────────────
  if (action === 'status') {
    const userId = resolveUserId(req)
    if (!userId) {
      return NextResponse.json(
        {
          error: {
            code:    'UNAUTHENTICATED',
            message: 'User is not authenticated',
          },
        },
        { status: 401 }
      )
    }

    try {
      const composio   = getComposioClient()
      const entity     = composio.getEntity(userId)
      const connections = await entity.getConnections()
      return NextResponse.json(Array.isArray(connections) ? connections : [])
    } catch (err: unknown) {
      const details = err instanceof Error ? err.message : String(err)
      console.error('[integrations/oauth?action=status] Composio error:', details)
      return NextResponse.json(
        {
          error: {
            code:    'COMPOSIO_ERROR',
            message: 'Failed to fetch connection status',
            details,
          },
        },
        { status: 500 }
      )
    }
  }

  // ── unknown action ──────────────────────────────────────────────────────────
  return NextResponse.json(
    {
      error: {
        code:    'BAD_REQUEST',
        message: 'Unknown action. Use ?action=session or ?action=status',
      },
    },
    { status: 400 }
  )
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const userId = resolveUserId(req)
  if (!userId) {
    return NextResponse.json(
      {
        error: {
          code:    'UNAUTHENTICATED',
          message: 'User is not authenticated',
        },
      },
      { status: 401 }
    )
  }

  let body: { action?: string; appId?: string; connectedAccountId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      { status: 400 }
    )
  }

  // ── action=revoke ───────────────────────────────────────────────────────────
  if (body.action === 'revoke') {
    const accountId = body.connectedAccountId
    if (!accountId) {
      return NextResponse.json(
        {
          error: {
            code:    'BAD_REQUEST',
            message: 'connectedAccountId is required for revoke',
          },
        },
        { status: 400 }
      )
    }

    try {
      const composio = getComposioClient()
      await composio.connectedAccounts.delete({ connectedAccountId: accountId })
      return NextResponse.json({ success: true })
    } catch (err: unknown) {
      const details = err instanceof Error ? err.message : String(err)
      console.error('[integrations/oauth POST revoke] Composio error:', details)
      return NextResponse.json(
        {
          error: {
            code:    'COMPOSIO_ERROR',
            message: 'Failed to revoke connection',
            details,
          },
        },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    { error: { code: 'BAD_REQUEST', message: 'Unknown action' } },
    { status: 400 }
  )
}
