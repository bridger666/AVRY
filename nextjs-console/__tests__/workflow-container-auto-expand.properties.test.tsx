// @ts-nocheck
/**
 * Property-Based Tests for WorkflowContainer Auto-Expand Last Phase
 * 
 * **Validates: Requirement 4.3**
 * 
 * These tests verify correctness properties of WorkflowContainer auto-expand behavior:
 * - Property 13: WorkflowContainer auto-expands last phase
 * 
 * Verifies that the last phase in any non-empty list is rendered expanded by default,
 * and all other phases are not auto-expanded.
 */

import React from 'react'
import fc from 'fast-check'
import { render } from '@testing-library/react'
import WorkflowContainer from '@/components/console/WorkflowContainer'
import type { AgenticPhase } from '@/types/agenticWorkflow'

/**
 * Arbitraries for generating test data
 */

const agenticPhaseArbitrary = (status: 'in_progress' | 'completed'): fc.Arbitrary<AgenticPhase> => {
  return fc.record({
    id: fc.uuid(),
    title: fc.stringMatching(/^[A-Za-z0-9\s\-]{3,30}$/),
    status: fc.constant(status),
    subSteps: fc.array(
      fc.record({
        id: fc.uuid(),
        phaseId: fc.uuid(),
        icon: fc.oneof(
          fc.constant('thinking'),
          fc.constant('editing'),
          fc.constant('searching'),
          fc.constant('generating'),
          fc.constant('terminal'),
          fc.constant('file')
        ) as fc.Arbitrary<'thinking' | 'editing' | 'searching' | 'generating' | 'terminal' | 'file'>,
        label: fc.stringMatching(/^[A-Za-z0-9\s\-]{3,30}$/),
        duration: fc.option(fc.integer({ min: 0, max: 10000 })),
      }),
      { maxLength: 3 }
    ),
    fileOps: fc.array(
      fc.record({
        id: fc.uuid(),
        phaseId: fc.uuid(),
        filename: fc.stringMatching(/^[a-z0-9\-_\.]{3,20}$/),
        action: fc.oneof(
          fc.constant('read'),
          fc.constant('written'),
          fc.constant('created')
        ) as fc.Arbitrary<'read' | 'written' | 'created'>,
      }),
      { maxLength: 3 }
    ),
  })
}

describe('WorkflowContainer Auto-Expand Last Phase - Property-Based Tests', () => {
  describe('Property 13: WorkflowContainer auto-expands last phase', () => {
    it('should render last phase expanded when phases list has one phase', () => {
      fc.assert(
        fc.property(
          fc.array(agenticPhaseArbitrary('in_progress'), { minLength: 1, maxLength: 1 }),
          (phases) => {
            const { container } = render(
              <WorkflowContainer phases={phases} isComplete={false} />
            )

            // Get all PhaseBox headers (buttons)
            const buttons = container.querySelectorAll('button')
            expect(buttons.length).toBeGreaterThan(0)

            // The only phase should be expanded (chevron rotated)
            const lastButton = buttons[buttons.length - 1]
            const chevron = lastButton.querySelector('svg:first-child')
            expect(chevron).not.toBeNull()

            // Expanded state is indicated by rotate-90 class on chevron
            const hasRotate = (chevron!.className.baseVal || chevron!.className).includes('rotate-90')
            expect(hasRotate).toBe(true)
          }
        )
      )
    })

    it('should render last phase expanded when phases list has multiple phases', () => {
      fc.assert(
        fc.property(
          fc.array(agenticPhaseArbitrary('in_progress'), { minLength: 2, maxLength: 5 }),
          (phases) => {
            const { container } = render(
              <WorkflowContainer phases={phases} isComplete={false} />
            )

            // Get all PhaseBox headers (buttons)
            const buttons = container.querySelectorAll('button')
            expect(buttons.length).toBe(phases.length)

            // The last phase should be expanded
            const lastButton = buttons[buttons.length - 1]
            const lastChevron = lastButton.querySelector('svg:first-child')
            expect(lastChevron).not.toBeNull()

            const lastIsExpanded = (lastChevron!.className.baseVal || lastChevron!.className).includes('rotate-90')
            expect(lastIsExpanded).toBe(true)
          }
        )
      )
    })

    it('should not auto-expand non-last phases when multiple phases exist', () => {
      fc.assert(
        fc.property(
          fc.array(agenticPhaseArbitrary('in_progress'), { minLength: 2, maxLength: 5 }),
          (phases) => {
            const { container } = render(
              <WorkflowContainer phases={phases} isComplete={false} />
            )

            // Get all PhaseBox headers (buttons)
            const buttons = container.querySelectorAll('button')
            expect(buttons.length).toBe(phases.length)

            // All non-last phases should be collapsed (no rotate-90)
            for (let i = 0; i < buttons.length - 1; i++) {
              const button = buttons[i]
              const chevron = button.querySelector('svg:first-child')
              expect(chevron).not.toBeNull()

              const isExpanded = (chevron!.className.baseVal || chevron!.className).includes('rotate-90')
              expect(isExpanded).toBe(false)
            }
          }
        )
      )
    })

    it('should not render any phases when phases list is empty', () => {
      fc.assert(
        fc.property(fc.constant(true), (isComplete) => {
          const { container } = render(
            <WorkflowContainer phases={[]} isComplete={isComplete} />
          )

          // Should have no PhaseBox headers
          const buttons = container.querySelectorAll('button')
          expect(buttons.length).toBe(0)
        })
      )
    })

    it('should render correct number of phases matching input array length', () => {
      fc.assert(
        fc.property(
          fc.array(agenticPhaseArbitrary('in_progress'), { minLength: 1, maxLength: 5 }),
          (phases) => {
            const { container } = render(
              <WorkflowContainer phases={phases} isComplete={false} />
            )

            // Get all PhaseBox headers (buttons)
            const buttons = container.querySelectorAll('button')
            expect(buttons.length).toBe(phases.length)
          }
        )
      )
    })

    it('should render last phase expanded regardless of phase status', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.array(agenticPhaseArbitrary('in_progress'), { minLength: 1, maxLength: 4 }),
            agenticPhaseArbitrary('completed')
          ),
          ([otherPhases, lastPhase]) => {
            const phases = [...otherPhases, lastPhase]

            const { container } = render(
              <WorkflowContainer phases={phases} isComplete={false} />
            )

            // Get all PhaseBox headers (buttons)
            const buttons = container.querySelectorAll('button')
            expect(buttons.length).toBe(phases.length)

            // The last phase should be expanded regardless of its status
            const lastButton = buttons[buttons.length - 1]
            const lastChevron = lastButton.querySelector('svg:first-child')
            expect(lastChevron).not.toBeNull()

            const lastIsExpanded = (lastChevron!.className.baseVal || lastChevron!.className).includes('rotate-90')
            expect(lastIsExpanded).toBe(true)
          }
        )
      )
    })

    it('should render last phase expanded regardless of isComplete value', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.array(agenticPhaseArbitrary('in_progress'), { minLength: 1, maxLength: 5 }),
            fc.boolean()
          ),
          ([phases, isComplete]) => {
            const { container } = render(
              <WorkflowContainer phases={phases} isComplete={isComplete} />
            )

            // Get all PhaseBox headers (buttons)
            const buttons = container.querySelectorAll('button')
            expect(buttons.length).toBe(phases.length)

            // The last phase should be expanded regardless of isComplete
            const lastButton = buttons[buttons.length - 1]
            const lastChevron = lastButton.querySelector('svg:first-child')
            expect(lastChevron).not.toBeNull()

            const lastIsExpanded = (lastChevron!.className.baseVal || lastChevron!.className).includes('rotate-90')
            expect(lastIsExpanded).toBe(true)
          }
        )
      )
    })

    it('should render phase titles in correct order', () => {
      fc.assert(
        fc.property(
          fc.array(agenticPhaseArbitrary('in_progress'), { minLength: 1, maxLength: 5 }),
          (phases) => {
            const { container } = render(
              <WorkflowContainer phases={phases} isComplete={false} />
            )

            // Get all PhaseBox headers (buttons)
            const buttons = container.querySelectorAll('button')
            expect(buttons.length).toBe(phases.length)

            // Verify each phase title is rendered in order
            buttons.forEach((button, index) => {
              expect(button.textContent).toContain(phases[index].title)
            })
          }
        )
      )
    })

    it('should render container with correct styling', () => {
      fc.assert(
        fc.property(
          fc.array(agenticPhaseArbitrary('in_progress'), { minLength: 1, maxLength: 5 }),
          (phases) => {
            const { container } = render(
              <WorkflowContainer phases={phases} isComplete={false} />
            )

            const workflowContainer = container.querySelector('div:first-child')
            expect(workflowContainer).not.toBeNull()

            // Container should have correct styling
            expect(workflowContainer!.className).toContain('bg-[#2C2C2C]')
            expect(workflowContainer!.className).toContain('rounded-xl')
            expect(workflowContainer!.className).toContain('p-6')
            expect(workflowContainer!.className).toContain('border')
            expect(workflowContainer!.className).toContain('border-white/10')
          }
        )
      )
    })

    it('should maintain last phase expanded state across different phase counts', () => {
      fc.assert(
        fc.property(
          fc.array(agenticPhaseArbitrary('in_progress'), { minLength: 1, maxLength: 5 }),
          (phases) => {
            const { container } = render(
              <WorkflowContainer phases={phases} isComplete={false} />
            )

            // Get all PhaseBox headers (buttons)
            const buttons = container.querySelectorAll('button')

            // Count how many phases are expanded
            let expandedCount = 0
            buttons.forEach((button) => {
              const chevron = button.querySelector('svg:first-child')
              if (chevron) {
                const isExpanded = (chevron.className.baseVal || chevron.className).includes('rotate-90')
                if (isExpanded) {
                  expandedCount++
                }
              }
            })

            // Only the last phase should be expanded
            expect(expandedCount).toBe(1)

            // Verify it's the last one
            const lastButton = buttons[buttons.length - 1]
            const lastChevron = lastButton.querySelector('svg:first-child')
            const lastIsExpanded = (lastChevron!.className.baseVal || lastChevron!.className).includes('rotate-90')
            expect(lastIsExpanded).toBe(true)
          }
        )
      )
    })

    it('should render phases with correct status icons', () => {
      fc.assert(
        fc.property(
          fc.array(agenticPhaseArbitrary('in_progress'), { minLength: 1, maxLength: 5 }),
          (phases) => {
            const { container } = render(
              <WorkflowContainer phases={phases} isComplete={false} />
            )

            // Get all PhaseBox headers (buttons)
            const buttons = container.querySelectorAll('button')
            expect(buttons.length).toBe(phases.length)

            // Each button should have a status icon (last SVG in button)
            buttons.forEach((button) => {
              const svgs = button.querySelectorAll('svg')
              expect(svgs.length).toBeGreaterThanOrEqual(2) // At least chevron and status icon
            })
          }
        )
      )
    })

    it('should render at least 100 test cases with varying phase counts', () => {
      // This test ensures we run at least 100 property-based test cases
      let testCount = 0
      fc.assert(
        fc.property(
          fc.array(agenticPhaseArbitrary('in_progress'), { minLength: 1, maxLength: 5 }),
          (phases) => {
            testCount++
            const { container } = render(
              <WorkflowContainer phases={phases} isComplete={false} />
            )

            const buttons = container.querySelectorAll('button')
            expect(buttons.length).toBe(phases.length)

            // Verify last phase is expanded
            if (phases.length > 0) {
              const lastButton = buttons[buttons.length - 1]
              const lastChevron = lastButton.querySelector('svg:first-child')
              const lastIsExpanded = (lastChevron!.className.baseVal || lastChevron!.className).includes('rotate-90')
              expect(lastIsExpanded).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
      expect(testCount).toBeGreaterThanOrEqual(100)
    })

    it('should handle single phase with content correctly', () => {
      fc.assert(
        fc.property(
          agenticPhaseArbitrary('in_progress').filter((phase) => phase.subSteps.length > 0 || phase.fileOps.length > 0),
          (phase) => {
            const { container } = render(
              <WorkflowContainer phases={[phase]} isComplete={false} />
            )

            // Single phase should be expanded
            const button = container.querySelector('button')
            expect(button).not.toBeNull()

            const chevron = button!.querySelector('svg:first-child')
            const isExpanded = (chevron!.className.baseVal || chevron!.className).includes('rotate-90')
            expect(isExpanded).toBe(true)

            // Content should be visible when expanded
            const contentDiv = container.querySelector('div > div:last-child')
            expect(contentDiv).not.toBeNull()
          }
        )
      )
    })

    it('should render multiple phases with only last one expanded', () => {
      fc.assert(
        fc.property(
          fc.array(agenticPhaseArbitrary('in_progress'), { minLength: 2, maxLength: 5 }),
          (phases) => {
            const { container } = render(
              <WorkflowContainer phases={phases} isComplete={false} />
            )

            const buttons = container.querySelectorAll('button')
            expect(buttons.length).toBe(phases.length)

            // Count expanded phases
            let expandedIndices: number[] = []
            buttons.forEach((button, index) => {
              const chevron = button.querySelector('svg:first-child')
              if (chevron) {
                const isExpanded = (chevron.className.baseVal || chevron.className).includes('rotate-90')
                if (isExpanded) {
                  expandedIndices.push(index)
                }
              }
            })

            // Only one phase should be expanded
            expect(expandedIndices.length).toBe(1)

            // It should be the last phase
            expect(expandedIndices[0]).toBe(phases.length - 1)
          }
        )
      )
    })
  })
})
