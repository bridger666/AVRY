/**
 * Token Vault
 *
 * In-memory credential storage keyed by opaque storage references (vault:UUID).
 * Credentials are never exposed to API responses.
 *
 * In production: replace with AWS Secrets Manager / HashiCorp Vault / encrypted DB.
 */

const crypto = require('crypto')

const credentialVault = new Map()

/**
 * Store credentials and return an opaque storage reference.
 */
function storeCredentials(credentials) {
  const ref = `vault:${crypto.randomUUID()}`
  credentialVault.set(ref, { ...credentials })
  return ref
}

/**
 * Retrieve credentials by storage reference.
 * Returns the credential object or undefined.
 */
function getCredentials(storageRef) {
  const creds = credentialVault.get(storageRef)
  return creds ? { ...creds } : undefined
}

/**
 * Update credentials at an existing storage reference.
 */
function updateCredentials(storageRef, credentials) {
  if (!credentialVault.has(storageRef)) return false
  credentialVault.set(storageRef, { ...credentials })
  return true
}

/**
 * Permanently delete credentials from the vault.
 */
function purgeCredentials(storageRef) {
  return credentialVault.delete(storageRef)
}

// ── Test Helpers ─────────────────────────────────────────

function _clearVault() {
  credentialVault.clear()
}

function _getVaultSize() {
  return credentialVault.size
}

module.exports = {
  storeCredentials,
  getCredentials,
  updateCredentials,
  purgeCredentials,
  _clearVault,
  _getVaultSize,
}
