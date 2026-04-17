/**
 * Connection Store
 *
 * In-memory connection metadata store.
 * Maps tenantId → Map<connectionId, Connection>.
 *
 * In production: replace with a database table.
 */

const crypto = require('crypto')
const { storeCredentials, purgeCredentials } = require('./tokenVault')
const { APP_CATALOG } = require('./appCatalog')

const connectionStore = new Map()

function getTenantStore(tenantId) {
  if (!connectionStore.has(tenantId)) {
    connectionStore.set(tenantId, new Map())
  }
  return connectionStore.get(tenantId)
}

/**
 * Create a new connection for a tenant.
 */
function createConnection(tenantId, { appId, displayName, credentials }, options = {}) {
  const app = APP_CATALOG.find(a => a.id === appId)
  if (!app) throw new Error(`Unknown app: ${appId}`)

  const now = new Date().toISOString()
  const storageRef = storeCredentials(credentials)

  const connection = {
    id: crypto.randomUUID(),
    tenantId,
    appId,
    appName: app.name,
    appIcon: app.icon || '',
    displayName,
    status: 'connected',
    authType: app.authType || 'oauth',
    storageRef,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
    accountIdentifier: options.accountIdentifier || null,
    oauthProvider: options.oauthProvider || null,
  }

  getTenantStore(tenantId).set(connection.id, connection)
  return connection
}

/**
 * List connections for a tenant, optionally filtered by appId.
 */
function listConnections(tenantId, appId) {
  const all = Array.from(getTenantStore(tenantId).values())
  return appId ? all.filter(c => c.appId === appId) : all
}

/**
 * Get a single connection by tenant and connection ID.
 */
function getConnection(tenantId, connectionId) {
  return getTenantStore(tenantId).get(connectionId) || undefined
}

/**
 * Update connection status.
 */
function updateConnectionStatus(tenantId, connectionId, status) {
  const conn = getTenantStore(tenantId).get(connectionId)
  if (!conn) return null

  const updated = {
    ...conn,
    status,
    updatedAt: new Date().toISOString(),
  }
  getTenantStore(tenantId).set(connectionId, updated)
  return updated
}

/**
 * Create or update a connection from a Nango webhook event.
 * No credentials stored locally — Nango owns them for OAuth connections.
 */
function upsertFromNango(tenantId, { appId, nangoConnectionId, nangoProviderConfigKey, accountIdentifier }) {
  const app = APP_CATALOG.find(a => a.id === appId)
  if (!app) throw new Error(`Unknown app: ${appId}`)

  const store = getTenantStore(tenantId)
  const now = new Date().toISOString()

  // Check if connection already exists for this tenant + appId
  const existing = Array.from(store.values()).find(c => c.appId === appId)

  if (existing) {
    const updated = {
      ...existing,
      status: 'connected',
      nangoConnectionId,
      nangoProviderConfigKey: nangoProviderConfigKey || existing.nangoProviderConfigKey,
      accountIdentifier: accountIdentifier || existing.accountIdentifier,
      displayName: accountIdentifier || existing.displayName,
      updatedAt: now,
    }
    store.set(existing.id, updated)
    return updated
  }

  // Create new
  const connection = {
    id: crypto.randomUUID(),
    tenantId,
    appId,
    appName: app.name,
    appIcon: app.icon || '',
    displayName: accountIdentifier || `${app.name} connection`,
    status: 'connected',
    authType: 'oauth',
    storageRef: null,           // Nango owns tokens — no local storage
    nangoConnectionId,
    nangoProviderConfigKey: nangoProviderConfigKey || null,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
    accountIdentifier: accountIdentifier || null,
    oauthProvider: app.oauthProvider || null,
  }

  store.set(connection.id, connection)
  return connection
}

/**
 * Find a connection by its Nango connectionId.
 */
function findConnectionByNangoId(tenantId, nangoConnectionId) {
  const all = Array.from(getTenantStore(tenantId).values())
  return all.find(c => c.nangoConnectionId === nangoConnectionId) || null
}

/**
 * Revoke a connection: purge credentials (only for non-OAuth) and set status to 'revoked'.
 */
function revokeConnection(tenantId, connectionId) {
  const conn = getTenantStore(tenantId).get(connectionId)
  if (!conn) return false

  // Only purge local credentials for non-OAuth connections
  if (conn.authType !== 'oauth' && conn.storageRef) {
    purgeCredentials(conn.storageRef)
  }

  const revoked = {
    ...conn,
    status: 'revoked',
    updatedAt: new Date().toISOString(),
  }
  getTenantStore(tenantId).set(connectionId, revoked)
  return true
}

// ── Test Helpers ─────────────────────────────────────────

function _clearAllConnections() {
  connectionStore.clear()
}

function _getConnectionCount(tenantId) {
  return getTenantStore(tenantId).size
}

module.exports = {
  createConnection,
  listConnections,
  getConnection,
  updateConnectionStatus,
  upsertFromNango,
  findConnectionByNangoId,
  revokeConnection,
  _clearAllConnections,
  _getConnectionCount,
}
