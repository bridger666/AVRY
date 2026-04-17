/**
 * Nango Provider Map
 *
 * Maps AVRY app IDs to Nango providerConfigKeys.
 * These keys must match what's configured in the Nango Dashboard.
 */

const PROVIDER_MAP = {
  'gmail':             'google-mail',
  'google-drive':      'google-drive',
  'google-sheets':     'google-sheets',
  'google-calendar':   'google-calendar',
  'microsoft-teams':   'microsoft-teams',
  'outlook':           'outlook',
  'slack':             'slack',
  'github':            'github',
  'discord':           'discord',
  'dropbox':           'dropbox',
  'hubspot':           'hubspot',
  'salesforce':        'salesforce',
  'notion':            'notion',
  'trello':            'trello',
  'asana':             'asana',
  'linear':            'linear',
  'airtable':          'airtable',
  'shopify':           'shopify',
  'mailchimp':         'mailchimp',
  'intercom':          'intercom',
  'zendesk':           'zendesk',
}

// Reverse map: Nango configKey → AVRY appId
const REVERSE_MAP = Object.fromEntries(
  Object.entries(PROVIDER_MAP).map(([appId, configKey]) => [configKey, appId])
)

/**
 * Get Nango providerConfigKey for an AVRY appId.
 * Returns null if not mapped.
 */
function getProviderConfigKey(appId) {
  return PROVIDER_MAP[appId] || null
}

/**
 * Get AVRY appId from a Nango providerConfigKey.
 * Returns null if not mapped.
 */
function getAppIdFromConfigKey(configKey) {
  return REVERSE_MAP[configKey] || null
}

/**
 * Build a deterministic connectionId from tenantId and appId.
 */
function buildConnectionId(tenantId, appId) {
  return `${tenantId}:${appId}`
}

/**
 * Parse a connectionId back into { tenantId, appId }.
 * Returns null if the format is invalid.
 */
function parseConnectionId(connectionId) {
  if (!connectionId || typeof connectionId !== 'string') return null
  const idx = connectionId.indexOf(':')
  if (idx === -1) return null
  const tenantId = connectionId.substring(0, idx)
  const appId = connectionId.substring(idx + 1)
  if (!tenantId || !appId) return null
  return { tenantId, appId }
}

module.exports = {
  PROVIDER_MAP,
  REVERSE_MAP,
  getProviderConfigKey,
  getAppIdFromConfigKey,
  buildConnectionId,
  parseConnectionId,
}
