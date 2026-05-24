// @ts-nocheck
/**
 * Property-Based Tests for Workflow Validation Utilities
 * 
 * **Validates: Requirements 3.1, 3.3, 3.5, 3.7, 14**
 * 
 * These tests verify correctness properties of workflow validation:
 * - Property 3: Trigger requirement validation
 * - Property 4: App connection validation
 * - Property 5: Connection status validation
 * - Property 6: Cycle detection
 * - Property 14: Validation error handling
 */

import fc from 'fast-check'
import {
  validateTriggerExists,
  validateAppConnections,
  validateConnectionStatus,
  detectCycles,
  validateWorkflowSpec,
  ValidationError,
} from '../lib/workflowValidation'
import { AivoryWorkflowSpec, AivoryWorkflowEdge, WorkflowStep } from '../types/workflows'

/**
 * Arbitraries for generating random workflow objects
 */

const positionArbitrary = (): fc.Arbitrary<{ x: number; y: number }> => {
  return fc.record({
    x: fc.integer({ min: 0, max: 1000 }),
    y: fc.integer({ min: 0, max: 1000 }),
  })
}

const workflowStepArbitrary = (type?: string): fc.Arbitrary<WorkflowStep> => {
  return fc.record({
    id: fc.stringMatching(/^step_\d+$/),
    type: type ? fc.constant(type as any) : fc.constantFrom('trigger', 'action', 'ai', 'filter'),
    appId: fc.stringMatching(/^[a-z]+$/),
    actionId: fc.stringMatching(/^[a-z_]+$/),
    connectionId: fc.stringMatching(/^conn_\d+$/),
    inputs: fc.dictionary(fc.string(), fc.string()),
    position: positionArbitrary(),
  })
}

const workflowSpecArbitrary = (steps?: WorkflowStep[]): fc.Arbitrary<AivoryWorkflowSpec> => {
  return fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 500 }),
    source: fc.constantFrom('console', 'workflow-tab', 'copilot'),
    intent: fc.string({ minLength: 1, maxLength: 500 }),
    steps: steps ? fc.constant(steps) : fc.array(workflowStepArbitrary(), { minLength: 0, maxLength: 10 }),
  })
}

const workflowEdgeArbitrary = (): fc.Arbitrary<AivoryWorkflowEdge> => {
  return fc.record({
    from: fc.stringMatching(/^step_\d+$/),
    to: fc.stringMatching(/^step_\d+$/),
    label: fc.option(fc.string(), { freq: 2 }),
  })
}

describe('Workflow Validation - Property-Based Tests', () => {
  describe('Property 3: Trigger Requirement Validation', () => {
    it('should always pass when workflow has at least one trigger step', () => {
      fc.assert(
        fc.property(
          fc.array(workflowStepArbitrary('action'), { minLength: 0, maxLength: 5 }),
          (otherSteps) => {
            const triggerStep = {
              id: 'step_trigger',
              type: 'trigger' as const,
              appId: 'webhook',
              actionId: 'receive',
              connectionId: 'conn_1',
              inputs: {},
              position: { x: 400, y: 300 },
            }

            const spec: AivoryWorkflowSpec = {
              name: 'Test',
              description: 'Test',
              source: 'console',
              intent: 'Test',
              steps: [triggerStep, ...otherSteps],
            }

            const error = validateTriggerExists(spec)
            expect(error).toBeNull()
          }
        )
      )
    })

    it('should always fail when workflow has no trigger step', () => {
      fc.assert(
        fc.property(
          fc.array(workflowStepArbitrary('action'), { minLength: 1, maxLength: 10 }),
          (steps) => {
            const spec: AivoryWorkflowSpec = {
              name: 'Test',
              description: 'Test',
              source: 'console',
              intent: 'Test',
              steps,
            }

            const error = validateTriggerExists(spec)
            expect(error).not.toBeNull()
            expect(error?.field).toBe('steps')
            expect(error?.reason).toContain('trigger')
          }
        )
      )
    })

    it('should return error with correct structure', () => {
      fc.assert(
        fc.property(workflowSpecArbitrary([]), (spec) => {
          const error = validateTriggerExists(spec)
          if (error) {
            expect(error).toHaveProperty('field')
            expect(error).toHaveProperty('reason')
            expect(typeof error.field).toBe('string')
            expect(typeof error.reason).toBe('string')
            expect(error.field.length).toBeGreaterThan(0)
            expect(error.reason.length).toBeGreaterThan(0)
          }
        })
      )
    })
  })

  describe('Property 4: App Connection Validation', () => {
    it('should always pass when all appIds are in availableAppIds', () => {
      fc.assert(
        fc.property(
          fc.array(fc.stringMatching(/^[a-z]+$/), { minLength: 1, maxLength: 5 }),
          (appIds) => {
            const steps = appIds.map((appId, i) => ({
              id: `step_${i}`,
              type: (i === 0 ? 'trigger' : 'action') as const,
              appId,
              actionId: 'test',
              connectionId: `conn_${i}`,
              inputs: {},
              position: { x: 400, y: 300 + i * 180 },
            }))

            const spec: AivoryWorkflowSpec = {
              name: 'Test',
              description: 'Test',
              source: 'console',
              intent: 'Test',
              steps,
            }

            const error = validateAppConnections(spec, appIds)
            expect(error).toBeNull()
          }
        )
      )
    })

    it('should always fail when an appId is not in availableAppIds', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.stringMatching(/^[a-z]+$/),
            fc.array(fc.stringMatching(/^[a-z]+$/), { minLength: 0, maxLength: 3 })
          ),
          ([missingAppId, otherAppIds]) => {
            // Ensure missingAppId is not in otherAppIds
            const availableAppIds = otherAppIds.filter((id) => id !== missingAppId)

            const steps: WorkflowStep[] = [
              {
                id: 'step_1',
                type: 'trigger',
                appId: missingAppId,
                actionId: 'test',
                connectionId: 'conn_1',
                inputs: {},
                position: { x: 400, y: 300 },
              },
            ]

            const spec: AivoryWorkflowSpec = {
              name: 'Test',
              description: 'Test',
              source: 'console',
              intent: 'Test',
              steps,
            }

            const error = validateAppConnections(spec, availableAppIds)
            expect(error).not.toBeNull()
            expect(error?.field).toBe('appId')
            expect(error?.reason).toContain(missingAppId)
          }
        )
      )
    })

    it('should return error with correct structure', () => {
      fc.assert(
        fc.property(
          fc.array(workflowStepArbitrary(), { minLength: 1, maxLength: 5 }),
          (steps) => {
            const spec: AivoryWorkflowSpec = {
              name: 'Test',
              description: 'Test',
              source: 'console',
              intent: 'Test',
              steps,
            }

            const error = validateAppConnections(spec, [])
            if (error) {
              expect(error).toHaveProperty('field')
              expect(error).toHaveProperty('reason')
              expect(typeof error.field).toBe('string')
              expect(typeof error.reason).toBe('string')
            }
          }
        )
      )
    })
  })

  describe('Property 5: Connection Status Validation', () => {
    it('should always pass when all connectionIds are active', () => {
      fc.assert(
        fc.property(
          fc.array(workflowStepArbitrary(), { minLength: 1, maxLength: 5 }),
          (steps) => {
            const spec: AivoryWorkflowSpec = {
              name: 'Test',
              description: 'Test',
              source: 'console',
              intent: 'Test',
              steps,
            }

            const connectionStatus: Record<string, boolean> = {}
            steps.forEach((step) => {
              connectionStatus[step.connectionId] = true
            })

            const error = validateConnectionStatus(spec, connectionStatus)
            expect(error).toBeNull()
          }
        )
      )
    })

    it('should always fail when a connectionId is inactive', () => {
      fc.assert(
        fc.property(
          fc.array(workflowStepArbitrary(), { minLength: 1, maxLength: 5 }),
          (steps) => {
            const spec: AivoryWorkflowSpec = {
              name: 'Test',
              description: 'Test',
              source: 'console',
              intent: 'Test',
              steps,
            }

            const connectionStatus: Record<string, boolean> = {}
            steps.forEach((step, i) => {
              connectionStatus[step.connectionId] = i > 0 // First connection is inactive
            })

            const error = validateConnectionStatus(spec, connectionStatus)
            expect(error).not.toBeNull()
            expect(error?.field).toBe('connectionId')
          }
        )
      )
    })

    it('should return error with correct structure', () => {
      fc.assert(
        fc.property(
          fc.array(workflowStepArbitrary(), { minLength: 1, maxLength: 5 }),
          (steps) => {
            const spec: AivoryWorkflowSpec = {
              name: 'Test',
              description: 'Test',
              source: 'console',
              intent: 'Test',
              steps,
            }

            const error = validateConnectionStatus(spec, {})
            if (error) {
              expect(error).toHaveProperty('field')
              expect(error).toHaveProperty('reason')
              expect(typeof error.field).toBe('string')
              expect(typeof error.reason).toBe('string')
            }
          }
        )
      )
    })
  })

  describe('Property 6: Cycle Detection', () => {
    it('should always pass for acyclic graphs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }).chain((n) =>
            fc.tuple(
              fc.constant(n),
              fc.shuffledSubarray(
                Array.from({ length: Math.max(0, n - 1) }, (_, i) => ({
                  from: `step_${i}`,
                  to: `step_${i + 1}`,
                }))
              )
            )
          ),
          ([n, edges]) => {
            const stepIds = Array.from({ length: n }, (_, i) => `step_${i}`)
            const error = detectCycles(edges, stepIds)
            expect(error).toBeNull()
          }
        )
      )
    })

    it('should always fail for cyclic graphs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          (n) => {
            // Create a guaranteed cycle: step_0 -> step_1 -> ... -> step_n-1 -> step_0
            const edges: AivoryWorkflowEdge[] = Array.from({ length: n }, (_, i) => ({
              from: `step_${i}`,
              to: `step_${(i + 1) % n}`,
            }))

            const stepIds = Array.from({ length: n }, (_, i) => `step_${i}`)
            const error = detectCycles(edges, stepIds)
            expect(error).not.toBeNull()
            expect(error?.field).toBe('edges')
            expect(error?.reason).toContain('cycle')
          }
        )
      )
    })

    it('should return error with correct structure', () => {
      fc.assert(
        fc.property(
          fc.array(workflowEdgeArbitrary(), { maxLength: 10 }),
          fc.array(fc.stringMatching(/^step_\d+$/), { minLength: 1, maxLength: 10 }),
          (edges, stepIds) => {
            const error = detectCycles(edges, stepIds)
            if (error) {
              expect(error).toHaveProperty('field')
              expect(error).toHaveProperty('reason')
              expect(typeof error.field).toBe('string')
              expect(typeof error.reason).toBe('string')
            }
          }
        )
      )
    })

    it('should handle empty edge list', () => {
      fc.assert(
        fc.property(
          fc.array(fc.stringMatching(/^step_\d+$/), { minLength: 1, maxLength: 10 }),
          (stepIds) => {
            const error = detectCycles([], stepIds)
            expect(error).toBeNull()
          }
        )
      )
    })

    it('should handle disconnected nodes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          (n) => {
            // Create a linear chain without cycles
            const edges: AivoryWorkflowEdge[] = Array.from({ length: n - 1 }, (_, i) => ({
              from: `step_${i}`,
              to: `step_${i + 1}`,
            }))

            const stepIds = Array.from({ length: n }, (_, i) => `step_${i}`)
            const error = detectCycles(edges, stepIds)
            expect(error).toBeNull()
          }
        )
      )
    })
  })

  describe('Property 14: Validation Error Handling', () => {
    it('should always return null or ValidationError object', () => {
      fc.assert(
        fc.property(workflowSpecArbitrary(), (spec) => {
          const error = validateTriggerExists(spec)
          expect(error === null || typeof error === 'object').toBe(true)
        })
      )
    })

    it('should have consistent error structure', () => {
      fc.assert(
        fc.property(
          fc.array(workflowStepArbitrary('action'), { minLength: 1, maxLength: 5 }),
          (steps) => {
            const spec: AivoryWorkflowSpec = {
              name: 'Test',
              description: 'Test',
              source: 'console',
              intent: 'Test',
              steps,
            }

            const error = validateTriggerExists(spec)
            if (error !== null) {
              expect(error).toHaveProperty('field')
              expect(error).toHaveProperty('reason')
              expect(typeof error.field).toBe('string')
              expect(typeof error.reason).toBe('string')
              expect(error.field.length).toBeGreaterThan(0)
              expect(error.reason.length).toBeGreaterThan(0)
            }
          }
        )
      )
    })

    it('should return first error in validation order', () => {
      fc.assert(
        fc.property(
          fc.array(workflowStepArbitrary('action'), { minLength: 1, maxLength: 5 }),
          (steps) => {
            const spec: AivoryWorkflowSpec = {
              name: 'Test',
              description: 'Test',
              source: 'console',
              intent: 'Test',
              steps,
            }

            const availableAppIds: string[] = []
            const connectionStatus: Record<string, boolean> = {}
            const edges: AivoryWorkflowEdge[] = []

            const error = validateWorkflowSpec(spec, availableAppIds, connectionStatus, edges)
            // Should fail on trigger first (before app or connection)
            if (error) {
              expect(error.reason).toContain('trigger')
            }
          }
        )
      )
    })

    it('should provide actionable error messages', () => {
      fc.assert(
        fc.property(
          fc.array(workflowStepArbitrary('action'), { minLength: 1, maxLength: 5 }),
          (steps) => {
            const spec: AivoryWorkflowSpec = {
              name: 'Test',
              description: 'Test',
              source: 'console',
              intent: 'Test',
              steps,
            }

            const error = validateTriggerExists(spec)
            if (error) {
              // Error message should be descriptive
              expect(error.reason.length).toBeGreaterThan(10)
              expect(error.reason.toLowerCase()).toContain('trigger')
            }
          }
        )
      )
    })
  })
})
