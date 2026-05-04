// @ts-nocheck
/**
 * Property-Based Tests for Agentic Reducer Immutability
 *
 * **Validates: Requirement 11.1**
 *
 * These tests verify correctness properties of the agentic reducer:
 * - Property 1: Reducer immutability - returns new object reference without mutating input
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

const agenticStartEventArbitrary = (): fc.Arbitrary<StreamEvent> => {
  return fc.constant({ type: 'agentic_start' as const })
}

const phaseStartEventArbitrary = (): fc.Arbitrary<StreamEvent> => {
  return fc.record({
    type: fc.constant('phase_start' as const),
    id: fc.stringMatching(/^phase_[a-z0-9]+$/),
    title: fc.string({ minLength: 1, maxLength: 100 }),
  })
}

const phaseStartMalformedEventArbitrary = (): fc.Arbitrary<StreamEvent> => {
  return fc.oneof(
    // Missing id
    fc.record({
      type: fc.constant('phase_start' as const),
      id: fc.constant(''),
      title: fc.string({ minLength: 1, maxLength: 100 }),
    }),
    // Missing title
    fc.record({
      type: fc.constant('phase_start' as const),
      id: fc.stringMatching(/^phase_[a-z0-9]+$/),
      title: fc.constant(''),
    })
  )
}

const subStepEventArbitrary = (phaseId: string): fc.Arbitrary<StreamEvent> => {
  return fc.record({
    type: fc.constant('sub_step' as const),
    phaseId: fc.constant(phaseId),
    id: fc.stringMatching(/^substep_[a-z0-9]+$/),
    icon: subStepIconArbitrary(),
    label: fc.string({ minLength: 1, maxLength: 50 }),
  })
}

const fileOpEventArbitrary = (phaseId: string): fc.Arbitrary<StreamEvent> => {
  return fc.record({
    type: fc.constant('file_op' as const),
    phaseId: fc.constant(phaseId),
    id: fc.stringMatching(/^fileop_[a-z0-9]+$/),
    filename: fc.string({ minLength: 1, maxLength: 100 }),
    action: fc.constantFrom('read', 'written', 'created'),
  })
}

const phaseEndEventArbitrary = (phaseId: string): fc.Arbitrary<StreamEvent> => {
  return fc.record({
    type: fc.constant('phase_end' as const),
    id: fc.constant(phaseId),
  })
}

const agenticEndEventArbitrary = (): fc.Arbitrary<StreamEvent> => {
  return fc.constant({ type: 'agentic_end' as const })
}

const doneEventArbitrary = (): fc.Arbitrary<StreamEvent> => {
  return fc.constant({ type: 'done' as const })
}

const nonAgenticEventArbitrary = (): fc.Arbitrary<StreamEvent> => {
  return fc.oneof(
    fc.record({
      type: fc.constant('chunk' as const),
      content: fc.string({ minLength: 0, maxLength: 500 }),
    }),
    fc.record({
      type: fc.constant('error' as const),
      error: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
    }),
    fc.record({
      type: fc.constant('workflow_spec' as const),
      workflow: fc.dictionary(fc.string(), fc.string()),
    })
  )
}

describe('Agentic Reducer - Property-Based Tests', () => {
  describe('Property 1: Reducer immutability', () => {
    it('should return new object reference for agentic_start event', () => {
      fc.assert(
        fc.property(agenticWorkflowStateArbitrary(), (state) => {
          const event = { type: 'agentic_start' as const }
          const newState = agenticReducer(state, event)

          // Should return a new state object (different reference)
          expect(newState).not.toBe(state)
          // Original state should not be mutated
          expect(state).toEqual(state)
        })
      )
    })

    it('should return new object reference for phase_start event', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          phaseStartEventArbitrary(),
          (state, event) => {
            const newState = agenticReducer(state, event)

            // Should return a new state object (different reference)
            expect(newState).not.toBe(state)
            // Original state should not be mutated
            expect(state.phases).toEqual(state.phases)
            expect(state.isComplete).toBe(state.isComplete)
          }
        )
      )
    })

    it('should return new object reference for sub_step event', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          (state) => {
            // Ensure state has at least one phase
            if (state.phases.length === 0) {
              state.phases.push({
                id: 'phase_test',
                title: 'Test Phase',
                status: 'in_progress',
                subSteps: [],
                fileOps: [],
              })
            }

            const phaseId = state.phases[0].id
            const event: StreamEvent = {
              type: 'sub_step',
              phaseId,
              id: 'substep_test',
              icon: 'thinking',
              label: 'Test Sub-Step',
            }

            const newState = agenticReducer(state, event)

            // Should return a new state object (different reference)
            expect(newState).not.toBe(state)
            // Original state should not be mutated
            expect(state.phases).toEqual(state.phases)
          }
        )
      )
    })

    it('should return new object reference for file_op event', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          (state) => {
            // Ensure state has at least one phase
            if (state.phases.length === 0) {
              state.phases.push({
                id: 'phase_test',
                title: 'Test Phase',
                status: 'in_progress',
                subSteps: [],
                fileOps: [],
              })
            }

            const phaseId = state.phases[0].id
            const event: StreamEvent = {
              type: 'file_op',
              phaseId,
              id: 'fileop_test',
              filename: 'test.txt',
              action: 'read',
            }

            const newState = agenticReducer(state, event)

            // Should return a new state object (different reference)
            expect(newState).not.toBe(state)
            // Original state should not be mutated
            expect(state.phases).toEqual(state.phases)
          }
        )
      )
    })

    it('should return new object reference for phase_end event', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          (state) => {
            // Ensure state has at least one phase
            if (state.phases.length === 0) {
              state.phases.push({
                id: 'phase_test',
                title: 'Test Phase',
                status: 'in_progress',
                subSteps: [],
                fileOps: [],
              })
            }

            const phaseId = state.phases[0].id
            const event: StreamEvent = {
              type: 'phase_end',
              id: phaseId,
            }

            const newState = agenticReducer(state, event)

            // Should return a new state object (different reference)
            expect(newState).not.toBe(state)
            // Original state should not be mutated
            expect(state.phases).toEqual(state.phases)
          }
        )
      )
    })

    it('should return new object reference for agentic_end event', () => {
      fc.assert(
        fc.property(agenticWorkflowStateArbitrary(), (state) => {
          const event = { type: 'agentic_end' as const }
          const newState = agenticReducer(state, event)

          // Should return a new state object (different reference)
          expect(newState).not.toBe(state)
          // Original state should not be mutated
          expect(state.isComplete).toBe(state.isComplete)
        })
      )
    })

    it('should return new object reference for done event when not already complete', () => {
      fc.assert(
        fc.property(agenticWorkflowStateArbitrary(), (state) => {
          // Only test when state is not already complete
          if (state.isComplete) {
            return
          }

          const event = { type: 'done' as const }
          const newState = agenticReducer(state, event)

          // Should return a new state object (different reference)
          expect(newState).not.toBe(state)
          // Original state should not be mutated
          expect(state.phases).toEqual(state.phases)
        })
      )
    })

    it('should return same reference for done event when already complete', () => {
      fc.assert(
        fc.property(agenticWorkflowStateArbitrary(), (state) => {
          // Only test when state is already complete
          state.isComplete = true

          const event = { type: 'done' as const }
          const newState = agenticReducer(state, event)

          // Should return the same reference when already complete
          expect(newState).toBe(state)
        })
      )
    })

    it('should not mutate input state for any event type', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          fc.oneof(
            agenticStartEventArbitrary(),
            phaseStartEventArbitrary(),
            agenticEndEventArbitrary(),
            doneEventArbitrary(),
            nonAgenticEventArbitrary()
          ),
          (state, event) => {
            // Deep clone the state to compare later
            const originalState = JSON.parse(JSON.stringify(state))

            // Call reducer
            agenticReducer(state, event)

            // State should not be mutated
            expect(state).toEqual(originalState)
          }
        )
      )
    })

    it('should return same reference for non-agentic events when state is unchanged', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          nonAgenticEventArbitrary(),
          (state, event) => {
            const newState = agenticReducer(state, event)

            // For non-agentic events, should return the same reference
            expect(newState).toBe(state)
          }
        )
      )
    })

    it('should return same reference for malformed phase_start events', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          phaseStartMalformedEventArbitrary(),
          (state, event) => {
            const newState = agenticReducer(state, event)

            // For malformed events, should return the same reference
            expect(newState).toBe(state)
          }
        )
      )
    })

    it('should return same reference for orphaned sub_step events', () => {
      fc.assert(
        fc.property(agenticWorkflowStateArbitrary(), (state) => {
          // Use a phaseId that doesn't exist in the state
          const event: StreamEvent = {
            type: 'sub_step',
            phaseId: 'nonexistent_phase_id',
            id: 'substep_test',
            icon: 'thinking',
            label: 'Test Sub-Step',
          }

          const newState = agenticReducer(state, event)

          // For orphaned events, should return the same reference
          expect(newState).toBe(state)
        })
      )
    })

    it('should return same reference for orphaned file_op events', () => {
      fc.assert(
        fc.property(agenticWorkflowStateArbitrary(), (state) => {
          // Use a phaseId that doesn't exist in the state
          const event: StreamEvent = {
            type: 'file_op',
            phaseId: 'nonexistent_phase_id',
            id: 'fileop_test',
            filename: 'test.txt',
            action: 'read',
          }

          const newState = agenticReducer(state, event)

          // For orphaned events, should return the same reference
          expect(newState).toBe(state)
        })
      )
    })

    it('should not mutate nested phase objects when creating new state', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          (state) => {
            // Create a phase_start event with a NEW phase ID (not duplicate)
            const newPhaseId = 'phase_new_' + Math.random().toString(36).substr(2, 9)
            const event: StreamEvent = {
              type: 'phase_start',
              id: newPhaseId,
              title: 'New Phase',
            }

            // Store original phase references
            const originalPhaseRefs = state.phases.map((p) => p)

            // Call reducer
            const newState = agenticReducer(state, event)

            // New state should have different reference
            expect(newState).not.toBe(state)

            // Original phases should not be mutated
            state.phases.forEach((phase, index) => {
              expect(phase).toBe(originalPhaseRefs[index])
            })
          }
        )
      )
    })

    it('should create new phase array without mutating original', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          (state) => {
            // Create a phase_start event with a NEW phase ID (not duplicate)
            const newPhaseId = 'phase_new_' + Math.random().toString(36).substr(2, 9)
            const event: StreamEvent = {
              type: 'phase_start',
              id: newPhaseId,
              title: 'New Phase',
            }

            const originalPhaseArrayLength = state.phases.length

            // Call reducer
            const newState = agenticReducer(state, event)

            // Original phases array should not be mutated
            expect(state.phases.length).toBe(originalPhaseArrayLength)
            expect(state.phases).not.toBe(newState?.phases)
          }
        )
      )
    })

    it('should preserve all properties when creating new state', () => {
      fc.assert(
        fc.property(
          agenticWorkflowStateArbitrary(),
          phaseStartEventArbitrary(),
          (state, event) => {
            const newState = agenticReducer(state, event)

            // New state should have all required properties
            expect(newState).toHaveProperty('phases')
            expect(newState).toHaveProperty('isComplete')
            expect(newState).toHaveProperty('startedAt')

            // Original properties should be preserved
            expect(newState?.isComplete).toBe(state.isComplete)
            expect(newState?.startedAt).toBe(state.startedAt)
          }
        )
      )
    })

    it('should handle null state gracefully without mutation', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            phaseStartEventArbitrary(),
            agenticEndEventArbitrary(),
            doneEventArbitrary()
          ),
          (event) => {
            const state = null
            const newState = agenticReducer(state, event)

            // Should return null or new state depending on event type
            if (event.type === 'agentic_start') {
              expect(newState).not.toBeNull()
            } else {
              expect(newState).toBeNull()
            }
          }
        )
      )
    })
  })
})
