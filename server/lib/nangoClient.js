/**
 * Nango SDK Wrapper
 *
 * Single point of contact with Nango. Initializes the client
 * and exposes typed helper methods for OAuth operations.
 */

const { Nango } = require('@nangohq/node')

const nango = new Nango({
  secretKey: process.env.NANGO_SECRET_KEY || '',
  host: process.env.NANGO_HOST || 'https://api.nango.dev',
})

/**
 * Initiate an OAuth flow for a provider.
 * Returns the auth URL that the frontend should open in a popup.
 */
async function initiateAuth(providerConfigKey, connectionId) {
  try {
    const result = await nango.auth(providerConfigKey, connectionId)
    return { url: result.url || result }
  } catch (err) {
    const message = err?.response?.data?.message || err.message || 'Failed to initiate OAuth'
    const error = new Error(`[Nango] initiateAuth failed for ${providerConfigKey}: ${message}`)
    error.statusCode = err?.response?.status || 503
    throw error
  }
}

/**
 * Get a fresh access token (auto-refreshed by Nango).
 */
async function getToken(providerConfigKey, connectionId) {
  try {
    const token = await nango.getToken(providerConfigKey, connectionId)
    // getToken may return a string (access token) or an object
    if (typeof token === 'string') {
      return { accessToken: token, tokenType: 'Bearer', expiresAt: null }
    }
    return {
      accessToken: token.access_token || token,
      tokenType: token.token_type || 'Bearer',
      expiresAt: token.expires_at || null,
    }
  } catch (err) {
    const message = err?.response?.data?.message || err.message || 'Failed to get token'
    const error = new Error(`[Nango] getToken failed for ${providerConfigKey}/${connectionId}: ${message}`)
    error.statusCode = err?.response?.status || 503
    throw error
  }
}

/**
 * Get full connection details from Nango.
 */
async function getConnection(providerConfigKey, connectionId) {
  try {
    return await nango.getConnection(providerConfigKey, connectionId)
  } catch (err) {
    const message = err?.response?.data?.message || err.message || 'Failed to get connection'
    const error = new Error(`[Nango] getConnection failed for ${providerConfigKey}/${connectionId}: ${message}`)
    error.statusCode = err?.response?.status || 503
    throw error
  }
}

/**
 * Delete a connection from Nango (purges stored tokens).
 */
async function deleteConnection(providerConfigKey, connectionId) {
  try {
    await nango.deleteConnection(providerConfigKey, connectionId)
  } catch (err) {
    const message = err?.response?.data?.message || err.message || 'Failed to delete connection'
    const error = new Error(`[Nango] deleteConnection failed for ${providerConfigKey}/${connectionId}: ${message}`)
    error.statusCode = err?.response?.status || 503
    throw error
  }
}

module.exports = { nango, initiateAuth, getToken, getConnection, deleteConnection }
