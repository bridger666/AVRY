/**
 * Nango SDK Client — server-side only
 *
 * Direct connection to Nango Cloud. Replaces the old Express OAuth server.
 * All OAuth operations (initiate, token, revoke) go through this client.
 */

import { Nango } from '@nangohq/node'

const nango = new Nango({
  secretKey: process.env.NANGO_SECRET_KEY || '',
  host: process.env.NANGO_HOST || 'https://api.nango.dev',
})

/** Provider config key mapping: AVRY appId → Nango integration key */
const PROVIDER_MAP: Record<string, string> = {
  'gmail':           'google-mail',
  'google-drive':    'google-drive',
  'google-sheets':   'google-sheet',      // Nango uses singular
  'google-calendar': 'google-calendar',
  'microsoft-teams': 'microsoft-teams',
  'outlook':         'outlook',
  'slack':           'slack',
  'github':          'github-getting-started',  // Nango template key
  'discord':         'discord',
  'dropbox':         'dropbox',
  'hubspot':         'hubspot',
  'salesforce':      'salesforce',
  'notion':          'notion',
  'trello':          'trello',
  'asana':           'asana',
  'linear':          'linear',
  'airtable':        'airtable',
  'shopify':         'shopify',
  'mailchimp':       'mailchimp',
  'intercom':        'intercom',
  'zendesk':         'zendesk',
}

export function getProviderConfigKey(appId: string): string | null {
  return PROVIDER_MAP[appId] ?? null
}

export function buildConnectionId(tenantId: string, appId: string): string {
  return `${tenantId}:${appId}`
}

export async function initiateAuth(providerConfigKey: string, connectionId: string) {
  const result = await nango.auth(providerConfigKey, connectionId)
  return { url: (result as { url?: string }).url || result }
}

export async function getToken(providerConfigKey: string, connectionId: string) {
  const token = await nango.getToken(providerConfigKey, connectionId)
  if (typeof token === 'string') {
    return { accessToken: token, tokenType: 'Bearer', expiresAt: null }
  }
  return {
    accessToken: (token as Record<string, unknown>).access_token || token,
    tokenType: (token as Record<string, unknown>).token_type || 'Bearer',
    expiresAt: (token as Record<string, unknown>).expires_at || null,
  }
}

export async function deleteNangoConnection(providerConfigKey: string, connectionId: string) {
  await nango.deleteConnection(providerConfigKey, connectionId)
}

export async function getNangoConnection(providerConfigKey: string, connectionId: string) {
  return await nango.getConnection(providerConfigKey, connectionId)
}

export { nango }
