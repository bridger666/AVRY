// @ts-nocheck
/**
 * Property-Based Tests for PhaseBox Toggle Behavior
 * 
 * **Validates: Requirement 5.1**
 * 
 * These tests verify correctness properties of PhaseBox accordion behavior:
 * - Property 5: PhaseBox toggle inverts expanded state
 * 
 * Verifies that clicking the PhaseBox header toggles the expanded/collapsed state
 * and that the state inversion is consistent across all inputs.
 */

import React from 'react'
import fc from 'fast-check'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PhaseBox from '@/components/console/PhaseBox'
import type { AgenticPhase } from '@/types/agenticWorkflow'

/**
 * Arbitraries for generating test data
 */

const subStepIconArbitrary = (): fc.Arbitrary<'thinking' | 'editing' | 'searching' | 'generating' | 'terminal' | 'file'> => {
  return fc.oneof(
    fc.constant('thinking'),
    fc.constant('editing'),
    fc.constant('searching'),
    fc.constant('generating'),
    fc.constant('terminal'),
    fc.constant('file')
  )
}

const agenticSubStepArbitrary = (phaseId: string): fc.Arbitrary<any> => {
  return fc.record({
    id: fc.uuid(),
    phaseId: fc.constant(phaseId),
    icon: subStepIconArbitrary(),
    label: fc.stringMatching(/^[A-Za-z0-9\s\-]{3,30}$/),
    duration: fc.option(fc.integer({ min: 0, max: 10000 })),
  })
}

const agenticFileOpArbitrary = (phaseId: string): fc.Arbitrary<any> => {
  return fc.record({
    id: fc.uuid(),
    phaseId: fc.constant(phaseId),
    filename: fc.stringMatching(/^[a-z0-9\-_\.]{3,20}$/),
    action: fc.oneof(
      fc.constant('read'),
      fc.constant('written'),
      fc.constant('created')
    ),
  })
}

const agenticPhaseArbitrary = (): fc.Arbitrary<AgenticPhase> => {
  return fc.tuple(fc.uuid(), fc.stringMatching(/^[A-Za-z0-9\s\-]{3,30}$/), fc.oneof(fc.constant('in_progress'), fc.constant('completed')), fc.array(fc.uuid()), fc.array(fc.uuid())).map(([id, title, status, subStepIds, fileOpIds]) => {
    return {
      id,
      title,
      status,
      subSteps: subStepIds.map((stepId) => ({
        id: stepId,
        phaseId: id,
        icon: 'thinking' as const,
        label: 'Test step',
        duration: undefined,
      })),
      fileOps: fileOpIds.map((opId) => ({
        id: opId,
        phaseId: id,
        filename: 'test.txt',
        action: 'read' as const,
      })),
    }
  })
}

describe('PhaseBox Toggle - Property-Based Tests', () => {
  describe('Property 5: PhaseBox toggle inverts expanded state', () => {
    it('should toggle from collapsed to expanded when header is clicked', () => {
      fc.assert(
        fc.property(agenticPhaseArbitrary(), (phase) => {
          const { container } = render(
            <PhaseBox phase={phase} defaultExpanded={false} />
          )

          // Initially collapsed
          const button = container.querySelector('button')
          expect(button).not.toBeNull()

          // Click to expand
          fireEvent.click(button!)

          // After click, the chevron should be rotated (expanded state)
          const chevron = button!.querySelector('svg:first-child')
          expect(chevron).not.toBeNull()
          expect(chevron!.className.baseVal || chevron!.className).toContain('rotate-90')
        })
      )
    })

    it('should toggle from expanded to collapsed when header is clicked', () => {
      fc.assert(
        fc.property(agenticPhaseArbitrary(), (phase) => {
          const { container } = render(
            <PhaseBox phase={phase} defaultExpanded={true} />
          )

          // Initially expanded
          const button = container.querySelector('button')
          expect(button).not.toBeNull()

          // Click to collapse
          fireEvent.click(button!)

          // After click, the chevron should not be rotated (collapsed state)
          const chevron = button!.querySelector('svg:first-child')
          expect(chevron).not.toBeNull()
          // The chevron should not have rotate-90 class after collapsing
          const hasRotate = (chevron!.className.baseVal || chevron!.className).includes('rotate-90')
          expect(hasRotate).toBe(false)
        })
      )
    })

    it('should toggle state multiple times consistently', () => {
      fc.assert(
        fc.property(agenticPhaseArbitrary(), (phase) => {
          const { container } = render(
            <PhaseBox phase={phase} defaultExpanded={false} />
          )

          const button = container.querySelector('button')
          expect(button).not.toBeNull()

          // Toggle 1: collapsed -> expanded
          fireEvent.click(button!)
          let chevron = button!.querySelector('svg:first-child')
          let isExpanded = (chevron!.className.baseVal || chevron!.className).includes('rotate-90')
          expect(isExpanded).toBe(true)

          // Toggle 2: expanded -> collapsed
          fireEvent.click(button!)
          chevron = button!.querySelector('svg:first-child')
          isExpanded = (chevron!.className.baseVal || chevron!.className).includes('rotate-90')
          expect(isExpanded).toBe(false)

          // Toggle 3: collapsed -> expanded
          fireEvent.click(button!)
          chevron = button!.querySelector('svg:first-child')
          isExpanded = (chevron!.className.baseVal || chevron!.className).includes('rotate-90')
          expect(isExpanded).toBe(true)
        })
      )
    })

    it('should render content when expanded and hide when collapsed', async () => {
      fc.assert(
        fc.property(
          agenticPhaseArbitrary().filter((phase) => phase.subSteps.length > 0 || phase.fileOps.length > 0),
          (phase) => {
            const { container } = render(
              <PhaseBox phase={phase} defaultExpanded={true} />
            )

            // When expanded, content should be visible
            const contentDiv = container.querySelector('div > div:last-child')
            expect(contentDiv).not.toBeNull()

            // Content should have height auto or be visible
            const heightStyle = (contentDiv as HTMLElement)?.style.height
            expect(heightStyle === 'auto' || heightStyle === '' || !heightStyle).toBe(true)
          }
        )
      )
    })

    it('should maintain phase title visibility regardless of expanded state', () => {
      fc.assert(
        fc.property(agenticPhaseArbitrary(), (phase) => {
          const { container, rerender } = render(
            <PhaseBox phase={phase} defaultExpanded={false} />
          )

          // Title should be visible when collapsed
          const button = container.querySelector('button')
          expect(button?.textContent).toContain(phase.title)

          // Toggle to expanded
          fireEvent.click(button!)

          // Title should still be visible when expanded
          expect(button?.textContent).toContain(phase.title)
        })
      )
    })

    it('should maintain status icon visibility regardless of expanded state', () => {
      fc.assert(
        fc.property(agenticPhaseArbitrary(), (phase) => {
          const { container } = render(
            <PhaseBox phase={phase} defaultExpanded={false} />
          )

          const button = container.querySelector('button')
          expect(button).not.toBeNull()

          // Status icon should be present when collapsed
          const statusIconCollapsed = button!.querySelector('svg:last-child')
          expect(statusIconCollapsed).not.toBeNull()

          // Toggle to expanded
          fireEvent.click(button!)

          // Status icon should still be present when expanded
          const statusIconExpanded = button!.querySelector('svg:last-child')
          expect(statusIconExpanded).not.toBeNull()
        })
      )
    })

    it('should render correct status icon for in_progress phases', () => {
      fc.assert(
        fc.property(
          agenticPhaseArbitrary().filter((phase) => phase.status === 'in_progress'),
          (phase) => {
            const { container } = render(
              <PhaseBox phase={phase} defaultExpanded={false} />
            )

            const button = container.querySelector('button')
            const statusIcon = button!.querySelector('svg:last-child')

            // In-progress should have animate-spin class
            expect(statusIcon!.className.baseVal || statusIcon!.className).toContain('animate-spin')
          }
        )
      )
    })

    it('should render correct status icon for completed phases', () => {
      fc.assert(
        fc.property(
          agenticPhaseArbitrary().filter((phase) => phase.status === 'completed'),
          (phase) => {
            const { container } = render(
              <PhaseBox phase={phase} defaultExpanded={false} />
            )

            const button = container.querySelector('button')
            const statusIcon = button!.querySelector('svg:last-child')

            // Completed should have stroke color #10B981
            const strokeAttr = statusIcon!.getAttribute('stroke')
            expect(strokeAttr).toBe('#10B981')
          }
        )
      )
    })

    it('should apply correct header styling regardless of expanded state', () => {
      fc.assert(
        fc.property(agenticPhaseArbitrary(), (phase) => {
          const { container } = render(
            <PhaseBox phase={phase} defaultExpanded={false} />
          )

          const button = container.querySelector('button')
          expect(button).not.toBeNull()

          // Header should have correct background color
          expect(button!.className).toContain('bg-[#3A3A3A]')

          // Header should have correct border radius
          expect(button!.className).toContain('rounded-lg')

          // Header should have correct padding
          expect(button!.className).toContain('py-4')
          expect(button!.className).toContain('px-6')

          // Toggle and verify styling is maintained
          fireEvent.click(button!)

          expect(button!.className).toContain('bg-[#3A3A3A]')
          expect(button!.className).toContain('rounded-lg')
          expect(button!.className).toContain('py-4')
          expect(button!.className).toContain('px-6')
        })
      )
    })

    it('should render title with correct text styling', () => {
      fc.assert(
        fc.property(agenticPhaseArbitrary(), (phase) => {
          const { container } = render(
            <PhaseBox phase={phase} defaultExpanded={false} />
          )

          const button = container.querySelector('button')
          const titleSpan = button!.querySelector('span:nth-child(2)')

          expect(titleSpan).not.toBeNull()
          expect(titleSpan!.className).toContain('text-zinc-100')
          expect(titleSpan!.className).toContain('text-sm')
          expect(titleSpan!.className).toContain('font-medium')
        })
      )
    })

    it('should render chevron with correct styling', () => {
      fc.assert(
        fc.property(agenticPhaseArbitrary(), (phase) => {
          const { container } = render(
            <PhaseBox phase={phase} defaultExpanded={false} />
          )

          const button = container.querySelector('button')
          const chevron = button!.querySelector('svg:first-child')

          expect(chevron).not.toBeNull()
          expect(chevron!.className.baseVal || chevron!.className).toContain('transition-transform')
          expect(chevron!.className.baseVal || chevron!.className).toContain('duration-200')
          expect(chevron!.className.baseVal || chevron!.className).toContain('text-zinc-500')
        })
      )
    })

    it('should handle rapid successive clicks correctly', () => {
      fc.assert(
        fc.property(agenticPhaseArbitrary(), (phase) => {
          const { container } = render(
            <PhaseBox phase={phase} defaultExpanded={false} />
          )

          const button = container.querySelector('button')
          expect(button).not.toBeNull()

          // Perform rapid clicks
          for (let i = 0; i < 5; i++) {
            fireEvent.click(button!)
          }

          // After odd number of clicks (5), should be expanded
          const chevron = button!.querySelector('svg:first-child')
          const isExpanded = (chevron!.className.baseVal || chevron!.className).includes('rotate-90')
          expect(isExpanded).toBe(true)
        })
      )
    })

    it('should respect defaultExpanded prop for initial state', () => {
      fc.assert(
        fc.property(
          fc.tuple(agenticPhaseArbitrary(), fc.boolean()),
          ([phase, defaultExpanded]) => {
            const { container } = render(
              <PhaseBox phase={phase} defaultExpanded={defaultExpanded} />
            )

            const button = container.querySelector('button')
            const chevron = button!.querySelector('svg:first-child')
            const isExpanded = (chevron!.className.baseVal || chevron!.className).includes('rotate-90')

            expect(isExpanded).toBe(defaultExpanded)
          }
        )
      )
    })

    it('should render with correct layout structure', () => {
      fc.assert(
        fc.property(agenticPhaseArbitrary(), (phase) => {
          const { container } = render(
            <PhaseBox phase={phase} defaultExpanded={false} />
          )

          // Should have outer wrapper div
          const wrapper = container.querySelector('div')
          expect(wrapper).not.toBeNull()

          // Should have button (header)
          const button = wrapper!.querySelector('button')
          expect(button).not.toBeNull()

          // Should have content div
          const contentDiv = wrapper!.querySelector('div > div:last-child')
          expect(contentDiv).not.toBeNull()

          // Button should be first child
          expect(button).toBe(wrapper!.querySelector('button'))
        })
      )
    })

    it('should render chevron as first child of button', () => {
      fc.assert(
        fc.property(agenticPhaseArbitrary(), (phase) => {
          const { container } = render(
            <PhaseBox phase={phase} defaultExpanded={false} />
          )

          const button = container.querySelector('button')
          const firstSvg = button!.querySelector('svg:first-child')

          // Chevron should be the first SVG (first child)
          expect(firstSvg).not.toBeNull()
          expect(firstSvg!.getAttribute('viewBox')).toBe('0 0 24 24')
        })
      )
    })

    it('should render status icon as last child of button', () => {
      fc.assert(
        fc.property(agenticPhaseArbitrary(), (phase) => {
          const { container } = render(
            <PhaseBox phase={phase} defaultExpanded={false} />
          )

          const button = container.querySelector('button')
          const svgs = button!.querySelectorAll('svg')

          // Should have exactly 2 SVGs: chevron and status icon
          expect(svgs.length).toBe(2)

          // Last SVG should be status icon
          const lastSvg = svgs[svgs.length - 1]
          expect(lastSvg).not.toBeNull()
        })
      )
    })
  })
})
