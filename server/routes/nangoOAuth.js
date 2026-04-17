/**
 * Nango OAuth Routes
 *
 * Simplified OAuth routes that delegate all OAuth mechanics to Nango SDK.
 * Replaces the per-provider handler approach in routes/oauth.js.
 */

const express = require('express')
const router = express.Router()

const { initiateAuth, getToken, deleteConnection } = require('../lib/nangoClient')
const {
  listConnections,
  getConnection,
  updateConnectionStatus,
  upsertFromNango,
  findConnectionByNangoId,
  revokeConnection,
} = require('../lib/connectionStore')
const { APP_CATALOG } = require('../lib/appCatalog')
const {
  getProviderConfigKey,
  getAppIdFromConfigKey,
  buildConnectionId,
  parseConnectionId,
} = require('../lib/nangoProviderMap')

// ── GET /auth/status ─────────────────────────────────────
router.get('/status', (req, res) => {
  try {
    const { appId } = req.query
    const connections = listConnections(req.tenantId, appId || undefined)

    const safe = connections.map(conn => ({
      id: conn.id,
      appId: conn.appId,
      appName: conn.appName,
      appIcon: conn.appIcon,
      provider: conn.oauthProvider,
      status: conn.status,
      displayName: conn.displayName,
      authType: conn.authType,
      accountIdentifier: conn.accountIdentifier,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt,
      lastUsedAt: conn.lastUsedAt,
    }))

    res.json(safe)
  } catch (err) {
    console.error('[OAuth Status] Error:', err.message)
    res.status(500).json({ error: 'Failed to retrieve connections' })
  }
})

// ── GET /auth/:provider ──────────────────────────────────
// Returns JSON { authUrl } instead of 302 redirect
router.get('/:provider', async (req, res) => {
  try {
    const { provider } = req.params
    const { appId } = req.query

    // Resolve the app from catalog
    const resolvedAppId = appId || (APP_CATALOG.find(a => a.oauthProvider === provider) || {}).id
    if (!resolvedAppId) {
      return res.status(400).json({ error: `Unknown provider: ${provider}` })
    }

    // Map to Nango providerConfigKey
    const providerConfigKey = getProviderConfigKey(resolvedAppId)
    if (!providerConfigKey) {
      return res.status(400).json({ error: `No Nango config for app: ${resolvedAppId}` })
    }

    // Build deterministic connectionId
    const connectionId = buildConnectionId(req.tenantId, resolvedAppId)

    // Call Nango to get auth URL
    const result = await initiateAuth(providerConfigKey, connectionId)

    res.json({ authUrl: result.url })
  } catch (err) {
    console.error(`[OAuth Initiate] Error for ${req.params.provider}:`, err.message)
    const status = err.statusCode === 503 ? 503 : 500
    const message = status === 503
      ? 'OAuth service temporarily unavailable'
      : 'Failed to initiate OAuth flow'
    res.status(status).json({ error: message })
  }
})

// ── GET /auth/token/:provider/:connectionId ──────────────
// Returns a fresh access token for n8n workflows
router.get('/token/:provider/:connectionId', async (req, res) => {
  try {
    const { provider, connectionId } = req.params

    const providerConfigKey = getProviderConfigKey(provider)
    if (!providerConfigKey) {
      return res.status(400).json({ error: `Unknown provider: ${provider}` })
    }

    const tokenData = await getToken(providerConfigKey, connectionId)

    res.json({
      accessToken: tokenData.accessToken,
      tokenType: tokenData.tokenType || 'Bearer',
      expiresAt: tokenData.expiresAt || null,
    })
  } catch (err) {
    console.error(`[OAuth Token] Error:`, err.message)
    const status = err.statusCode || 500
    if (status === 404) {
      // Connection doesn't exist in Nango
      return res.status(404).json({ error: 'Connection not found' })
    }
    if (status === 503) {
      return res.status(503).json({ error: 'OAuth service temporarily unavailable' })
    }
    res.status(status).json({ error: 'Failed to retrieve token' })
  }
})

// ── POST /auth/:provider/revoke/:connectionId ───────────
router.post('/:provider/revoke/:connectionId', async (req, res) => {
  try {
    const { provider, connectionId } = req.params
    const conn = getConnection(req.tenantId, connectionId)

    if (!conn) {
      return res.status(404).json({ error: 'Connection not found' })
    }

    // Delete from Nango if it's an OAuth connection
    if (conn.authType === 'oauth' && conn.nangoConnectionId) {
      const providerConfigKey = getProviderConfigKey(conn.appId) || conn.nangoProviderConfigKey
      if (providerConfigKey) {
        try {
          await deleteConnection(providerConfigKey, conn.nangoConnectionId)
        } catch (nangoErr) {
          console.warn(`[OAuth Revoke] Nango deletion failed for ${provider}:`, nangoErr.message)
          // Continue with local revocation even if Nango fails
        }
      }
    }

    const revoked = revokeConnection(req.tenantId, connectionId)
    if (revoked) {
      res.json({ success: true, message: 'Connection revoked' })
    } else {
      res.status(500).json({ error: 'Failed to revoke connection' })
    }
  } catch (err) {
    console.error(`[OAuth Revoke] Error:`, err.message)
    res.status(500).json({ error: 'Failed to revoke connection' })
  }
})

module.exports = router
