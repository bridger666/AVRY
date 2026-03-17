/**
 * In-memory credential vault + connection store.
 *
 * Security contract:
 *  - Credentials are stored in a separate Map keyed by storageRef (opaque UUID).
 *  - AivoryConnection objects NEVER contain credential data.
 *  - GET responses only return AivoryConnection (metadata only).
 *  - Credentials are only accessible server-side via getCredentials().
 *
 * In production: replace the vault Map with AWS Secrets Manager / Vault / encrypted DB column.
 */

import { randomUUID } from 'crypto'
import type {
  AivoryApp,
  AivoryConnection,
  ConnectionStatus,
  CreateConnectionPayload,
} from '@/types/integrations'

// ── App Catalog ──────────────────────────────────────────

export const APP_CATALOG: AivoryApp[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send messages and notifications to Slack channels.',
    icon: '💬',
    iconPath: '/integrations/icons/slack.svg',
    authType: 'apiKey',
    categories: ['Communication'],
    defaultAction: 'Send Message',
    fields: [
      { key: 'apiKey', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...', required: true },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Use GPT models for text generation and analysis.',
    icon: '🤖',
    iconPath: '/integrations/icons/openai.svg',
    authType: 'apiKey',
    categories: ['AI'],
    defaultAction: 'Generate Text',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...', required: true },
    ],
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Send transactional and marketing emails.',
    icon: '📧',
    iconPath: '/integrations/icons/sendgrid.svg',
    authType: 'apiKey',
    categories: ['Communication'],
    defaultAction: 'Send Email',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'SG.xxx', required: true },
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Read and write Notion databases and pages.',
    icon: '📝',
    iconPath: '/integrations/icons/notion.svg',
    authType: 'apiKey',
    categories: ['Databases'],
    defaultAction: 'Create Page',
    fields: [
      { key: 'apiKey', label: 'Integration Token', type: 'password', placeholder: 'secret_...', required: true },
    ],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts, deals, and CRM data.',
    icon: '🔶',
    iconPath: '/integrations/icons/hubspot.svg',
    authType: 'apiKey',
    categories: ['CRM'],
    defaultAction: 'Create Contact',
    fields: [
      { key: 'apiKey', label: 'Private App Token', type: 'password', placeholder: 'pat-...', required: true },
    ],
  },
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Read and write Airtable bases and tables.',
    icon: '📊',
    iconPath: '/integrations/icons/airtable.svg',
    authType: 'apiKey',
    categories: ['Databases'],
    defaultAction: 'Create Record',
    fields: [
      { key: 'apiKey', label: 'Personal Access Token', type: 'password', placeholder: 'pat...', required: true },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Automate GitHub issues, PRs, and repos.',
    icon: '🐙',
    iconPath: '/integrations/icons/github.svg',
    authType: 'apiKey',
    categories: ['DevTools'],
    defaultAction: 'Create Issue',
    fields: [
      { key: 'apiKey', label: 'Personal Access Token', type: 'password', placeholder: 'ghp_...', required: true },
    ],
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Create and update Jira issues and projects.',
    icon: '🔵',
    iconPath: '/integrations/icons/jira.svg',
    authType: 'basic',
    categories: ['DevTools'],
    defaultAction: 'Create Issue',
    fields: [
      { key: 'username', label: 'Email', type: 'text', placeholder: 'you@company.com', required: true },
      { key: 'password', label: 'API Token', type: 'password', placeholder: 'ATATT...', required: true },
      { key: 'url', label: 'Jira Base URL', type: 'url', placeholder: 'https://yourorg.atlassian.net', required: true },
    ],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Sync leads, contacts, and opportunities.',
    icon: '☁️',
    iconPath: '/integrations/icons/salesforce.svg',
    authType: 'basic',
    categories: ['CRM'],
    defaultAction: 'Create Lead',
    fields: [
      { key: 'username', label: 'Username', type: 'text', placeholder: 'user@company.com', required: true },
      { key: 'password', label: 'Password + Security Token', type: 'password', placeholder: 'passwordTOKEN', required: true },
    ],
  },
  {
    id: 'http',
    name: 'HTTP / Custom API',
    description: 'Connect to any REST API with an API key.',
    icon: '🌐',
    iconPath: '/integrations/icons/http-api.svg',
    authType: 'apiKey',
    categories: ['Custom API'],
    defaultAction: 'HTTP Request',
    fields: [
      { key: 'apiKey', label: 'API Key or Bearer Token', type: 'password', placeholder: 'Bearer eyJ...', required: true },
      { key: 'url', label: 'Base URL', type: 'url', placeholder: 'https://api.example.com', required: false },
    ],
  },
]

// ── Credential Vault ─────────────────────────────────────
// storageRef → encrypted/opaque credentials blob
// In production: replace with Secrets Manager / Vault

const credentialVault = new Map<string, Record<string, string>>()

function storeCredentials(credentials: Record<string, string>): string {
  const ref = `vault:${randomUUID()}`
  credentialVault.set(ref, credentials)
  return ref
}

function updateCredentials(storageRef: string, credentials: Record<string, string>): void {
  credentialVault.set(storageRef, credentials)
}

function purgeCredentials(storageRef: string): void {
  credentialVault.delete(storageRef)
}

/** Server-side only — never call this from a GET handler */
export function getCredentials(storageRef: string): Record<string, string> | undefined {
  return credentialVault.get(storageRef)
}

// ── Connection Store ─────────────────────────────────────
// Map<tenantId, Map<connectionId, AivoryConnection>>

const connectionStore = new Map<string, Map<string, AivoryConnection>>()

function getTenantStore(tenantId: string): Map<string, AivoryConnection> {
  if (!connectionStore.has(tenantId)) connectionStore.set(tenantId, new Map())
  return connectionStore.get(tenantId)!
}

export function listConnections(tenantId: string, appId?: string): AivoryConnection[] {
  const all = Array.from(getTenantStore(tenantId).values())
  return appId ? all.filter(c => c.appId === appId) : all
}

export function getConnection(tenantId: string, id: string): AivoryConnection | undefined {
  return getTenantStore(tenantId).get(id)
}

export function createConnection(
  tenantId: string,
  payload: CreateConnectionPayload
): AivoryConnection {
  const app = APP_CATALOG.find(a => a.id === payload.appId)
  if (!app) throw new Error(`Unknown app: ${payload.appId}`)

  const now = new Date().toISOString()
  const storageRef = storeCredentials(payload.credentials)

  const connection: AivoryConnection = {
    id: randomUUID(),
    tenantId,
    appId: payload.appId,
    appName: app.name,
    appIcon: app.icon,
    displayName: payload.displayName,
    status: 'connected',
    authType: app.authType,
    storageRef,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
  }

  getTenantStore(tenantId).set(connection.id, connection)
  return connection
}

export function reconnectConnection(
  tenantId: string,
  id: string,
  credentials: Record<string, string>
): AivoryConnection | null {
  const conn = getTenantStore(tenantId).get(id)
  if (!conn) return null

  updateCredentials(conn.storageRef, credentials)
  const updated: AivoryConnection = {
    ...conn,
    status: 'connected',
    updatedAt: new Date().toISOString(),
  }
  getTenantStore(tenantId).set(id, updated)
  return updated
}

export function revokeConnection(tenantId: string, id: string): boolean {
  const conn = getTenantStore(tenantId).get(id)
  if (!conn) return false

  // Purge credentials from vault
  purgeCredentials(conn.storageRef)

  const revoked: AivoryConnection = {
    ...conn,
    status: 'revoked',
    updatedAt: new Date().toISOString(),
  }
  getTenantStore(tenantId).set(id, revoked)
  return true
}

export function touchConnection(tenantId: string, id: string): void {
  const conn = getTenantStore(tenantId).get(id)
  if (conn) {
    getTenantStore(tenantId).set(id, { ...conn, lastUsedAt: new Date().toISOString() })
  }
}
