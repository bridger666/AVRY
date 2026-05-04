// @ts-nocheck
/**
 * Property-Based Tests for SubStepIndicator Duration Display
 * 
 * **Validates: Requirement 6.3**
 * 
 * These tests verify correctness properties of SubStepIndicator duration rendering:
 * - Property 15: SubStepIndicator displays duration when provided
 * 
 * Verifies that:
 * - When duration prop is provided (non-null), elapsed time is shown alongside label
 * - When duration is null/undefined, no duration text is shown
 * - Duration is displayed after the label
 * - Duration formatting is correct for various millisecond values (whole seconds and fractional)
 */

import React from 'react'
import fc from 'fast-check'
import { render } from '@testing-library/react'
import type { SubStepIcon } from '@/types/agenticWorkflow'
import SubStepIndicator from '@/components/console/SubStepIndicator'

/**
 * Arbitraries for generating test data
 */

const subStepIconArbitrary = (): fc.Arbitrary<SubStepIcon> => {
  return fc.oneof(
    fc.constant('thinking' as const),
    fc.constant('editing' as const),
    fc.constant('searching' as const),
    fc.constant('generating' as const),
    fc.constant('terminal' as const),
    fc.constant('file' as const)
  )
}

const labelArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^[A-Za-z0-9\s\-]{3,50}$/)
}

const durationMsArbitrary = (): fc.Arbitrary<number> => {
  // Generate durations from 0ms to 60000ms (0-60 seconds)
  return fc.integer({ min: 0, max: 60000 })
}

const subStepIndicatorWithDurationArbitrary = (): fc.Arbitrary<{
  icon: SubStepIcon
  label: string
  duration: number
}> => {
  return fc
    .tuple(subStepIconArbitrary(), labelArbitrary(), durationMsArbitrary())
    .map(([icon, label, duration]) => ({
      icon,
      label,
      duration,
    }))
}

const subStepIndicatorWithoutDurationArbitrary = (): fc.Arbitrary<{
  icon: SubStepIcon
  label: string
}> => {
  return fc.tuple(subStepIconArbitrary(), labelArbitrary()).map(([icon, label]) => ({
    icon,
    label,
  }))
}

describe('SubStepIndicator Duration Display - Property-Based Tests', () => {
  describe('Property 15: SubStepIndicator displays duration when provided', () => {
    it('should display duration text when duration prop is provided', () => {
      fc.assert(
        fc.property(subStepIndicatorWithDurationArbitrary(), ({ icon, label, duration }) => {
          const { container } = render(
            <SubStepIndicator icon={icon} label={label} duration={duration} />
          )

          // Get the text content
          const text = container.textContent || ''

          // Duration should be formatted as "(Xs)" or "(X.Xs)"
          const seconds = duration / 1000
          const expectedDuration = Number.isInteger(seconds)
            ? `(${seconds}s)`
            : `(${seconds.toFixed(1)}s)`

          expect(text).toContain(expectedDuration)
        })
      )
    })

    it('should not display duration text when duration prop is undefined', () => {
      fc.assert(
        fc.property(subStepIndicatorWithoutDurationArbitrary(), ({ icon, label }) => {
          const { container } = render(<SubStepIndicator icon={icon} label={label} />)

          // Get the text content
          const text = container.textContent || ''

          // Should not contain any parentheses with 's' (duration format)
          const durationPattern = /\(\d+(?:\.\d+)?s\)/
          expect(text).not.toMatch(durationPattern)
        })
      )
    })

    it('should not display duration text when duration prop is null', () => {
      fc.assert(
        fc.property(subStepIndicatorWithoutDurationArbitrary(), ({ icon, label }) => {
          const { container } = render(
            <SubStepIndicator icon={icon} label={label} duration={null as any} />
          )

          // Get the text content
          const text = container.textContent || ''

          // Should not contain any parentheses with 's' (duration format)
          const durationPattern = /\(\d+(?:\.\d+)?s\)/
          expect(text).not.toMatch(durationPattern)
        })
      )
    })

    it('should display duration after the label', () => {
      fc.assert(
        fc.property(subStepIndicatorWithDurationArbitrary(), ({ icon, label, duration }) => {
          const { container } = render(
            <SubStepIndicator icon={icon} label={label} duration={duration} />
          )

          // Get the text content
          const text = container.textContent || ''

          // Label should appear before duration
          const labelIndex = text.indexOf(label)
          const durationPattern = /\(\d+(?:\.\d+)?s\)/
          const durationMatch = text.match(durationPattern)

          expect(labelIndex).toBeGreaterThanOrEqual(0)
          expect(durationMatch).not.toBeNull()

          if (durationMatch) {
            const durationIndex = text.indexOf(durationMatch[0])
            expect(durationIndex).toBeGreaterThan(labelIndex)
          }
        })
      )
    })

    it('should format whole seconds without decimal point', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 60 }).map((s) => s * 1000),
          (durationMs) => {
            const { container } = render(
              <SubStepIndicator icon="thinking" label="Test" duration={durationMs} />
            )

            const text = container.textContent || ''
            const seconds = durationMs / 1000

            // Should be formatted as "(Xs)" without decimal
            expect(text).toContain(`(${seconds}s)`)
            expect(text).not.toContain(`(${seconds}.0s)`)
          }
        )
      )
    })

    it('should format fractional seconds with one decimal place', () => {
      fc.assert(
        fc.property(
          fc.tuple(fc.integer({ min: 1, max: 60 }), fc.integer({ min: 1, max: 999 })),
          ([seconds, ms]) => {
            const durationMs = seconds * 1000 + ms
            const { container } = render(
              <SubStepIndicator icon="thinking" label="Test" duration={durationMs} />
            )

            const text = container.textContent || ''
            const expectedSeconds = (durationMs / 1000).toFixed(1)

            // Should be formatted with one decimal place
            expect(text).toContain(`(${expectedSeconds}s)`)
          }
        )
      )
    })

    it('should handle zero duration correctly', () => {
      const { container } = render(
        <SubStepIndicator icon="thinking" label="Test" duration={0} />
      )

      const text = container.textContent || ''

      // Zero duration should be formatted as "(0s)"
      expect(text).toContain('(0s)')
    })

    it('should handle very small durations (< 1 second)', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 999 }), (durationMs) => {
          const { container } = render(
            <SubStepIndicator icon="thinking" label="Test" duration={durationMs} />
          )

          const text = container.textContent || ''
          const expectedSeconds = (durationMs / 1000).toFixed(1)

          expect(text).toContain(`(${expectedSeconds}s)`)
        })
      )
    })

    it('should handle large durations (> 1 minute)', () => {
      fc.assert(
        fc.property(fc.integer({ min: 60000, max: 3600000 }), (durationMs) => {
          const { container } = render(
            <SubStepIndicator icon="thinking" label="Test" duration={durationMs} />
          )

          const text = container.textContent || ''
          const seconds = durationMs / 1000
          const expectedDuration = Number.isInteger(seconds)
            ? `(${seconds}s)`
            : `(${seconds.toFixed(1)}s)`

          expect(text).toContain(expectedDuration)
        })
      )
    })

    it('should display duration with correct styling (text-zinc-400)', () => {
      fc.assert(
        fc.property(subStepIndicatorWithDurationArbitrary(), ({ icon, label, duration }) => {
          const { container } = render(
            <SubStepIndicator icon={icon} label={label} duration={duration} />
          )

          // Find the span containing the duration
          const spans = container.querySelectorAll('span')
          let durationSpan: HTMLElement | null = null

          spans.forEach((span) => {
            const text = span.textContent || ''
            if (text.match(/\(\d+(?:\.\d+)?s\)/)) {
              durationSpan = span
            }
          })

          expect(durationSpan).not.toBeNull()

          // Verify the duration span has the correct class
          const className = durationSpan!.getAttribute('class') || ''
          expect(className).toContain('text-zinc-400')
        })
      )
    })

    it('should maintain label visibility when duration is displayed', () => {
      fc.assert(
        fc.property(subStepIndicatorWithDurationArbitrary(), ({ icon, label, duration }) => {
          const { container } = render(
            <SubStepIndicator icon={icon} label={label} duration={duration} />
          )

          const text = container.textContent || ''

          // Both label and duration should be visible
          expect(text).toContain(label)

          const seconds = duration / 1000
          const expectedDuration = Number.isInteger(seconds)
            ? `(${seconds}s)`
            : `(${seconds.toFixed(1)}s)`

          expect(text).toContain(expectedDuration)
        })
      )
    })

    it('should render with correct container structure when duration is provided', () => {
      fc.assert(
        fc.property(subStepIndicatorWithDurationArbitrary(), ({ icon, label, duration }) => {
          const { container } = render(
            <SubStepIndicator icon={icon} label={label} duration={duration} />
          )

          // Should have the main container div
          const mainDiv = container.querySelector('div')
          expect(mainDiv).not.toBeNull()

          // Should have inline-flex and gap-2 classes
          const className = mainDiv!.getAttribute('class') || ''
          expect(className).toContain('inline-flex')
          expect(className).toContain('gap-2')

          // Should have background color
          expect(className).toContain('bg-[#5A5A5A]')

          // Should have multiple spans (icon, label, duration)
          const spans = container.querySelectorAll('span')
          expect(spans.length).toBeGreaterThanOrEqual(3)
        })
      )
    })

    it('should render with correct container structure when duration is not provided', () => {
      fc.assert(
        fc.property(subStepIndicatorWithoutDurationArbitrary(), ({ icon, label }) => {
          const { container } = render(<SubStepIndicator icon={icon} label={label} />)

          // Should have the main container div
          const mainDiv = container.querySelector('div')
          expect(mainDiv).not.toBeNull()

          // Should have inline-flex and gap-2 classes
          const className = mainDiv!.getAttribute('class') || ''
          expect(className).toContain('inline-flex')
          expect(className).toContain('gap-2')

          // Should have background color
          expect(className).toContain('bg-[#5A5A5A]')

          // Should have exactly 2 spans (icon, label) when no duration
          const spans = container.querySelectorAll('span')
          expect(spans.length).toBe(2)
        })
      )
    })

    it('should display duration for all icon types', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary(), durationMsArbitrary()),
          ([icon, label, duration]) => {
            const { container } = render(
              <SubStepIndicator icon={icon} label={label} duration={duration} />
            )

            const text = container.textContent || ''
            const seconds = duration / 1000
            const expectedDuration = Number.isInteger(seconds)
              ? `(${seconds}s)`
              : `(${seconds.toFixed(1)}s)`

            expect(text).toContain(expectedDuration)
          }
        )
      )
    })

    it('should not display duration for any icon type when duration is undefined', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary()),
          ([icon, label]) => {
            const { container } = render(<SubStepIndicator icon={icon} label={label} />)

            const text = container.textContent || ''
            const durationPattern = /\(\d+(?:\.\d+)?s\)/

            expect(text).not.toMatch(durationPattern)
          }
        )
      )
    })

    it('should format duration consistently across multiple renders', () => {
      fc.assert(
        fc.property(subStepIndicatorWithDurationArbitrary(), ({ icon, label, duration }) => {
          const { container, rerender } = render(
            <SubStepIndicator icon={icon} label={label} duration={duration} />
          )

          const text1 = container.textContent || ''

          // Rerender with same props
          rerender(<SubStepIndicator icon={icon} label={label} duration={duration} />)

          const text2 = container.textContent || ''

          // Text should be identical
          expect(text2).toBe(text1)
        })
      )
    })

    it('should handle duration prop changes correctly', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary(), durationMsArbitrary(), durationMsArbitrary()),
          ([icon, label, duration1, duration2]) => {
            const { container, rerender } = render(
              <SubStepIndicator icon={icon} label={label} duration={duration1} />
            )

            const text1 = container.textContent || ''

            // Rerender with different duration
            rerender(<SubStepIndicator icon={icon} label={label} duration={duration2} />)

            const text2 = container.textContent || ''

            // Text should be different if formatted durations are different
            const seconds1 = duration1 / 1000
            const seconds2 = duration2 / 1000
            const formatted1 = Number.isInteger(seconds1) ? `${seconds1}s` : `${seconds1.toFixed(1)}s`
            const formatted2 = Number.isInteger(seconds2) ? `${seconds2}s` : `${seconds2.toFixed(1)}s`

            if (formatted1 !== formatted2) {
              expect(text2).not.toBe(text1)
            }

            // Both should contain duration format
            const durationPattern = /\(\d+(?:\.\d+)?s\)/
            expect(text1).toMatch(durationPattern)
            expect(text2).toMatch(durationPattern)
          }
        )
      )
    })

    it('should handle transition from duration to no duration', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary(), durationMsArbitrary()),
          ([icon, label, duration]) => {
            const { container, rerender } = render(
              <SubStepIndicator icon={icon} label={label} duration={duration} />
            )

            const text1 = container.textContent || ''
            const durationPattern = /\(\d+(?:\.\d+)?s\)/

            // Should have duration
            expect(text1).toMatch(durationPattern)

            // Rerender without duration
            rerender(<SubStepIndicator icon={icon} label={label} />)

            const text2 = container.textContent || ''

            // Should not have duration
            expect(text2).not.toMatch(durationPattern)

            // Label should still be present
            expect(text2).toContain(label)
          }
        )
      )
    })

    it('should handle transition from no duration to duration', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary(), durationMsArbitrary()),
          ([icon, label, duration]) => {
            const { container, rerender } = render(
              <SubStepIndicator icon={icon} label={label} />
            )

            const text1 = container.textContent || ''
            const durationPattern = /\(\d+(?:\.\d+)?s\)/

            // Should not have duration
            expect(text1).not.toMatch(durationPattern)

            // Rerender with duration
            rerender(<SubStepIndicator icon={icon} label={label} duration={duration} />)

            const text2 = container.textContent || ''

            // Should have duration
            expect(text2).toMatch(durationPattern)

            // Label should still be present
            expect(text2).toContain(label)
          }
        )
      )
    })
  })
})
