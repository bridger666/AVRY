/**
 * AVRY Express OAuth Server
 *
 * Standalone backend handling the full OAuth lifecycle:
 * initiation, callback, token exchange, storage, refresh, revocation, status.
 */

require('dotenv').config()

const express = require('express')
const cors = require('cors')
const authMiddleware = require('./middleware/auth')
const nangoOAuthRoutes = require('./routes/nangoOAuth')
const verifyNangoWebhook = require('./middleware/nangoWebhook')
const { upsertFromNango, findConnectionByNangoId, updateConnectionStatus } = require('./lib/connectionStore')
const { getConnection: getNangoConnection } = require('./lib/nangoClient')
const { parseConnectionId, getAppIdFromConfigKey } = require('./lib/nangoProviderMap')

const app = express()
const PORT = parseInt(process.env.EXPRESS_PORT, 10) || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

// ── CORS ─────────────────────────────────────────────────
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}))

// ── Body Parsing ─────────────────────────────────────────
app.use(express.json())

// ── Health Check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// ── OAuth Routes (with auth middleware) ──────────────────
app.use('/auth', authMiddleware, nangoOAuthRoutes)

// ── Nango Webhook (no auth middleware — verified by signature) ──
app.post('/nango/webhook', verifyNangoWebhook, async (req, res) => {
  try {
    const { type, connectionId, providerConfigKey, success, operation } = req.body

    // Only process auth-related webhooks
    if (type !== 'auth') {
      return res.status(200).json({ acknowledged: true })
    }

    const parsed = parseConnectionId(connectionId)
    if (!parsed) {
      console.error('[Nango Webhook] Invalid connectionId format:', connectionId)
      return res.status(200).json({ acknowledged: true })
    }

    const { tenantId, appId } = parsed

    if (success && operation === 'creation') {
      // Fetch account identifier from Nango
      let accountIdentifier = null
      try {
        const conn = await getNangoConnection(providerConfigKey, connectionId)
        accountIdentifier = conn?.metadata?.email
          || conn?.metadata?.login
          || conn?.metadata?.display_name
          || null
      } catch (e) { /* non-critical */ }

      upsertFromNango(tenantId, {
        appId,
        nangoConnectionId: connectionId,
        nangoProviderConfigKey: providerConfigKey,
        accountIdentifier,
      })
    } else if (!success) {
      const conn = findConnectionByNangoId(tenantId, connectionId)
      if (conn) {
        updateConnectionStatus(tenantId, conn.id, 'needs_reauth')
      }
    }

    res.status(200).json({ acknowledged: true })
  } catch (err) {
    console.error('[Nango Webhook] Error:', err.message)
    res.status(200).json({ acknowledged: true })
  }
})

// ── Global Error Handler ─────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Express OAuth Server] Unhandled error:', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

// ── Start Server ─────────────────────────────────────────
let server

if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`[Express OAuth Server] Listening on port ${PORT}`)
    console.log(`[Express OAuth Server] CORS origin: ${FRONTEND_URL}`)
  })
}

// ── Graceful Shutdown ────────────────────────────────────
function shutdown(signal) {
  console.log(`\n[Express OAuth Server] ${signal} received, shutting down...`)
  if (server) {
    server.close(() => {
      console.log('[Express OAuth Server] Closed.')
      process.exit(0)
    })
  } else {
    process.exit(0)
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

module.exports = app
