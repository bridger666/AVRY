// @ts-nocheck
/**
 * Property-Based Tests for Workflow Serialization
 * 
 * **Validates: Requirement 1.7 - Round-trip serialization property**
 * 
 * Property: FOR ALL valid AivoryWorkflowSpec objects, serializing then deserializing
 * SHALL produce an equivalent object (round-trip property)
 */

import fc from 'fast-check'
import {
  parseWorkflowSpec,
  serializeWorkflowSpec,
  validateRoundTrip
} from '@/lib/workflowSerializer'
import { AivoryWorkflowSpec, WorkflowStep, WorkflowStepType } from '@/types/workflows'

/**
 * Arbitrary generator for WorkflowStepType
 */
const stepTypeArbitrary = fc.oneof(
  fc.constant('trigger' as WorkflowStepType),
  fc.constant('action' as WorkflowStepType),
  fc.constant('ai' as WorkflowStepType),
  fc.constant('filter' as WorkflowStepType)
)

/**
 * Arbitrary generator for position coordinates
 */
const positionArbitrary = fc.record({
  x: fc.integer({ min: 0, max: 1000 }),
  y: fc.integer({ min: 0, max: 1000 })
})

/**
 * Arbitrary generator for step inputs (simple key-value pairs)
 */
const inputsArbitrary = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 20 }),
  fc.oneof(
    fc.string({ maxLength: 50 }),
    fc.integer(),
    fc.boolean(),
    fc.constant(null)
  )
)

/**
 * Arbitrary generator for WorkflowStep
 */
const workflowStepArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  type: stepTypeArbitrary,
  appId: fc.string({ minLength: 1, maxLength: 20 }),
  actionId: fc.string({ minLength: 1, maxLength: 30 }),
  connectionId: fc.string({ minLength: 1, maxLength: 20 }),
  inputs: inputsArbitrary,
  position: positionArbitrary
})

/**
 * Arbitrary generator for AivoryWorkflowSpec
 * 
 * Generates valid specs with:
 * - 1-5 steps (to keep tests fast)
 * - At least one trigger step (required by validation)
 * - Valid string fields
 */
const workflowSpecArbitrary = fc
  .tuple(
    fc.array(workflowStepArbitrary, { minLength: 0, maxLength: 4 }),
    fc.string({ minLength: 1, maxLength: 50 }),
    fc.string({ minLength: 1, maxLength: 100 }),
    fc.string({ minLength: 1, maxLength: 50 }),
    fc.string({ minLength: 1, maxLength: 100 })
  )
  .map(([steps, name, description, source, intent]) => {
    // Ensure at least one trigger step
    if (steps.length === 0 || !steps.some(s => s.type === 'trigger')) {
      steps = [
        {
          id: 'step_trigger',
          type: 'trigger' as WorkflowStepType,
          appId: 'trigger_app',
          actionId: 'trigger_action',
          connectionId: 'trigger_conn',
          inputs: {},
          position: { x: 400, y: 300 }
        },
        ...steps
      ]
    }

    return {
      name,
      description,
      source,
      intent,
      steps
    } as AivoryWorkflowSpec
  })

describe('Workflow Serialization Round-Trip Property', () => {
  describe('Property 2: Round-trip serialization', () => {
    it('should satisfy round-trip property: deserialize(serialize(spec)) === spec', () => {
      fc.assert(
        fc.property(workflowSpecArbitrary, (spec: AivoryWorkflowSpec) => {
          // Serialize
          const serialized = serializeWorkflowSpec(spec)

          // Deserialize
          const parseResult = parseWorkflowSpec(serialized)

          // Should parse successfully
          if (parseResult.error) {
            throw new Error(`Failed to parse serialized spec: ${parseResult.error.message}`)
          }

          const deserialized = parseResult.spec!

          // Compare: all properties should match
          expect(deserialized.name).toBe(spec.name)
          expect(deserialized.description).toBe(spec.description)
          expect(deserialized.source).toBe(spec.source)
          expect(deserialized.intent).toBe(spec.intent)
          expect(deserialized.steps).toHaveLength(spec.steps.length)

          // Compare each step
          for (let i = 0; i < spec.steps.length; i++) {
            const originalStep = spec.steps[i]
            const deserializedStep = deserialized.steps[i]

            expect(deserializedStep.id).toBe(originalStep.id)
            expect(deserializedStep.type).toBe(originalStep.type)
            expect(deserializedStep.appId).toBe(originalStep.appId)
            expect(deserializedStep.actionId).toBe(originalStep.actionId)
            expect(deserializedStep.connectionId).toBe(originalStep.connectionId)
            expect(deserializedStep.position.x).toBe(originalStep.position.x)
            expect(deserializedStep.position.y).toBe(originalStep.position.y)
            expect(deserializedStep.inputs).toEqual(originalStep.inputs)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should preserve position coordinates through round-trip', () => {
      fc.assert(
        fc.property(workflowSpecArbitrary, (spec: AivoryWorkflowSpec) => {
          const serialized = serializeWorkflowSpec(spec)
          const parseResult = parseWorkflowSpec(serialized)
          const deserialized = parseResult.spec!

          // All position coordinates should be preserved exactly
          for (let i = 0; i < spec.steps.length; i++) {
            expect(deserialized.steps[i].position.x).toBe(spec.steps[i].position.x)
            expect(deserialized.steps[i].position.y).toBe(spec.steps[i].position.y)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should preserve inputs through round-trip', () => {
      fc.assert(
        fc.property(workflowSpecArbitrary, (spec: AivoryWorkflowSpec) => {
          const serialized = serializeWorkflowSpec(spec)
          const parseResult = parseWorkflowSpec(serialized)
          const deserialized = parseResult.spec!

          // All inputs should be preserved exactly
          for (let i = 0; i < spec.steps.length; i++) {
            expect(deserialized.steps[i].inputs).toEqual(spec.steps[i].inputs)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should produce identical JSON when serialized twice', () => {
      fc.assert(
        fc.property(workflowSpecArbitrary, (spec: AivoryWorkflowSpec) => {
          const serialized1 = serializeWorkflowSpec(spec)
          const parseResult = parseWorkflowSpec(serialized1)
          const deserialized = parseResult.spec!
          const serialized2 = serializeWorkflowSpec(deserialized)

          // Both serializations should produce identical JSON
          expect(serialized1).toBe(serialized2)
        }),
        { numRuns: 100 }
      )
    })

    it('should validate round-trip for all generated specs', () => {
      fc.assert(
        fc.property(workflowSpecArbitrary, (spec: AivoryWorkflowSpec) => {
          const result = validateRoundTrip(spec)

          expect(result.roundTripValid).toBe(true)
          expect(result.error).toBeUndefined()
        }),
        { numRuns: 100 }
      )
    })

    it('should handle specs with all step types', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ minLength: 1, maxLength: 100 }),
            source: fc.string({ minLength: 1, maxLength: 50 }),
            intent: fc.string({ minLength: 1, maxLength: 100 })
          }),
          (metadata) => {
            const spec: AivoryWorkflowSpec = {
              ...metadata,
              steps: [
                {
                  id: 'step_1',
                  type: 'trigger',
                  appId: 'app1',
                  actionId: 'action1',
                  connectionId: 'conn1',
                  inputs: {},
                  position: { x: 400, y: 300 }
                },
                {
                  id: 'step_2',
                  type: 'action',
                  appId: 'app2',
                  actionId: 'action2',
                  connectionId: 'conn2',
                  inputs: { key: 'value' },
                  position: { x: 400, y: 480 }
                },
                {
                  id: 'step_3',
                  type: 'ai',
                  appId: 'app3',
                  actionId: 'action3',
                  connectionId: 'conn3',
                  inputs: { prompt: 'test' },
                  position: { x: 400, y: 660 }
                },
                {
                  id: 'step_4',
                  type: 'filter',
                  appId: 'app4',
                  actionId: 'action4',
                  connectionId: 'conn4',
                  inputs: { condition: 'true' },
                  position: { x: 400, y: 840 }
                }
              ]
            }

            const serialized = serializeWorkflowSpec(spec)
            const parseResult = parseWorkflowSpec(serialized)

            expect(parseResult.error).toBeUndefined()
            expect(parseResult.spec?.steps).toHaveLength(4)
            expect(parseResult.spec?.steps[0].type).toBe('trigger')
            expect(parseResult.spec?.steps[1].type).toBe('action')
            expect(parseResult.spec?.steps[2].type).toBe('ai')
            expect(parseResult.spec?.steps[3].type).toBe('filter')
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle specs with complex nested inputs', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ minLength: 1, maxLength: 100 }),
            source: fc.string({ minLength: 1, maxLength: 50 }),
            intent: fc.string({ minLength: 1, maxLength: 100 })
          }),
          (metadata) => {
            const spec: AivoryWorkflowSpec = {
              ...metadata,
              steps: [
                {
                  id: 'step_1',
                  type: 'trigger',
                  appId: 'api',
                  actionId: 'call_endpoint',
                  connectionId: 'conn1',
                  inputs: {
                    url: 'https://api.example.com',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: { nested: { deep: { value: 'test' } } }
                  },
                  position: { x: 400, y: 300 }
                }
              ]
            }

            const serialized = serializeWorkflowSpec(spec)
            const parseResult = parseWorkflowSpec(serialized)

            expect(parseResult.error).toBeUndefined()
            expect(parseResult.spec?.steps[0].inputs.body.nested.deep.value).toBe('test')
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle specs with empty inputs', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ minLength: 1, maxLength: 100 }),
            source: fc.string({ minLength: 1, maxLength: 50 }),
            intent: fc.string({ minLength: 1, maxLength: 100 })
          }),
          (metadata) => {
            const spec: AivoryWorkflowSpec = {
              ...metadata,
              steps: [
                {
                  id: 'step_1',
                  type: 'trigger',
                  appId: 'app1',
                  actionId: 'action1',
                  connectionId: 'conn1',
                  inputs: {},
                  position: { x: 400, y: 300 }
                }
              ]
            }

            const serialized = serializeWorkflowSpec(spec)
            const parseResult = parseWorkflowSpec(serialized)

            expect(parseResult.error).toBeUndefined()
            expect(parseResult.spec?.steps[0].inputs).toEqual({})
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle specs with various position coordinates', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              x: fc.integer({ min: -1000, max: 2000 }),
              y: fc.integer({ min: -1000, max: 2000 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (positions) => {
            const spec: AivoryWorkflowSpec = {
              name: 'Position Test',
              description: 'Test',
              source: 'console',
              intent: 'Test',
              steps: positions.map((pos, i) => ({
                id: `step_${i}`,
                type: i === 0 ? ('trigger' as WorkflowStepType) : ('action' as WorkflowStepType),
                appId: 'app',
                actionId: 'action',
                connectionId: 'conn',
                inputs: {},
                position: pos
              }))
            }

            const serialized = serializeWorkflowSpec(spec)
            const parseResult = parseWorkflowSpec(serialized)

            expect(parseResult.error).toBeUndefined()
            for (let i = 0; i < positions.length; i++) {
              expect(parseResult.spec?.steps[i].position.x).toBe(positions[i].x)
              expect(parseResult.spec?.steps[i].position.y).toBe(positions[i].y)
            }
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
