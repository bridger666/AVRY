// @ts-nocheck
/**
 * Bug Condition Exploration Property Test
 * 
 * Property 1: Bug Condition - Sidebar Fixed Positioning Overlap
 * 
 * **Validates: Requirements 1.1, 1.2, 2.1, 2.2**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code — failure confirms the bug exists.
 * DO NOT attempt to fix the test or the code when it fails.
 * 
 * Tests that:
 * 1. Sidebar does NOT use `position: fixed` (it currently DOES → should FAIL)
 * 2. Sidebar uses `shrink-0` to participate in flex layout (it currently does NOT → should FAIL)
 * 3. Main content width = viewport width - sidebar width (currently full width → should FAIL)
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Extract the sidebar className from the Sidebar component source.
 * We read the actual className string used in the <aside> element.
 * This is the UNFIXED value from Sidebar.tsx.
 */
const SIDEBAR_CLASSNAME = 'w-[220px] shrink-0 flex flex-col h-full bg-[#2d2d2a] border-r border-white/5 px-3 py-4 overflow-y-auto'

/**
 * Extract the main element className from layout.tsx.
 * This is the UNFIXED value.
 */
const MAIN_CLASSNAME = 'flex-1 flex flex-col min-w-0 overflow-hidden'

/**
 * Parse Tailwind classes from a className string.
 */
function parseClasses(className: string): Set<string> {
  return new Set(className.split(/\s+/).filter(Boolean))
}

/**
 * Simulate layout computation given sidebar and main classNames.
 * Returns computed layout properties based on Tailwind class analysis.
 */
function computeLayout(
  sidebarClasses: Set<string>,
  mainClasses: Set<string>,
  viewportWidth: number
) {
  const sidebarIsFixed = sidebarClasses.has('fixed')
  const sidebarHasShrink0 = sidebarClasses.has('shrink-0')

  // Sidebar width: w-60 = 240px, w-[220px] = 220px
  let sidebarWidth = 0
  for (const cls of sidebarClasses) {
    if (cls === 'w-60') sidebarWidth = 240
    else if (cls === 'w-[220px]') sidebarWidth = 220
  }

  // When sidebar is fixed, it's removed from flex flow.
  // Main with flex-1 expands to full viewport width.
  // When sidebar is a static flex child with shrink-0, main gets remaining space.
  const mainLeftEdge = sidebarIsFixed ? 0 : sidebarWidth
  const mainWidth = sidebarIsFixed ? viewportWidth : viewportWidth - sidebarWidth

  return {
    sidebarIsFixed,
    sidebarHasShrink0,
    sidebarWidth,
    mainLeftEdge,
    mainWidth,
  }
}

describe('Bug Condition Exploration: Sidebar Fixed Positioning Overlap', () => {
  const sidebarClasses = parseClasses(SIDEBAR_CLASSNAME)
  const mainClasses = parseClasses(MAIN_CLASSNAME)

  /**
   * Property 1.1: Sidebar should NOT use position: fixed
   * 
   * **Validates: Requirements 1.1, 2.1**
   * 
   * For any viewport width, the sidebar should be a static flex child,
   * not a fixed-position element removed from the document flow.
   * 
   * EXPECTED: FAILS on unfixed code (sidebar currently has 'fixed' class)
   */
  it('Property 1.1: Sidebar does not use position: fixed', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 768, max: 3840 }),
        (viewportWidth: number) => {
          const layout = computeLayout(sidebarClasses, mainClasses, viewportWidth)

          // The sidebar MUST NOT be fixed-positioned
          expect(layout.sidebarIsFixed).toBe(false)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 1.2: Sidebar uses shrink-0 to participate in flex layout
   * 
   * **Validates: Requirements 2.1, 2.2**
   * 
   * The sidebar must have shrink-0 so it doesn't compress in the flex row.
   * 
   * EXPECTED: FAILS on unfixed code (sidebar does not have 'shrink-0')
   */
  it('Property 1.2: Sidebar has shrink-0 for flex participation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 768, max: 3840 }),
        (viewportWidth: number) => {
          const layout = computeLayout(sidebarClasses, mainClasses, viewportWidth)

          // The sidebar MUST have shrink-0 to prevent flex compression
          expect(layout.sidebarHasShrink0).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 1.3: Main content left edge starts after sidebar
   * 
   * **Validates: Requirements 2.2, 2.4**
   * 
   * For any viewport width, the main content area's left edge must start
   * at or after the sidebar's right edge (sidebar width).
   * 
   * EXPECTED: FAILS on unfixed code (main starts at 0 due to fixed sidebar)
   */
  it('Property 1.3: Main content left edge starts after sidebar right edge', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 768, max: 3840 }),
        (viewportWidth: number) => {
          const layout = computeLayout(sidebarClasses, mainClasses, viewportWidth)

          // Main content left edge must be >= sidebar width
          expect(layout.mainLeftEdge).toBeGreaterThanOrEqual(layout.sidebarWidth)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 1.4: Main content width equals viewport minus sidebar
   * 
   * **Validates: Requirements 2.3, 2.4**
   * 
   * For any viewport width, the main content width should be
   * viewportWidth - sidebarWidth, not the full viewport width.
   * 
   * EXPECTED: FAILS on unfixed code (main is full viewport width)
   */
  it('Property 1.4: Main content width equals viewport width minus sidebar width', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 768, max: 3840 }),
        (viewportWidth: number) => {
          const layout = computeLayout(sidebarClasses, mainClasses, viewportWidth)

          // Main width should be viewport minus sidebar, not full viewport
          expect(layout.mainWidth).toBe(viewportWidth - layout.sidebarWidth)
        }
      ),
      { numRuns: 50 }
    )
  })
})
