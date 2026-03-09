/**
 * Configuration module for VPS Bridge integration
 *
 * Delegates to config/services.ts — the single source of truth for all URLs.
 * Do not add new hardcoded URLs here; add them to config/services.ts instead.
 */

import { SERVICES } from '@/config/services'

export interface Config {
  VPS_BRIDGE_URL: string
  VPS_BRIDGE_API_KEY: string
}

/**
 * VPS Bridge configuration for server-side API routes.
 * Used by routes that import VPS_BRIDGE_CONFIG directly.
 */
export const VPS_BRIDGE_CONFIG = {
  baseUrl: SERVICES.VPS_BRIDGE,
  apiKey: SERVICES.VPS_BRIDGE_API_KEY,
}

/**
 * Validates and returns the VPS bridge configuration.
 * Throws if required env vars are missing.
 */
export function getConfig(): Config {
  const VPS_BRIDGE_URL = process.env.VPS_BRIDGE_URL || process.env.NEXT_PUBLIC_VPS_BRIDGE_URL
  const VPS_BRIDGE_API_KEY = process.env.VPS_BRIDGE_API_KEY || process.env.NEXT_PUBLIC_VPS_BRIDGE_API_KEY

  const missingVars: string[] = []

  if (!VPS_BRIDGE_URL) missingVars.push('VPS_BRIDGE_URL')
  if (!VPS_BRIDGE_API_KEY) missingVars.push('VPS_BRIDGE_API_KEY')

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
      `Please ensure these are set in your .env.local file.`
    )
  }

  return {
    VPS_BRIDGE_URL: VPS_BRIDGE_URL!,
    VPS_BRIDGE_API_KEY: VPS_BRIDGE_API_KEY!,
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
  if (!process.env.VPS_BRIDGE_API_KEY && !process.env.NEXT_PUBLIC_VPS_BRIDGE_API_KEY) {
    missingVars.push('VPS_BRIDGE_API_KEY')
  }

  return { valid: missingVars.length === 0, missingVars }
}
