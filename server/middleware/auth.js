/**
 * Auth Middleware
 *
 * Extracts tenant identifier from the x-tenant-id header.
 * Defaults to "default" when the header is absent (dev compatibility).
 */

function authMiddleware(req, res, next) {
  req.tenantId = req.headers['x-tenant-id'] || 'default'
  next()
}

module.exports = authMiddleware
