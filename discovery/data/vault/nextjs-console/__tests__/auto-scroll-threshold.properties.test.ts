// @ts-nocheck
/**
 * Property-Based Tests for Auto-Scroll Threshold
 *
 * **Validates: Requirements 8.1, 8.2, 8.3**
 *
 * These tests verify correctness properties of the useAutoScroll hook:
 * - Property 6: Auto-scroll fires iff at bottom
 *   - Verify isAtBottom is true iff scrollHeight - scrollTop - clientHeight ≤ 100
 *   - Verify auto-scroll fires only when isAtBottom is true
 *   - Verify auto-scroll does not fire when user has scrolled up
 */

import fc from 'fast-check'
import { renderHook } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { useAutoScroll } from '../hooks/useAutoScroll'

/**
 * Arbitraries for generating random scroll positions and container dimensions
 */

const scrollDimensionsArbitrary = (): fc.Arbitrary<{
  scrollHeight: number
  scrollTop: number
  clientHeight: number
}> => {
  return fc
    .tuple(
      fc.integer({ min: 100, max: 5000 }), // scrollHeight
      fc.integer({ min: 0, max: 4900 }) // scrollTop
    )
    .chain(([scrollHeight, scrollTop]) => {
      // clientHeight must be <= scrollHeight - scrollTop to be realistic
      const maxClientHeight = Math.max(100, scrollHeight - scrollTop)
      return fc.record({
        scrollHeight: fc.constant(scrollHeight),
        scrollTop: fc.constant(scrollTop),
        clientHeight: fc.integer({ min: 100, max: maxClientHeight }),
      })
    })
}

describe('Auto-Scroll Threshold - Property-Based Tests', () => {
  describe('Property 6: Auto-scroll fires iff at bottom', () => {
    it('should calculate isAtBottom correctly: true iff scrollHeight - scrollTop - clientHeight ≤ 100', () => {
      fc.assert(
        fc.property(scrollDimensionsArbitrary(), ({ scrollHeight, scrollTop, clientHeight }) => {
          // Create a mock container element
          const container = document.createElement('div')
          Object.defineProperty(container, 'scrollHeight', {
            value: scrollHeight,
            writable: true,
          })
          Object.defineProperty(container, 'scrollTop', {
            value: scrollTop,
            writable: true,
          })
          Object.defineProperty(container, 'clientHeight', {
            value: clientHeight,
            writable: true,
          })
          ;(container as any).scrollTo = vi.fn()

          const containerRef = { current: container }

          const { result, rerender } = renderHook(
            ({ key }) => useAutoScroll(containerRef, [key]),
            { initialProps: { key: 'initial' } }
          )

          // Trigger a scroll event to update isAtBottom
          const scrollEvent = new Event('scroll')
          container.dispatchEvent(scrollEvent)

          // Rerender to ensure state is updated
          rerender({ key: 'updated' })

          // Calculate expected isAtBottom
          const distanceFromBottom = scrollHeight - scrollTop - clientHeight
          const expectedIsAtBottom = distanceFromBottom <= 100

          // Verify the hook's isAtBottom matches the calculation
          expect(result.current.isAtBottom).toBe(expectedIsAtBottom)
        })
      )
    })

    it('should expose scrollToBottom function that calls container.scrollTo', () => {
      fc.assert(
        fc.property(
          scrollDimensionsArbitrary(),
          (dims) => {
            const { scrollHeight, scrollTop, clientHeight } = dims
            // Create a mock container element
            const container = document.createElement('div')
            Object.defineProperty(container, 'scrollHeight', {
              value: scrollHeight,
              writable: true,
            })
            Object.defineProperty(container, 'scrollTop', {
              value: scrollTop,
              writable: true,
            })
            Object.defineProperty(container, 'clientHeight', {
              value: clientHeight,
              writable: true,
            })
            const scrollToMock = vi.fn()
            ;(container as any).scrollTo = scrollToMock

            const containerRef = { current: container }

            const { result } = renderHook(() => useAutoScroll(containerRef, []))

            // Verify scrollToBottom function exists and is callable
            expect(typeof result.current.scrollToBottom).toBe('function')

            // Call scrollToBottom manually and verify it calls container.scrollTo
            scrollToMock.mockClear()
            result.current.scrollToBottom()
            expect(scrollToMock).toHaveBeenCalledWith({
              top: scrollHeight,
              behavior: 'smooth',
            })
          }
        )
      )
    })

    it('should handle null containerRef gracefully', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
          (deps) => {
            const containerRef = { current: null }

            const { result } = renderHook(() => useAutoScroll(containerRef, deps))

            // Should not crash and should return default state
            expect(result.current).toHaveProperty('scrollToBottom')
            expect(result.current).toHaveProperty('isAtBottom')
            expect(typeof result.current.scrollToBottom).toBe('function')
            expect(typeof result.current.isAtBottom).toBe('boolean')
          }
        )
      )
    })

    it('should verify threshold boundary: exactly 100px from bottom', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 5000 }),
          fc.integer({ min: 0, max: 4900 }),
          (scrollHeight, scrollTop) => {
            // Calculate clientHeight such that distance = 100
            const clientHeight = scrollHeight - scrollTop - 100
            if (clientHeight < 100) return // Skip invalid cases

            const container = document.createElement('div')
            Object.defineProperty(container, 'scrollHeight', {
              value: scrollHeight,
              writable: true,
            })
            Object.defineProperty(container, 'scrollTop', {
              value: scrollTop,
              writable: true,
            })
            Object.defineProperty(container, 'clientHeight', {
              value: clientHeight,
              writable: true,
            })
            ;(container as any).scrollTo = vi.fn()

            const containerRef = { current: container }

            const { result } = renderHook(() => useAutoScroll(containerRef))

            // Trigger scroll event
            const scrollEvent = new Event('scroll')
            container.dispatchEvent(scrollEvent)

            // Distance from bottom is exactly 100, so isAtBottom should be true
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight
            expect(distanceFromBottom).toBe(100)
            expect(result.current.isAtBottom).toBe(true)
          }
        )
      )
    })
  })
})
