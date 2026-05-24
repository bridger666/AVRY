/**
 * Configuration module for VPS Bridge integration
 *
 * Delegates to config/services.ts — the single source of truth for all URLs.
 * Do not add new hardcoded URLs here; add them to config/services.ts instead.
 */

import { SERVICES } from '@/config/services'

export interface Config {
  VPS_BRIDGE_URL: string
  /** @deprecated VPS Bridge no longer validates API keys. Kept for legacy callers; always empty string. */
  VPS_BRIDGE_API_KEY: string
}

/**
 * VPS Bridge configuration for server-side API routes.
 * Used by routes that import VPS_BRIDGE_CONFIG directly.
 *
 * NOTE: VPS Bridge runs in internal-only mode (network isolation).
 * `apiKey` is kept for backward compatibility and is no longer sent or validated.
 */
export const VPS_BRIDGE_CONFIG = {
  baseUrl: SERVICES.VPS_BRIDGE,
  /** @deprecated no longer used; VPS Bridge is internal-only */
  apiKey: '',
}

/**
 * Returns the VPS bridge configuration.
 * Only VPS_BRIDGE_URL is required; API key is no longer validated.
 */
export function getConfig(): Config {
  const VPS_BRIDGE_URL = process.env.VPS_BRIDGE_URL || process.env.NEXT_PUBLIC_VPS_BRIDGE_URL

  if (!VPS_BRIDGE_URL) {
    throw new Error(
      `Missing required environment variable: VPS_BRIDGE_URL. ` +
      `Please ensure it is set in your .env.local file.`
    )
  }

  return {
    VPS_BRIDGE_URL,
    VPS_BRIDGE_API_KEY: '',
  }
}

/**
 * Validates configuration without throwing.
 * Useful for health checks and startup validation.
 */
export function validateConfig(): { valid: boolean; missingVars: string[] } {
  const missingVars: string[] = []

  if (!process.env.VPS_BRIDGE_URL && !process.env.NEXT_PUBLIC_VPS_BRIDGE_URL) {
    missingVars.push('VPS_BRIDGE_URL')
  }

  return { valid: missingVars.length === 0, missingVars }
}
