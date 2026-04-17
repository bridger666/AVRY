/**
 * Nango Webhook Signature Verification
 *
 * Validates incoming webhook requests from Nango using
 * HMAC-SHA256 signature in the x-nango-signature header.
 */

const crypto = require('crypto')

/**
 * Express middleware that verifies the Nango webhook signature.
 * Rejects requests with 401 if signature is missing or invalid.
 */
function verifyNangoWebhook(req, res, next) {
  const secret = process.env.NANGO_WEBHOOK_SECRET
  if (!secret) {
    console.error('[Nango Webhook] NANGO_WEBHOOK_SECRET not configured')
    return res.status(500).json({ error: 'Webhook verification not configured' })
  }

  const signature = req.headers['x-nango-signature']
  if (!signature) {
    return res.status(401).json({ error: 'Missing webhook signature' })
  }

  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  if (signature !== expected) {
    return res.status(401).json({ error: 'Invalid webhook signature' })
  }

  next()
}

module.exports = verifyNangoWebhook
