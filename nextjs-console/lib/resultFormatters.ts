/**
 * Pure formatting helpers for the Deep Diagnostic Result Page.
 * All functions are null-safe and never throw — invalid inputs return "—".
 */

import type { OpportunityQuadrant } from '@/types/diagnostic'

/** Format a number as Indonesian Rupiah: "Rp 1.234.567" */
export function formatIDR(value: number | null | undefined): string {
  if (value === null || value === undefined || !isFinite(value) || isNaN(value)) return '—'
  const rounded = Math.round(value)
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `Rp ${formatted}`
}

/** Format a number as USD: "$1,234,567" */
export function formatUSD(value: number | null | undefined): string {
  if (value === null || value === undefined || !isFinite(value) || isNaN(value)) return '—'
  const rounded = Math.round(value)
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `$${formatted}`
}

/** Format a number as a percentage with one decimal place: "42.5%" */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !isFinite(value) || isNaN(value)) return '—'
  return `${value.toFixed(1)}%`
}

/** Format a number of months with singular/plural: "1 month" or "N months" */
export function formatMonths(value: number | null | undefined): string {
  if (value === null || value === undefined || !isFinite(value) || isNaN(value)) return '—'
  const rounded = Math.round(value)
  return rounded === 1 ? '1 month' : `${rounded} months`
}

/** Format an ISO date string as "15 Jun 2025" */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

/** Map a DimensionKey to its human-readable label */
export function humanizeDimensionKey(key: string): string {
  const map: Record<string, string> = {
    strategy: 'Strategy',
    data: 'Data',
    process: 'Process',
    people: 'People',
    governance: 'Governance',
  }
  if (key in map) return map[key]
  // Title-case unknown keys
  if (!key) return '—'
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/** Map an OpportunityQuadrant to its human-readable label */
export function humanizeQuadrant(quadrant: OpportunityQuadrant | string | null | undefined): string {
  if (!quadrant) return '—'
  const map: Record<string, string> = {
    quick_win: 'Quick Win',
    major_project: 'Major Project',
    fill_in: 'Fill In',
    thankless_task: 'Thankless Task',
  }
  return map[quadrant] ?? '—'
}
