/**
 * Composio SDK client — server-side only.
 *
 * Usage:
 *   import { getComposioClient } from '@/lib/composio'
 *   const composio = getComposioClient()
 *   const entity   = composio.getEntity(userId)
 *   const conns    = await entity.getConnections()
 *
 * Environment variables required:
 *   COMPOSIO_API_KEY          — Composio API key
 *   COMPOSIO_REDIRECT_URL     — OAuth redirect URL (optional override)
 */

import { Composio } from 'composio-core'

let _client: Composio | null = null

export function getComposioClient(): Composio {
  if (!_client) {
    const apiKey = process.env.COMPOSIO_API_KEY
    if (!apiKey) {
      throw new Error('COMPOSIO_API_KEY is not set')
    }
    _client = new Composio({ apiKey })
  }
  return _client
}

/** The OAuth redirect URL sent to Composio when initiating a connection. */
export function getComposioRedirectUrl(): string {
  return (
    process.env.COMPOSIO_REDIRECT_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/integrations/callback`
  )
}
