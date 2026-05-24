// @ts-nocheck
import fc from 'fast-check'
import {
  calculateTriggerPosition,
  calculateStepPosition,
  calculateBranchPosition,
  calculateEdgeLayout,
  calculateAllPositions,
  calculateAllEdgeLayouts,
} from '@/lib/canvasLayout'
import { AivoryWorkflowSpec, WorkflowStep, AivoryWorkflowEdge } from '@/types/workflows'

/**
 * Generators for property-based testing
 */

const positionArbitrary = () =>
  fc.record({
    x: fc.integer({ min: 0, max: 1000 }),
    y: fc.integer({ min: 0, max: 1000 }),
  })

const workflowStepArbitrary = (type: string = 'action') =>
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    type: fc.constant(type),
    appId: fc.string({ minLength: 1, maxLength: 20 }),
    actionId: fc.string({ minLength: 1, maxLength: 20 }),
    connectionId: fc.string({ minLength: 1, maxLength: 20 }),
    inputs: fc.constant({}),
    position: positionArbitrary(),
  })

const workflowSpecArbitrary = () =>
  fc
    .tuple(
      fc.array(workflowStepArbitrary('action'), { minLength: 0, maxLength: 5 }),
      fc.string({ minLength: 1, maxLength: 50 })
    )
    .map(([actionSteps, name]) => {
      const triggerStep = {
        id: 'trigger_1',
        type: 'trigger' as const,
        appId: 'trigger',
        actionId: 'start',
        connectionId: 'conn_trigger',
        inputs: {},
        position: { x: 0, y: 0 },
      }

      return {
        name,
        description: 'Test workflow',
        source: 'test',
        intent: 'test',
        steps: [triggerStep, ...actionSteps],
      } as AivoryWorkflowSpec
    })

describe('Canvas Layout - Property-Based Tests', () => {
  describe('Property 7: Canvas Node Positioning', () => {
    it('should position trigger node at (400, 300)', () => {
      fc.assert(
        fc.property(fc.integer(), () => {
          const pos = calculateTriggerPosition()
          expect(pos.x).toBe(400)
          expect(pos.y).toBe(300)
        })
      )
    })

    it('should position step 0 at (400, 300)', () => {
      fc.assert(
        fc.property(fc.integer(), () => {
          const pos = calculateStepPosition(0)
          expect(pos.x).toBe(400)
          expect(pos.y).toBe(300)
        })
      )
    })

    it('should increment y by 180 for each step index', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (stepIndex) => {
          const pos = calculateStepPosition(stepIndex)
          expect(pos.y).toBe(300 + stepIndex * 180)
          expect(pos.x).toBe(400)
        })
      )
    })

    it('should maintain x=400 for all sequential steps', () => {
      fc.assert(
        fc.property(fc.array(fc.integer({ min: 0, max: 50 }), { minLength: 1 }), (indices) => {
          indices.forEach((idx) => {
            const pos = calculateStepPosition(idx)
            expect(pos.x).toBe(400)
          })
        })
      )
    })

    it('should position left branch at x=150 and right branch at x=650', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 50 }), (stepIndex) => {
          const leftPos = calculateBranchPosition(stepIndex, 'left')
          const rightPos = calculateBranchPosition(stepIndex, 'right')

          expect(leftPos.x).toBe(150)
          expect(rightPos.x).toBe(650)
          expect(leftPos.y).toBe(rightPos.y)
        })
      )
    })

    it('should have 500px horizontal offset between branches', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 50 }), (stepIndex) => {
          const leftPos = calculateBranchPosition(stepIndex, 'left')
          const rightPos = calculateBranchPosition(stepIndex, 'right')

          expect(rightPos.x - leftPos.x).toBe(500)
        })
      )
    })

    it('should position all steps in a workflow correctly', () => {
      fc.assert(
        fc.property(workflowSpecArbitrary(), (spec) => {
          const positions = calculateAllPositions(spec)

          // Should have positions for all steps
          expect(positions.size).toBe(spec.steps.length)

          // Trigger should be at (400, 300)
          const triggerStep = spec.steps.find((s) => s.type === 'trigger')
          if (triggerStep) {
            const triggerPos = positions.get(triggerStep.id)
            expect(triggerPos).toEqual({ x: 400, y: 300 })
          }

          // All positions should have x=400
          positions.forEach((pos) => {
            expect(pos.x).toBe(400)
          })

          // Y positions should be sequential with 180px spacing
          const sortedPositions = Array.from(positions.values()).sort((a, b) => a.y - b.y)
          for (let i = 1; i < sortedPositions.length; i++) {
            expect(sortedPositions[i].y - sortedPositions[i - 1].y).toBe(180)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should handle workflows with many steps', () => {
      fc.assert(
        fc.property(
          fc.array(workflowStepArbitrary('action'), { minLength: 0, maxLength: 20 }),
          (actionSteps) => {
            const spec: AivoryWorkflowSpec = {
              name: 'Large workflow',
              description: 'Test workflow',
              source: 'test',
              intent: 'test',
              steps: [
                {
                  id: 'trigger_1',
                  type: 'trigger',
                  appId: 'trigger',
                  actionId: 'start',
                  connectionId: 'conn_trigger',
                  inputs: {},
                  position: { x: 0, y: 0 },
                },
                ...actionSteps,
              ],
            }

            const positions = calculateAllPositions(spec)
            expect(positions.size).toBe(spec.steps.length)

            // Verify all positions are valid
            positions.forEach((pos) => {
              expect(typeof pos.x).toBe('number')
              expect(typeof pos.y).toBe('number')
              expect(pos.x).toBe(400)
              expect(pos.y).toBeGreaterThanOrEqual(300)
            })
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Property 7: Edge Layout Correctness', () => {
    it('should create valid edge layouts for all edges', () => {
      fc.assert(
        fc.property(workflowSpecArbitrary(), (spec) => {
          if (spec.steps.length < 2) return

          const edges: AivoryWorkflowEdge[] = []
          for (let i = 0; i < spec.steps.length - 1; i++) {
            edges.push({
              from: spec.steps[i].id,
              to: spec.steps[i + 1].id,
            })
          }

          const positions = calculateAllPositions(spec)
          const layouts = calculateAllEdgeLayouts(spec, edges, positions)

          // Should have layout for each edge
          expect(layouts.length).toBe(edges.length)

          // Each layout should have valid from/to positions
          layouts.forEach((layout) => {
            expect(layout.from).toBeDefined()
            expect(layout.to).toBeDefined()
            expect(typeof layout.from.x).toBe('number')
            expect(typeof layout.from.y).toBe('number')
            expect(typeof layout.to.x).toBe('number')
            expect(typeof layout.to.y).toBe('number')
          })
        }),
        { numRuns: 100 }
      )
    })

    it('should use correct edge type based on positions', () => {
      fc.assert(
        fc.property(workflowSpecArbitrary(), (spec) => {
          if (spec.steps.length < 2) return

          const edges: AivoryWorkflowEdge[] = []
          for (let i = 0; i < spec.steps.length - 1; i++) {
            edges.push({
              from: spec.steps[i].id,
              to: spec.steps[i + 1].id,
            })
          }

          const positions = calculateAllPositions(spec)
          const layouts = calculateAllEdgeLayouts(spec, edges, positions)

          layouts.forEach((layout) => {
            // Edges use either 'curved' or 'angular' based on positions
            expect(['curved', 'angular']).toContain(layout.type)
          })
        }),
        { numRuns: 100 }
      )
    })

    it('should preserve edge labels in layouts', () => {
      fc.assert(
        fc.property(
          workflowSpecArbitrary(),
          fc.string({ minLength: 1, maxLength: 20 }),
          (spec, label) => {
            if (spec.steps.length < 2) return

            const edges: AivoryWorkflowEdge[] = [
              {
                from: spec.steps[0].id,
                to: spec.steps[1].id,
                label,
              },
            ]

            const positions = calculateAllPositions(spec)
            const layouts = calculateAllEdgeLayouts(spec, edges, positions)

            expect(layouts).toHaveLength(1)
            expect(layouts[0].label).toBe(label)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle edges with missing steps gracefully', () => {
      fc.assert(
        fc.property(workflowSpecArbitrary(), (spec) => {
          const edges: AivoryWorkflowEdge[] = [
            {
              from: 'nonexistent_1',
              to: 'nonexistent_2',
            },
          ]

          const positions = calculateAllPositions(spec)
          const layouts = calculateAllEdgeLayouts(spec, edges, positions)

          // Should return empty array for invalid edges
          expect(layouts).toHaveLength(0)
        }),
        { numRuns: 50 }
      )
    })
  })

  describe('Property 7: Positioning Consistency', () => {
    it('should produce consistent positions for same input', () => {
      fc.assert(
        fc.property(workflowSpecArbitrary(), (spec) => {
          const positions1 = calculateAllPositions(spec)
          const positions2 = calculateAllPositions(spec)

          // Should produce identical positions
          expect(positions1.size).toBe(positions2.size)
          positions1.forEach((pos, id) => {
            const pos2 = positions2.get(id)
            expect(pos2).toEqual(pos)
          })
        }),
        { numRuns: 100 }
      )
    })

    it('should handle edge cases with single step', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const spec: AivoryWorkflowSpec = {
            name: 'Single step',
            description: 'Test workflow',
            source: 'test',
            intent: 'test',
            steps: [
              {
                id: 'trigger_1',
                type: 'trigger',
                appId: 'trigger',
                actionId: 'start',
                connectionId: 'conn_trigger',
                inputs: {},
                position: { x: 0, y: 0 },
              },
            ],
          }

          const positions = calculateAllPositions(spec)
          expect(positions.size).toBe(1)
          expect(positions.get('trigger_1')).toEqual({ x: 400, y: 300 })
        }),
        { numRuns: 10 }
      )
    })

    it('should handle edge cases without trigger', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const spec: AivoryWorkflowSpec = {
            name: 'No trigger',
            description: 'Test workflow',
            source: 'test',
            intent: 'test',
            steps: [
              {
                id: 'step_1',
                type: 'action',
                appId: 'slack',
                actionId: 'send_message',
                connectionId: 'conn_1',
                inputs: {},
                position: { x: 0, y: 0 },
              },
            ],
          }

          const positions = calculateAllPositions(spec)
          expect(positions.size).toBe(0)
        }),
        { numRuns: 10 }
      )
    })
  })
})
