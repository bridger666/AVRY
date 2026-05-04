// @ts-nocheck
/**
 * Property-Based Tests for Agentic Reducer Malformed Event Handling
 *
 * **Validates: Requirements 11.2, 11.3**
 *
 * These tests verify correctness properties of the agentic reducer:
 * - Property 2: Malformed events are skipped - verify malformed events (missing id/title, invalid phaseId) return state unchanged
 */

import fc from 'fast-check'
import { agenticReducer } from '@/lib/agenticReducer'
import type {
  AgenticWorkflowState,
  StreamEvent,
  SubStepIcon,
} from '@/types/agenticWorkflow'

/**
 * Arbitraries for generating random agentic workflow objects
 */

const subStepIconArbitrary = (): fc.Arbitrary<SubStepIcon> => {
  return fc.constantFrom<SubStepIcon>(
    'thinking',
    'editing',
    'searching',
    'generating',
    'terminal',
    'file'
  )
}

const agenticPhaseArbitrary = (): fc.Arbitrary<any> => {
  return fc.record({
    id: fc.stringMatching(/^phase_[a-z0-9]+$/),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    status: fc.constantFrom('in_progress', 'completed'),
    subSteps: fc.array(
      fc.record({
        id: fc.stringMatching(/^substep_[a-z0-9]+$/),
        phaseId: fc.stringMatching(/^phase_[a-z0-9]+$/),
        icon: subStepIconArbitrary(),
        label: fc.string({ minLength: 1, maxLength: 50 }),
        duration: fc.option(fc.integer({ min: 0, max: 10000 })),
      }),
      { maxLength: 5 }
    ),
    fileOps: fc.array(
      fc.record({
        id: fc.stringMatching(/^fileop_[a-z0-9]+$/),
        phaseId: fc.stringMatching(/^phase_[a-z0-9]+$/),
        filename: fc.string({ minLength: 1, maxLength: 100 }),
        action: fc.constantFrom('read', 'written', 'created'),
      }),
      { maxLength: 5 }
    ),
  })
}

const agenticWorkflowStateArbitrary = (): fc.Arbitrary<AgenticWorkflowState> => {
  return fc.record({
    phases: fc.array(agenticPhaseArbitrary(), { maxLength: 10 }),
    isComplete: fc.boolean(),
    startedAt: fc.integer({ min: 0, max: Date.now() }),
  })
}

/**
 * Malformed phase_start events - missing id or title
 */
const malformedPhaseStartMissingIdArbitrary = (): fc.Arbitrary<StreamEvent> => {
  return fc.record({
    type: fc.constant('phase_start' as const),
    id: fc.constant(''), // Empty id
    title: fc.string({ minLength: 1, maxLength: 100 }),
  })
}

const malformedPhaseStartMissingTitleArbitrary = (): fc.Arbitrary<StreamEvent> => {
  return fc.record({
    type: fc.constant('phase_start' as const),
    id: fc.stringMatching(/^phase_[a-z0-9]+$/),
    title: fc.constant(''), // Empty title
  })
}

const malformedPhaseStartMissingBothArbitrary = (): fc.Arbitrary<StreamEvent> => {
  return fc.record({
    type: fc.constant('phase_start' as const),
    id: fc.constant(''),
    title: fc.constant(''),
  })
}

/**
 * Orphaned sub_step events - referencing non-existent phaseId
 */
const orphanedSubStepEventArbitrary = (): fc.Arbitrary<StreamEvent> => {
  return fc.record({
    type: fc.constant('sub_step' as const),
    phaseId: fc.stringMatching(/^nonexistent_phase_[a-z0-9]+$/), // Non-existent phase
    id: fc.stringMatching(/^substep_[a-z0-9]+$/),
    icon: subStepIconArbitrary(),
    label: fc.string({ minLength: 1, maxLength: 50 }),
  })
}

/**
 * Orphaned file_op events - referencing non-existent phaseId
 */
const orphanedFileOpEventArbitrary = (): fc.Arbitrary<StreamEvent> => {
  return fc.record({
    type: fc.constant('file_op' as const),
    phaseId: fc.stringMatching(/^nonexistent_phase_[a-z0-9]+$/), // Non-existent phase
    id: fc.stringMatching(/^fileop_[a-z0-9]+$/),
    filename: fc.string({ minLength: 1, maxLength: 100 }),
    action: fc.constantFrom('read', 'written', 'created'),
  })
}

/**
 * Valid phase_start event for comparison
 */
const validPhaseStartEventArbitrary = (): fc.Arbitrary<StreamEvent> => {
  return fc.record({
    type: fc.constant('phase_start' as const),
    id: fc.stringMatching(/^phase_[a-z0-9]+$/),
    title: fc.string({ minLength: 1, maxLength: 100 }),
  })
}

describe('Agentic Reducer - Malformed Event Handling (Property 2)', () => {
  describe('Property 2: Malformed events are skipped', () => {
    it('should return state unchanged for phase_start missing id', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          malformedPhaseStartMissingIdArbitrary(),
          (state, event) => {
            const newState = agenticReducer(state, event)

            // State should be returned unchanged (same reference)
            expect(newState).toBe(state)
            // State content should be identical
            expect(newState).toEqual(state)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return state unchanged for phase_start missing title', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          malformedPhaseStartMissingTitleArbitrary(),
          (state, event) => {
            const newState = agenticReducer(state, event)

            // State should be returned unchanged (same reference)
            expect(newState).toBe(state)
            // State content should be identical
            expect(newState).toEqual(state)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return state unchanged for phase_start missing both id and title', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          malformedPhaseStartMissingBothArbitrary(),
          (state, event) => {
            const newState = agenticReducer(state, event)

            // State should be returned unchanged (same reference)
            expect(newState).toBe(state)
            // State content should be identical
            expect(newState).toEqual(state)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return state unchanged for orphaned sub_step events', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          orphanedSubStepEventArbitrary(),
          (state, event) => {
            const newState = agenticReducer(state, event)

            // State should be returned unchanged (same reference)
            expect(newState).toBe(state)
            // State content should be identical
            expect(newState).toEqual(state)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return state unchanged for orphaned file_op events', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          orphanedFileOpEventArbitrary(),
          (state, event) => {
            const newState = agenticReducer(state, event)

            // State should be returned unchanged (same reference)
            expect(newState).toBe(state)
            // State content should be identical
            expect(newState).toEqual(state)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not crash on malformed events', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          fc.oneof(
            malformedPhaseStartMissingIdArbitrary(),
            malformedPhaseStartMissingTitleArbitrary(),
            malformedPhaseStartMissingBothArbitrary(),
            orphanedSubStepEventArbitrary(),
            orphanedFileOpEventArbitrary()
          ),
          (state, event) => {
            // Should not throw
            expect(() => {
              agenticReducer(state, event)
            }).not.toThrow()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should process valid events after malformed events', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          malformedPhaseStartMissingIdArbitrary(),
          (state, malformedEvent) => {
            // Create a valid event with a unique ID that won't conflict
            const validEvent: StreamEvent = {
              type: 'phase_start',
              id: 'phase_unique_' + Math.random().toString(36).substr(2, 9),
              title: 'Valid Phase',
            }

            // Process malformed event
            const stateAfterMalformed = agenticReducer(state, malformedEvent)
            expect(stateAfterMalformed).toBe(state)

            // Process valid event after malformed
            const stateAfterValid = agenticReducer(stateAfterMalformed, validEvent)

            // Valid event should be processed normally
            expect(stateAfterValid).not.toBe(state)
            expect(stateAfterValid?.phases.length).toBe(state.phases.length + 1)
            expect(stateAfterValid?.phases[stateAfterValid.phases.length - 1].id).toBe(
              validEvent.id
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve phase count when skipping malformed sub_step', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          orphanedSubStepEventArbitrary(),
          (state, event) => {
            const originalPhaseCount = state.phases.length
            const newState = agenticReducer(state, event)

            // Phase count should not change
            expect(newState?.phases.length).toBe(originalPhaseCount)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve phase count when skipping malformed file_op', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          orphanedFileOpEventArbitrary(),
          (state, event) => {
            const originalPhaseCount = state.phases.length
            const newState = agenticReducer(state, event)

            // Phase count should not change
            expect(newState?.phases.length).toBe(originalPhaseCount)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not add phases when skipping malformed phase_start', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          fc.oneof(
            malformedPhaseStartMissingIdArbitrary(),
            malformedPhaseStartMissingTitleArbitrary(),
            malformedPhaseStartMissingBothArbitrary()
          ),
          (state, event) => {
            const originalPhaseCount = state.phases.length
            const newState = agenticReducer(state, event)

            // Phase count should not change
            expect(newState?.phases.length).toBe(originalPhaseCount)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle multiple consecutive malformed events', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          fc.array(
            fc.oneof(
              malformedPhaseStartMissingIdArbitrary(),
              malformedPhaseStartMissingTitleArbitrary(),
              orphanedSubStepEventArbitrary(),
              orphanedFileOpEventArbitrary()
            ),
            { minLength: 2, maxLength: 10 }
          ),
          (state, events) => {
            const originalPhaseCount = state.phases.length
            let currentState = state

            // Process all malformed events
            for (const event of events) {
              currentState = agenticReducer(currentState, event)
            }

            // State should be unchanged after all malformed events
            expect(currentState).toBe(state)
            expect(currentState?.phases.length).toBe(originalPhaseCount)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not mutate state when skipping malformed events', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          fc.oneof(
            malformedPhaseStartMissingIdArbitrary(),
            malformedPhaseStartMissingTitleArbitrary(),
            orphanedSubStepEventArbitrary(),
            orphanedFileOpEventArbitrary()
          ),
          (state, event) => {
            // Deep clone the state to compare later
            const originalState = JSON.parse(JSON.stringify(state))

            // Call reducer with malformed event
            agenticReducer(state, event)

            // State should not be mutated
            expect(state).toEqual(originalState)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle null state gracefully with malformed events', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            malformedPhaseStartMissingIdArbitrary(),
            malformedPhaseStartMissingTitleArbitrary(),
            orphanedSubStepEventArbitrary(),
            orphanedFileOpEventArbitrary()
          ),
          (event) => {
            const state = null
            const newState = agenticReducer(state, event)

            // Should return null for malformed events on null state
            expect(newState).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should skip malformed phase_start with duplicate id', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          (state) => {
            // Ensure state has at least one phase
            if (state.phases.length === 0) {
              state.phases.push({
                id: 'phase_existing',
                title: 'Existing Phase',
                status: 'in_progress',
                subSteps: [],
                fileOps: [],
              })
            }

            const existingPhaseId = state.phases[0].id
            const duplicateEvent: StreamEvent = {
              type: 'phase_start',
              id: existingPhaseId, // Duplicate ID
              title: 'New Phase',
            }

            const newState = agenticReducer(state, duplicateEvent)

            // Should skip duplicate and return same reference
            expect(newState).toBe(state)
            expect(newState?.phases.length).toBe(state.phases.length)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
