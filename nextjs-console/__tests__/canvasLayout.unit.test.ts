// @ts-nocheck
import {
  calculateTriggerPosition,
  calculateStepPosition,
  calculateBranchPosition,
  calculateEdgeLayout,
  calculateAllPositions,
  calculateAllEdgeLayouts,
  Position,
  EdgeLayout,
} from '@/lib/canvasLayout'
import { AivoryWorkflowSpec, WorkflowStep, AivoryWorkflowEdge } from '@/types/workflows'

describe('Canvas Layout Utilities', () => {
  describe('calculateTriggerPosition', () => {
    it('should return canvas center position (400, 300)', () => {
      const pos = calculateTriggerPosition()
      expect(pos).toEqual({ x: 400, y: 300 })
    })

    it('should always return the same position', () => {
      const pos1 = calculateTriggerPosition()
      const pos2 = calculateTriggerPosition()
      expect(pos1).toEqual(pos2)
    })
  })

  describe('calculateStepPosition', () => {
    it('should return (400, 300) for step index 0', () => {
      const pos = calculateStepPosition(0)
      expect(pos).toEqual({ x: 400, y: 300 })
    })

    it('should return (400, 480) for step index 1', () => {
      const pos = calculateStepPosition(1)
      expect(pos).toEqual({ x: 400, y: 480 })
    })

    it('should return (400, 660) for step index 2', () => {
      const pos = calculateStepPosition(2)
      expect(pos).toEqual({ x: 400, y: 660 })
    })

    it('should increment y by 180 for each step', () => {
      const pos0 = calculateStepPosition(0)
      const pos1 = calculateStepPosition(1)
      const pos2 = calculateStepPosition(2)

      expect(pos1.y - pos0.y).toBe(180)
      expect(pos2.y - pos1.y).toBe(180)
    })

    it('should always keep x at 400', () => {
      for (let i = 0; i < 10; i++) {
        const pos = calculateStepPosition(i)
        expect(pos.x).toBe(400)
      }
    })

    it('should handle large step indices', () => {
      const pos = calculateStepPosition(100)
      expect(pos).toEqual({ x: 400, y: 300 + 100 * 180 })
    })
  })

  describe('calculateBranchPosition', () => {
    it('should return left branch position (150, 660) for step index 2', () => {
      const pos = calculateBranchPosition(2, 'left')
      expect(pos).toEqual({ x: 150, y: 660 })
    })

    it('should return right branch position (650, 660) for step index 2', () => {
      const pos = calculateBranchPosition(2, 'right')
      expect(pos).toEqual({ x: 650, y: 660 })
    })

    it('should have 500px horizontal offset between left and right branches', () => {
      const left = calculateBranchPosition(2, 'left')
      const right = calculateBranchPosition(2, 'right')
      expect(right.x - left.x).toBe(500)
    })

    it('should have same y position for both branches', () => {
      const left = calculateBranchPosition(2, 'left')
      const right = calculateBranchPosition(2, 'right')
      expect(left.y).toBe(right.y)
    })

    it('should offset 250px left from center (400)', () => {
      const left = calculateBranchPosition(0, 'left')
      expect(left.x).toBe(150)
    })

    it('should offset 250px right from center (400)', () => {
      const right = calculateBranchPosition(0, 'right')
      expect(right.x).toBe(650)
    })

    it('should handle multiple branch levels', () => {
      const level0Left = calculateBranchPosition(0, 'left')
      const level1Left = calculateBranchPosition(1, 'left')
      const level2Left = calculateBranchPosition(2, 'left')

      expect(level0Left.x).toBe(level1Left.x)
      expect(level1Left.x).toBe(level2Left.x)
      expect(level1Left.y - level0Left.y).toBe(180)
      expect(level2Left.y - level1Left.y).toBe(180)
    })
  })

  describe('calculateEdgeLayout', () => {
    it('should create edge layout between two steps', () => {
      const fromStep: WorkflowStep = {
        id: 'step_1',
        type: 'trigger',
        appId: 'trigger',
        actionId: 'start',
        connectionId: 'conn_1',
        inputs: {},
        position: { x: 400, y: 300 },
      }

      const toStep: WorkflowStep = {
        id: 'step_2',
        type: 'action',
        appId: 'slack',
        actionId: 'send_message',
        connectionId: 'conn_2',
        inputs: {},
        position: { x: 400, y: 480 },
      }

      const layout = calculateEdgeLayout(fromStep, toStep)

      expect(layout.from).toEqual({ x: 400, y: 300 })
      expect(layout.to).toEqual({ x: 400, y: 480 })
      expect(layout.type).toBe('curved')
    })

    it('should include edge label if provided', () => {
      const fromStep: WorkflowStep = {
        id: 'step_1',
        type: 'filter',
        appId: 'filter',
        actionId: 'condition',
        connectionId: 'conn_1',
        inputs: {},
        position: { x: 400, y: 300 },
      }

      const toStep: WorkflowStep = {
        id: 'step_2',
        type: 'action',
        appId: 'slack',
        actionId: 'send_message',
        connectionId: 'conn_2',
        inputs: {},
        position: { x: 150, y: 480 },
      }

      const edge: AivoryWorkflowEdge = {
        from: 'step_1',
        to: 'step_2',
        label: 'if true',
      }

      const layout = calculateEdgeLayout(fromStep, toStep, edge)

      expect(layout.label).toBe('if true')
    })

    it('should use curved bezier for diagonal edges', () => {
      const fromStep: WorkflowStep = {
        id: 'step_1',
        type: 'filter',
        appId: 'filter',
        actionId: 'condition',
        connectionId: 'conn_1',
        inputs: {},
        position: { x: 400, y: 300 },
      }

      const toStep: WorkflowStep = {
        id: 'step_2',
        type: 'action',
        appId: 'slack',
        actionId: 'send_message',
        connectionId: 'conn_2',
        inputs: {},
        position: { x: 150, y: 480 },
      }

      const layout = calculateEdgeLayout(fromStep, toStep)

      expect(layout.type).toBe('curved')
    })

    it('should use curved bezier for short vertical edges', () => {
      const fromStep: WorkflowStep = {
        id: 'step_1',
        type: 'trigger',
        appId: 'trigger',
        actionId: 'start',
        connectionId: 'conn_1',
        inputs: {},
        position: { x: 400, y: 300 },
      }

      const toStep: WorkflowStep = {
        id: 'step_2',
        type: 'action',
        appId: 'slack',
        actionId: 'send_message',
        connectionId: 'conn_2',
        inputs: {},
        position: { x: 400, y: 480 },
      }

      const layout = calculateEdgeLayout(fromStep, toStep)

      expect(layout.type).toBe('curved')
    })

    it('should use angular for very tall narrow connections', () => {
      const fromStep: WorkflowStep = {
        id: 'step_1',
        type: 'trigger',
        appId: 'trigger',
        actionId: 'start',
        connectionId: 'conn_1',
        inputs: {},
        position: { x: 400, y: 100 },
      }

      const toStep: WorkflowStep = {
        id: 'step_2',
        type: 'action',
        appId: 'slack',
        actionId: 'send_message',
        connectionId: 'conn_2',
        inputs: {},
        position: { x: 450, y: 500 },
      }

      const layout = calculateEdgeLayout(fromStep, toStep)

      expect(layout.type).toBe('angular')
    })
  })

  describe('calculateAllPositions', () => {
    it('should return empty map for spec without trigger', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
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
    })

    it('should position trigger at center', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'test',
        intent: 'test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'trigger',
            actionId: 'start',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 0, y: 0 },
          },
        ],
      }

      const positions = calculateAllPositions(spec)
      expect(positions.get('step_1')).toEqual({ x: 400, y: 300 })
    })

    it('should position sequential steps with 180px spacing', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'test',
        intent: 'test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'trigger',
            actionId: 'start',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 0, y: 0 },
          },
          {
            id: 'step_2',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_2',
            inputs: {},
            position: { x: 0, y: 0 },
          },
          {
            id: 'step_3',
            type: 'action',
            appId: 'gmail',
            actionId: 'send_email',
            connectionId: 'conn_3',
            inputs: {},
            position: { x: 0, y: 0 },
          },
        ],
      }

      const positions = calculateAllPositions(spec)
      expect(positions.get('step_1')).toEqual({ x: 400, y: 300 })
      expect(positions.get('step_2')).toEqual({ x: 400, y: 480 })
      expect(positions.get('step_3')).toEqual({ x: 400, y: 660 })
    })

    it('should handle single step workflow', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'test',
        intent: 'test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'trigger',
            actionId: 'start',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 0, y: 0 },
          },
        ],
      }

      const positions = calculateAllPositions(spec)
      expect(positions.size).toBe(1)
      expect(positions.get('step_1')).toEqual({ x: 400, y: 300 })
    })

    it('should handle multiple steps', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'test',
        intent: 'test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'trigger',
            actionId: 'start',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 0, y: 0 },
          },
          {
            id: 'step_2',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_2',
            inputs: {},
            position: { x: 0, y: 0 },
          },
          {
            id: 'step_3',
            type: 'action',
            appId: 'gmail',
            actionId: 'send_email',
            connectionId: 'conn_3',
            inputs: {},
            position: { x: 0, y: 0 },
          },
          {
            id: 'step_4',
            type: 'action',
            appId: 'notion',
            actionId: 'create_page',
            connectionId: 'conn_4',
            inputs: {},
            position: { x: 0, y: 0 },
          },
        ],
      }

      const positions = calculateAllPositions(spec)
      expect(positions.size).toBe(4)
    })
  })

  describe('calculateAllEdgeLayouts', () => {
    it('should return empty array for spec without edges', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'test',
        intent: 'test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'trigger',
            actionId: 'start',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
        ],
      }

      const positions = new Map([['step_1', { x: 400, y: 300 }]])
      const layouts = calculateAllEdgeLayouts(spec, [], positions)

      expect(layouts).toEqual([])
    })

    it('should create edge layouts for all edges', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'test',
        intent: 'test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'trigger',
            actionId: 'start',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
          {
            id: 'step_2',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_2',
            inputs: {},
            position: { x: 400, y: 480 },
          },
        ],
      }

      const edges: AivoryWorkflowEdge[] = [
        {
          from: 'step_1',
          to: 'step_2',
        },
      ]

      const positions = new Map([
        ['step_1', { x: 400, y: 300 }],
        ['step_2', { x: 400, y: 480 }],
      ])

      const layouts = calculateAllEdgeLayouts(spec, edges, positions)

      expect(layouts).toHaveLength(1)
      expect(layouts[0].from).toEqual({ x: 400, y: 300 })
      expect(layouts[0].to).toEqual({ x: 400, y: 480 })
    })

    it('should skip edges with missing steps', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'test',
        intent: 'test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'trigger',
            actionId: 'start',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
        ],
      }

      const edges: AivoryWorkflowEdge[] = [
        {
          from: 'step_1',
          to: 'step_2', // step_2 doesn't exist
        },
      ]

      const positions = new Map([['step_1', { x: 400, y: 300 }]])

      const layouts = calculateAllEdgeLayouts(spec, edges, positions)

      expect(layouts).toHaveLength(0)
    })

    it('should handle multiple edges', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'test',
        intent: 'test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'trigger',
            actionId: 'start',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
          {
            id: 'step_2',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_2',
            inputs: {},
            position: { x: 400, y: 480 },
          },
          {
            id: 'step_3',
            type: 'action',
            appId: 'gmail',
            actionId: 'send_email',
            connectionId: 'conn_3',
            inputs: {},
            position: { x: 400, y: 660 },
          },
        ],
      }

      const edges: AivoryWorkflowEdge[] = [
        { from: 'step_1', to: 'step_2' },
        { from: 'step_2', to: 'step_3' },
      ]

      const positions = new Map([
        ['step_1', { x: 400, y: 300 }],
        ['step_2', { x: 400, y: 480 }],
        ['step_3', { x: 400, y: 660 }],
      ])

      const layouts = calculateAllEdgeLayouts(spec, edges, positions)

      expect(layouts).toHaveLength(2)
    })
  })
})
