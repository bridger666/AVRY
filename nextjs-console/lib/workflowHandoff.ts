/**
 * Workflow Handoff Utilities
 * 
 * Implements localStorage-based handoff between AI Console and Workflow Tab.
 * Handles serialization, deserialization, TTL checking, and cleanup.
 */

import { AivoryWorkflowSpec } from '@/types/workflows'
import { parseWorkflowSpec, serializeWorkflowSpec } from './workflowSerializer'

const HANDOFF_KEY = 'pendingWorkflowSpec'
const HANDOFF_TTL_MS = 5 * 60 * 1000 // 5 minutes

export interface HandoffData {
  spec: AivoryWorkflowSpec
  timestamp: number
}

/**
 * Store a workflow spec in localStorage for handoff to Workflow Tab
 * 
 * @param spec - The workflow specification to store
 * @returns true if successful, false otherwise
 * 
 * @example
 * const spec = { name: "My Workflow", ... }
 * const success = storeWorkflowSpec(spec)
 * if (success) {
 *   window.location.href = '/workflows?fromConsole=true'
 * }
 */
export function storeWorkflowSpec(spec: AivoryWorkflowSpec): boolean {
  try {
    const handoffData: HandoffData = {
      spec,
      timestamp: Date.now(),
    }
    localStorage.setItem(HANDOFF_KEY, JSON.stringify(handoffData))
    return true
  } catch (err) {
    console.error('[storeWorkflowSpec] Failed to store spec:', err)
    return false
  }
}

/**
 * Retrieve a workflow spec from localStorage
 * 
 * Checks TTL and returns null if spec is stale (>5 minutes old).
 * 
 * @returns The workflow specification if valid, null otherwise
 * 
 * @example
 * const spec = retrieveWorkflowSpec()
 * if (spec) {
 *   renderWorkflow(spec)
 * } else {
 *   showMessage('Workflow session expired')
 * }
 */
export function retrieveWorkflowSpec(): AivoryWorkflowSpec | null {
  try {
    const stored = localStorage.getItem(HANDOFF_KEY)
    if (!stored) {
      return null
    }

    const handoffData: HandoffData = JSON.parse(stored)

    // Check TTL
    const age = Date.now() - handoffData.timestamp
    if (age > HANDOFF_TTL_MS) {
      console.warn('[retrieveWorkflowSpec] Spec is stale (age:', age, 'ms)')
      clearWorkflowSpec()
      return null
    }

    return handoffData.spec
  } catch (err) {
    console.error('[retrieveWorkflowSpec] Failed to retrieve spec:', err)
    return null
  }
}

/**
 * Clear the stored workflow spec from localStorage
 * 
 * @example
 * clearWorkflowSpec()
 */
export function clearWorkflowSpec(): void {
  try {
    localStorage.removeItem(HANDOFF_KEY)
  } catch (err) {
    console.error('[clearWorkflowSpec] Failed to clear spec:', err)
  }
}

/**
 * Check if a valid workflow spec is available in localStorage
 * 
 * @returns true if a valid spec is available, false otherwise
 * 
 * @example
 * if (hasWorkflowSpec()) {
 *   const spec = retrieveWorkflowSpec()
 *   renderWorkflow(spec)
 * }
 */
export function hasWorkflowSpec(): boolean {
  try {
    const stored = localStorage.getItem(HANDOFF_KEY)
    if (!stored) {
      return false
    }

    const handoffData: HandoffData = JSON.parse(stored)
    const age = Date.now() - handoffData.timestamp

    return age <= HANDOFF_TTL_MS
  } catch (err) {
    return false
  }
}

/**
 * Get the age of the stored workflow spec in milliseconds
 * 
 * @returns Age in milliseconds, or -1 if no spec is stored
 * 
 * @example
 * const age = getWorkflowSpecAge()
 * if (age > 0 && age < 60000) {
 *   console.log('Spec is less than 1 minute old')
 * }
 */
export function getWorkflowSpecAge(): number {
  try {
    const stored = localStorage.getItem(HANDOFF_KEY)
    if (!stored) {
      return -1
    }

    const handoffData: HandoffData = JSON.parse(stored)
    return Date.now() - handoffData.timestamp
  } catch (err) {
    return -1
  }
}

/**
 * Get the remaining TTL for the stored workflow spec in milliseconds
 * 
 * @returns Remaining TTL in milliseconds, or 0 if spec is expired or not found
 * 
 * @example
 * const remaining = getWorkflowSpecTTL()
 * if (remaining > 0) {
 *   console.log(`Spec expires in ${remaining / 1000} seconds`)
 * }
 */
export function getWorkflowSpecTTL(): number {
  const age = getWorkflowSpecAge()
  if (age < 0) {
    return 0
  }

  const remaining = HANDOFF_TTL_MS - age
  return Math.max(0, remaining)
}
