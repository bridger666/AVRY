// @ts-nocheck
/**
 * Property-Based Tests for Phase Status Icon Mapping
 * 
 * **Validates: Requirements 5.4, 5.5**
 * 
 * These tests verify correctness properties of phase status icon rendering:
 * - Property 4: Phase status icon matches data state
 * 
 * Verifies that:
 * - When status === 'completed', a green checkmark SVG (#10B981) is rendered
 * - When status === 'in_progress', a spinning indicator is rendered
 * - The icon color matches the specification (#10B981 for checkmark)
 */

import React from 'react'
import fc from 'fast-check'
import { render } from '@testing-library/react'
import type { AgenticPhase } from '@/types/agenticWorkflow'
import PhaseBox from '@/components/console/PhaseBox'

/**
 * Arbitraries for generating test data
 */

const phaseIdArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^[a-z0-9\-]{8,20}$/)
}

const phaseTitleArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^[A-Za-z0-9\s\-]{3,50}$/)
}

const completedPhaseArbitrary = (): fc.Arbitrary<AgenticPhase> => {
  return fc.tuple(phaseIdArbitrary(), phaseTitleArbitrary()).map(([id, title]) => ({
    id,
    title,
    status: 'completed' as const,
    subSteps: [],
    fileOps: [],
  }))
}

const inProgressPhaseArbitrary = (): fc.Arbitrary<AgenticPhase> => {
  return fc.tuple(phaseIdArbitrary(), phaseTitleArbitrary()).map(([id, title]) => ({
    id,
    title,
    status: 'in_progress' as const,
    subSteps: [],
    fileOps: [],
  }))
}

const phaseStatusArbitrary = (): fc.Arbitrary<'completed' | 'in_progress'> => {
  return fc.oneof(fc.constant('completed'), fc.constant('in_progress'))
}

const phaseArbitrary = (): fc.Arbitrary<AgenticPhase> => {
  return fc.tuple(phaseIdArbitrary(), phaseTitleArbitrary(), phaseStatusArbitrary()).map(
    ([id, title, status]) => ({
      id,
      title,
      status,
      subSteps: [],
      fileOps: [],
    })
  )
}

describe('Phase Status Icon Mapping - Property-Based Tests', () => {
  describe('Property 4: Phase status icon matches data state', () => {
    it('should render checkmark SVG when status is completed', () => {
      fc.assert(
        fc.property(completedPhaseArbitrary(), (phase) => {
          const { container } = render(<PhaseBox phase={phase} />)

          // Find all SVG elements in the phase box
          const svgs = container.querySelectorAll('svg')
          expect(svgs.length).toBeGreaterThan(0)

          // Find the status icon SVG (should be the last one in the header)
          // The status icon should be a checkmark (polyline with points)
          let hasCheckmark = false
          svgs.forEach((svg) => {
            const polyline = svg.querySelector('polyline')
            if (polyline && polyline.getAttribute('points') === '20 6 9 17 4 12') {
              hasCheckmark = true
            }
          })

          expect(hasCheckmark).toBe(true)
        })
      )
    })

    it('should render checkmark with green color (#10B981) when status is completed', () => {
      fc.assert(
        fc.property(completedPhaseArbitrary(), (phase) => {
          const { container } = render(<PhaseBox phase={phase} />)

          // Find the checkmark SVG
          const svgs = container.querySelectorAll('svg')
          let checkmarkSvg: SVGElement | null = null

          svgs.forEach((svg) => {
            const polyline = svg.querySelector('polyline')
            if (polyline && polyline.getAttribute('points') === '20 6 9 17 4 12') {
              checkmarkSvg = svg
            }
          })

          expect(checkmarkSvg).not.toBeNull()

          // Verify the checkmark has the correct stroke color
          const stroke = checkmarkSvg!.getAttribute('stroke')
          expect(stroke).toBe('#10B981')
        })
      )
    })

    it('should render spinning indicator when status is in_progress', () => {
      fc.assert(
        fc.property(inProgressPhaseArbitrary(), (phase) => {
          const { container } = render(<PhaseBox phase={phase} />)

          // Find all SVG elements
          const svgs = container.querySelectorAll('svg')
          expect(svgs.length).toBeGreaterThan(0)

          // Find the spinner SVG (should have a circle with stroke-dasharray)
          let hasSpinner = false
          svgs.forEach((svg) => {
            const circle = svg.querySelector('circle')
            if (circle && circle.getAttribute('stroke-dasharray')) {
              hasSpinner = true
            }
          })

          expect(hasSpinner).toBe(true)
        })
      )
    })

    it('should render spinner with animate-spin class when status is in_progress', () => {
      fc.assert(
        fc.property(inProgressPhaseArbitrary(), (phase) => {
          const { container } = render(<PhaseBox phase={phase} />)

          // Find all SVG elements
          const svgs = container.querySelectorAll('svg')
          let spinnerSvg: SVGElement | null = null

          svgs.forEach((svg) => {
            const circle = svg.querySelector('circle')
            if (circle && circle.getAttribute('stroke-dasharray')) {
              spinnerSvg = svg
            }
          })

          expect(spinnerSvg).not.toBeNull()

          // Verify the spinner has the animate-spin class
          const className = spinnerSvg!.getAttribute('class')
          expect(className).toContain('animate-spin')
        })
      )
    })

    it('should render correct icon for any valid phase status', () => {
      fc.assert(
        fc.property(phaseArbitrary(), (phase) => {
          const { container } = render(<PhaseBox phase={phase} />)

          const svgs = container.querySelectorAll('svg')
          expect(svgs.length).toBeGreaterThan(0)

          if (phase.status === 'completed') {
            // Should have checkmark
            let hasCheckmark = false
            svgs.forEach((svg) => {
              const polyline = svg.querySelector('polyline')
              if (polyline && polyline.getAttribute('points') === '20 6 9 17 4 12') {
                hasCheckmark = true
              }
            })
            expect(hasCheckmark).toBe(true)
          } else if (phase.status === 'in_progress') {
            // Should have spinner
            let hasSpinner = false
            svgs.forEach((svg) => {
              const circle = svg.querySelector('circle')
              if (circle && circle.getAttribute('stroke-dasharray')) {
                hasSpinner = true
              }
            })
            expect(hasSpinner).toBe(true)
          }
        })
      )
    })

    it('should render checkmark with correct stroke width for completed status', () => {
      fc.assert(
        fc.property(completedPhaseArbitrary(), (phase) => {
          const { container } = render(<PhaseBox phase={phase} />)

          const svgs = container.querySelectorAll('svg')
          let checkmarkSvg: SVGElement | null = null

          svgs.forEach((svg) => {
            const polyline = svg.querySelector('polyline')
            if (polyline && polyline.getAttribute('points') === '20 6 9 17 4 12') {
              checkmarkSvg = svg
            }
          })

          expect(checkmarkSvg).not.toBeNull()

          // Verify stroke width is 2
          const strokeWidth = checkmarkSvg!.getAttribute('stroke-width')
          expect(strokeWidth).toBe('2')
        })
      )
    })

    it('should render spinner with correct circle properties for in_progress status', () => {
      fc.assert(
        fc.property(inProgressPhaseArbitrary(), (phase) => {
          const { container } = render(<PhaseBox phase={phase} />)

          const svgs = container.querySelectorAll('svg')
          let spinnerCircle: SVGCircleElement | null = null

          svgs.forEach((svg) => {
            const circle = svg.querySelector('circle')
            if (circle && circle.getAttribute('stroke-dasharray')) {
              spinnerCircle = circle
            }
          })

          expect(spinnerCircle).not.toBeNull()

          // Verify circle properties
          expect(spinnerCircle!.getAttribute('cx')).toBe('12')
          expect(spinnerCircle!.getAttribute('cy')).toBe('12')
          expect(spinnerCircle!.getAttribute('r')).toBe('10')
          expect(spinnerCircle!.getAttribute('stroke-width')).toBe('2')
        })
      )
    })

    it('should not render checkmark when status is in_progress', () => {
      fc.assert(
        fc.property(inProgressPhaseArbitrary(), (phase) => {
          const { container } = render(<PhaseBox phase={phase} />)

          const svgs = container.querySelectorAll('svg')
          let hasCheckmark = false

          svgs.forEach((svg) => {
            const polyline = svg.querySelector('polyline')
            if (polyline && polyline.getAttribute('points') === '20 6 9 17 4 12') {
              hasCheckmark = true
            }
          })

          expect(hasCheckmark).toBe(false)
        })
      )
    })

    it('should not render spinner when status is completed', () => {
      fc.assert(
        fc.property(completedPhaseArbitrary(), (phase) => {
          const { container } = render(<PhaseBox phase={phase} />)

          const svgs = container.querySelectorAll('svg')
          let hasSpinner = false

          svgs.forEach((svg) => {
            const circle = svg.querySelector('circle')
            if (circle && circle.getAttribute('stroke-dasharray')) {
              hasSpinner = true
            }
          })

          expect(hasSpinner).toBe(false)
        })
      )
    })

    it('should render status icon in the correct position (right side of header)', () => {
      fc.assert(
        fc.property(phaseArbitrary(), (phase) => {
          const { container } = render(<PhaseBox phase={phase} />)

          // Find the button (header)
          const button = container.querySelector('button')
          expect(button).not.toBeNull()

          // The status icon should be the last child in the button
          const lastChild = button!.lastElementChild
          expect(lastChild).not.toBeNull()

          // The last child should contain an SVG
          const svg = lastChild!.querySelector('svg')
          expect(svg).not.toBeNull()
        })
      )
    })

    it('should maintain icon visibility across multiple renders', () => {
      fc.assert(
        fc.property(phaseArbitrary(), (phase) => {
          const { container, rerender } = render(<PhaseBox phase={phase} />)

          // Get initial icon
          const svgs1 = container.querySelectorAll('svg')
          const initialSvgCount = svgs1.length

          // Rerender with same phase
          rerender(<PhaseBox phase={phase} />)

          // Get icon after rerender
          const svgs2 = container.querySelectorAll('svg')
          const rerenderSvgCount = svgs2.length

          // SVG count should remain the same
          expect(rerenderSvgCount).toBe(initialSvgCount)
        })
      )
    })

    it('should render checkmark with correct SVG viewBox for completed status', () => {
      fc.assert(
        fc.property(completedPhaseArbitrary(), (phase) => {
          const { container } = render(<PhaseBox phase={phase} />)

          const svgs = container.querySelectorAll('svg')
          let checkmarkSvg: SVGElement | null = null

          svgs.forEach((svg) => {
            const polyline = svg.querySelector('polyline')
            if (polyline && polyline.getAttribute('points') === '20 6 9 17 4 12') {
              checkmarkSvg = svg
            }
          })

          expect(checkmarkSvg).not.toBeNull()

          // Verify viewBox
          const viewBox = checkmarkSvg!.getAttribute('viewBox')
          expect(viewBox).toBe('0 0 24 24')
        })
      )
    })

    it('should render spinner with correct SVG viewBox for in_progress status', () => {
      fc.assert(
        fc.property(inProgressPhaseArbitrary(), (phase) => {
          const { container } = render(<PhaseBox phase={phase} />)

          const svgs = container.querySelectorAll('svg')
          let spinnerSvg: SVGElement | null = null

          svgs.forEach((svg) => {
            const circle = svg.querySelector('circle')
            if (circle && circle.getAttribute('stroke-dasharray')) {
              spinnerSvg = svg
            }
          })

          expect(spinnerSvg).not.toBeNull()

          // Verify viewBox
          const viewBox = spinnerSvg!.getAttribute('viewBox')
          expect(viewBox).toBe('0 0 24 24')
        })
      )
    })
  })
})
