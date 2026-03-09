/**
 * AIVORY SERVICE CONFIGURATION
 * Single source of truth for all service URLs
 *
 * DO NOT hardcode URLs anywhere else in the codebase.
 * Always import from this file.
 *
 * To change a service URL, update ONLY this file.
 */

export const SERVICES = {
  /** Next.js App URL — client-side safe */
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  /** Next.js Console — server-side reference only */
  CONSOLE: process.env.NEXT_PUBLIC_CONSOLE_URL || 'http://localhost:3000',

  /** VPS Bridge — primary AI gateway */
  VPS_BRIDGE: process.env.VPS_BRIDGE_URL || 'http://localhost:3003',

  /** VPS Bridge API key */
  VPS_BRIDGE_API_KEY: process.env.VPS_BRIDGE_API_KEY || 'supersecret-xyz123456789',

  /** Zeroclaw Gateway on VPS */
  ZEROCLAW: 'http://43.156.108.96:3100',

  /** n8n base URL on VPS */
  N8N: process.env.N8N_URL || 'http://43.156.108.96:5678',

  /** n8n API key — server-side only */
  N8N_API_KEY: process.env.N8N_API_KEY || '',

  /** ARIA n8n webhook endpoint */
  ARIA_WEBHOOK: 'http://43.156.108.96:5678/webhook/755fcac8-dc36-49e3-9553-67e62bac82e8',

  /** OpenRouter API base URL */
  OPENROUTER: 'https://openrouter.ai/api/v1',
} as const

export const PORTS = {
  NEXTJS: 3000,
  VPS_BRIDGE: 3003,
  ZEROCLAW: 3100,
  N8N: 5678,
} as const
