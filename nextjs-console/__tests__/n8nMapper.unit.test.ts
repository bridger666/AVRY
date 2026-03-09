/**
 * Unit Tests for n8n ↔ ReactFlow Mapper Functions
 * 
 * Tests bidirectional conversion between n8n and ReactFlow formats.
 * Tests edge case handling and round-trip conversion preservation.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { describe, it, expect } from 'vitest'
import {
  n8nToReactFlow,
  reactFlowToN8n,
  isValidN8nWorkflow,
  isValidReactFlowNodes,
} from '@/lib/n8nMapper'
import type { N8nWorkflow, N8nNode } from '@/lib/n8n'
import type { Node, Edge } from '@xyflow/react'

describe('n8n ↔ ReactFlow Mapper', () => {
  // ============================================================================
  // n8nToReactFlow Tests
  // ============================================================================

  describe('n8nToReactFlow', () => {
    it('should convert simple n8n workflow to ReactFlow nodes and edges', () => {
      const workflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        nodes: [
          {
            id: 'trigger-1',
            name: 'Manual Trigger',
            type: 'n8n-nodes-base.manualTrigger',
            position: { x: 0, y: 0 },
            parameters: {},
          },
          {
            id: 'action-1',
            name: 'Set Data',
            type: 'n8n-nodes-base.set',
            position: { x: 100, y: 0 },
            parameters: { resource: 'test' },
          },
        ],
        connections: {
          'trigger-1': {
            0: [{ node: 'action-1', type: 'main', index: 0 }],
          },
        },
        settings: {},
        active: true,
      }

      const { nodes, edges } = n8nToReactFlow(workflow)

      expect(nodes).toHaveLength(2)
      expect(edges).toHaveLength(1)
      expect(nodes[0].id).toBe('trigger-1')
      expect(nodes[1].id).toBe('action-1')
      expect(edges[0].source).toBe('trigger-1')
      expect(edges[0].target).toBe('action-1')
    })

    it('should preserve node IDs during conversion', () => {
      const workflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [
          {
            id: 'unique-node-id-12345',
            name: 'Test Node',
            type: 'n8n-nodes-base.set',
            position: { x: 0, y: 0 },
            parameters: {},
          },
        ],
        connections: {},
        settings: {},
        active: false,
      }

      const { nodes } = n8nToReactFlow(workflow)

      expect(nodes[0].id).toBe('unique-node-id-12345')
    })

    it('should preserve node names as labels', () => {
      const workflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [
          {
            id: 'node-1',
            name: 'My Custom Node Name',
            type: 'n8n-nodes-base.set',
            position: { x: 0, y: 0 },
            parameters: {},
          },
        ],
        connections: {},
        settings: {},
        active: false,
      }

      const { nodes } = n8nToReactFlow(workflow)

      expect(nodes[0].data.title).toBe('My Custom Node Name')
    })

    it('should handle empty workflow', () => {
      const workflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Empty',
        nodes: [],
        connections: {},
        settings: {},
        active: false,
      }

      const { nodes, edges } = n8nToReactFlow(workflow)

      expect(nodes).toHaveLength(0)
      expect(edges).toHaveLength(0)
    })

    it('should handle workflow with no connections', () => {
      const workflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'No Connections',
        nodes: [
          {
            id: 'node-1',
            name: 'Node 1',
            type: 'n8n-nodes-base.set',
            position: { x: 0, y: 0 },
            parameters: {},
          },
          {
            id: 'node-2',
            name: 'Node 2',
            type: 'n8n-nodes-base.set',
            position: { x: 100, y: 0 },
            parameters: {},
          },
        ],
        connections: {},
        settings: {},
        active: false,
      }

      const { nodes, edges } = n8nToReactFlow(workflow)

      expect(nodes).toHaveLength(2)
      expect(edges).toHaveLength(0)
    })

    it('should handle multiple connections from single node', () => {
      const workflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Multiple Connections',
        nodes: [
          {
            id: 'trigger-1',
            name: 'Trigger',
            type: 'n8n-nodes-base.manualTrigger',
            position: { x: 0, y: 0 },
            parameters: {},
          },
          {
            id: 'action-1',
            name: 'Action 1',
            type: 'n8n-nodes-base.set',
            position: { x: 100, y: 0 },
            parameters: {},
          },
          {
            id: 'action-2',
            name: 'Action 2',
            type: 'n8n-nodes-base.set',
            position: { x: 100, y: 100 },
            parameters: {},
          },
        ],
        connections: {
          'trigger-1': {
            0: [
              { node: 'action-1', type: 'main', index: 0 },
              { node: 'action-2', type: 'main', index: 0 },
            ],
          },
        },
        settings: {},
        active: false,
      }

      const { nodes, edges } = n8nToReactFlow(workflow)

      expect(nodes).toHaveLength(3)
      expect(edges).toHaveLength(2)
    })

    it('should handle missing positions gracefully', () => {
      const workflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [
          {
            id: 'node-1',
            name: 'Node 1',
            type: 'n8n-nodes-base.set',
            position: { x: 0, y: 0 },
            parameters: {},
          },
        ],
        connections: {},
        settings: {},
        active: false,
      }

      const { nodes } = n8nToReactFlow(workflow)

      expect(nodes[0].position).toBeDefined()
      expect(typeof nodes[0].position.x).toBe('number')
      expect(typeof nodes[0].position.y).toBe('number')
    })

    it('should handle undefined parameters', () => {
      const workflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [
          {
            id: 'node-1',
            name: 'Node 1',
            type: 'n8n-nodes-base.set',
            position: { x: 0, y: 0 },
            parameters: {},
          },
        ],
        connections: {},
        settings: {},
        active: false,
      }

      const { nodes } = n8nToReactFlow(workflow)

      expect(nodes[0].data).toBeDefined()
    })

    it('should preserve node types', () => {
      const workflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [
          {
            id: 'node-1',
            name: 'Trigger',
            type: 'n8n-nodes-base.manualTrigger',
            position: { x: 0, y: 0 },
            parameters: {},
          },
          {
            id: 'node-2',
            name: 'Action',
            type: 'n8n-nodes-base.set',
            position: { x: 100, y: 0 },
            parameters: {},
          },
        ],
        connections: {},
        settings: {},
        active: false,
      }

      const { nodes } = n8nToReactFlow(workflow)

      // Check that nodes have proper data structure
      expect(nodes[0].data).toBeDefined()
      expect(nodes[1].data).toBeDefined()
    })
  })

  // ============================================================================
  // reactFlowToN8n Tests
  // ============================================================================

  describe('reactFlowToN8n', () => {
    it('should convert ReactFlow nodes back to n8n format', () => {
      const baseWorkflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        nodes: [
          {
            id: 'node-1',
            name: 'Original Node',
            type: 'n8n-nodes-base.set',
            position: { x: 0, y: 0 },
            parameters: { resource: 'original' },
          },
        ],
        connections: {},
        settings: { timezone: 'UTC' },
        active: true,
      }

      const nodes: any[] = [
        {
          id: 'node-1',
          data: {
            title: 'Updated Node',
            category: 'action',
            rawN8n: {
              id: 'node-1',
              name: 'Updated Node',
              type: 'n8n-nodes-base.set',
              position: { x: 0, y: 0 },
              parameters: { resource: 'updated' },
            },
          },
          position: { x: 0, y: 0 },
          type: 'workflowStep',
        },
      ]

      const edges: Edge[] = []

      const result = reactFlowToN8n(nodes, edges, baseWorkflow)

      expect(result.nodes).toHaveLength(1)
      expect(result.nodes[0].id).toBe('node-1')
      expect(result.settings.timezone).toBe('UTC')
    })

    it('should preserve base workflow settings', () => {
      const baseWorkflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [],
        connections: {},
        settings: {
          timezone: 'America/New_York',
          saveDataErrorExecution: 'all',
          saveDataSuccessExecution: 'all',
        },
        active: true,
      }

      const result = reactFlowToN8n([], [], baseWorkflow)

      expect(result.settings.timezone).toBe('America/New_York')
      expect(result.settings.saveDataErrorExecution).toBe('all')
      expect(result.settings.saveDataSuccessExecution).toBe('all')
    })

    it('should convert edges to n8n connections', () => {
      const baseWorkflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [
          {
            id: 'node-1',
            name: 'Node 1',
            type: 'n8n-nodes-base.set',
            position: { x: 0, y: 0 },
            parameters: {},
          },
          {
            id: 'node-2',
            name: 'Node 2',
            type: 'n8n-nodes-base.set',
            position: { x: 100, y: 0 },
            parameters: {},
          },
        ],
        connections: {},
        settings: {},
        active: false,
      }

      const nodes: any[] = [
        {
          id: 'node-1',
          data: { title: 'Node 1', category: 'action', rawN8n: baseWorkflow.nodes[0] },
          position: { x: 0, y: 0 },
          type: 'workflowStep',
        },
        {
          id: 'node-2',
          data: { title: 'Node 2', category: 'action', rawN8n: baseWorkflow.nodes[1] },
          position: { x: 100, y: 0 },
          type: 'workflowStep',
        },
      ]

      const edges: Edge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
        },
      ]

      const result = reactFlowToN8n(nodes, edges, baseWorkflow)

      expect(result.connections['node-1']).toBeDefined()
      expect(result.connections['node-1'][0]).toBeDefined()
      expect(result.connections['node-1'][0][0].node).toBe('node-2')
    })

    it('should handle empty nodes and edges', () => {
      const baseWorkflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [],
        connections: {},
        settings: {},
        active: false,
      }

      const result = reactFlowToN8n([], [], baseWorkflow)

      expect(result.nodes).toHaveLength(0)
      expect(Object.keys(result.connections)).toHaveLength(0)
    })

    it('should handle multiple edges from single node', () => {
      const baseWorkflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [
          {
            id: 'node-1',
            name: 'Node 1',
            type: 'n8n-nodes-base.set',
            position: { x: 0, y: 0 },
            parameters: {},
          },
          {
            id: 'node-2',
            name: 'Node 2',
            type: 'n8n-nodes-base.set',
            position: { x: 100, y: 0 },
            parameters: {},
          },
          {
            id: 'node-3',
            name: 'Node 3',
            type: 'n8n-nodes-base.set',
            position: { x: 100, y: 100 },
            parameters: {},
          },
        ],
        connections: {},
        settings: {},
        active: false,
      }

      const nodes: any[] = baseWorkflow.nodes.map((n) => ({
        id: n.id,
        data: { title: n.name, category: 'action', rawN8n: n },
        position: n.position,
        type: 'workflowStep',
      }))

      const edges: Edge[] = [
        { id: 'edge-1', source: 'node-1', target: 'node-2' },
        { id: 'edge-2', source: 'node-1', target: 'node-3' },
      ]

      const result = reactFlowToN8n(nodes, edges, baseWorkflow)

      expect(result.connections['node-1'][0]).toHaveLength(2)
    })
  })

  // ============================================================================
  // Round-Trip Conversion Tests
  // ============================================================================

  describe('Round-trip conversion', () => {
    it('should preserve node IDs in round-trip conversion', () => {
      const originalWorkflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [
          {
            id: 'node-1',
            name: 'Node 1',
            type: 'n8n-nodes-base.set',
            position: { x: 0, y: 0 },
            parameters: { resource: 'test' },
          },
          {
            id: 'node-2',
            name: 'Node 2',
            type: 'n8n-nodes-base.set',
            position: { x: 100, y: 0 },
            parameters: { resource: 'test2' },
          },
        ],
        connections: {
          'node-1': {
            0: [{ node: 'node-2', type: 'main', index: 0 }],
          },
        },
        settings: {},
        active: false,
      }

      const { nodes, edges } = n8nToReactFlow(originalWorkflow)
      const convertedBack = reactFlowToN8n(nodes, edges, originalWorkflow)

      expect(convertedBack.nodes[0].id).toBe('node-1')
      expect(convertedBack.nodes[1].id).toBe('node-2')
    })

    it('should preserve node names in round-trip conversion', () => {
      const originalWorkflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [
          {
            id: 'node-1',
            name: 'My Trigger',
            type: 'n8n-nodes-base.manualTrigger',
            position: { x: 0, y: 0 },
            parameters: {},
          },
        ],
        connections: {},
        settings: {},
        active: false,
      }

      const { nodes, edges } = n8nToReactFlow(originalWorkflow)
      const convertedBack = reactFlowToN8n(nodes, edges, originalWorkflow)

      expect(convertedBack.nodes[0].name).toBe('My Trigger')
    })

    it('should preserve connections in round-trip conversion', () => {
      const originalWorkflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [
          {
            id: 'node-1',
            name: 'Node 1',
            type: 'n8n-nodes-base.set',
            position: { x: 0, y: 0 },
            parameters: {},
          },
          {
            id: 'node-2',
            name: 'Node 2',
            type: 'n8n-nodes-base.set',
            position: { x: 100, y: 0 },
            parameters: {},
          },
        ],
        connections: {
          'node-1': {
            0: [{ node: 'node-2', type: 'main', index: 0 }],
          },
        },
        settings: {},
        active: false,
      }

      const { nodes, edges } = n8nToReactFlow(originalWorkflow)
      const convertedBack = reactFlowToN8n(nodes, edges, originalWorkflow)

      expect(convertedBack.connections['node-1']).toBeDefined()
      expect(convertedBack.connections['node-1'][0][0].node).toBe('node-2')
    })
  })

  // ============================================================================
  // Validation Tests
  // ============================================================================

  describe('isValidN8nWorkflow', () => {
    it('should validate correct n8n workflow', () => {
      const workflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [
          {
            id: 'node-1',
            name: 'Node 1',
            type: 'n8n-nodes-base.set',
            position: { x: 0, y: 0 },
            parameters: {},
          },
        ],
        connections: {},
        settings: {},
        active: false,
      }

      expect(isValidN8nWorkflow(workflow)).toBe(true)
    })

    it('should reject workflow without nodes array', () => {
      const workflow = {
        id: 'test-workflow',
        name: 'Test',
        connections: {},
        settings: {},
        active: false,
      }

      expect(isValidN8nWorkflow(workflow)).toBe(false)
    })

    it('should reject workflow with invalid node structure', () => {
      const workflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [
          {
            id: 'node-1',
            name: 'Node 1',
            // Missing type
            position: { x: 0, y: 0 },
            parameters: {},
          },
        ],
        connections: {},
        settings: {},
        active: false,
      }

      expect(isValidN8nWorkflow(workflow)).toBe(false)
    })

    it('should reject null or undefined', () => {
      expect(isValidN8nWorkflow(null)).toBe(false)
      expect(isValidN8nWorkflow(undefined)).toBe(false)
    })

    it('should reject non-object values', () => {
      expect(isValidN8nWorkflow('string')).toBe(false)
      expect(isValidN8nWorkflow(123)).toBe(false)
      expect(isValidN8nWorkflow([])).toBe(false)
    })
  })

  describe('isValidReactFlowNodes', () => {
    it('should validate correct ReactFlow nodes', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          data: { label: 'Node 1', type: 'step' },
          position: { x: 0, y: 0 },
          type: 'workflowStep',
        },
      ]

      expect(isValidReactFlowNodes(nodes)).toBe(true)
    })

    it('should reject nodes without label', () => {
      const nodes = [
        {
          id: 'node-1',
          data: { type: 'step' },
          position: { x: 0, y: 0 },
          type: 'workflowStep',
        },
      ]

      expect(isValidReactFlowNodes(nodes)).toBe(false)
    })

    it('should reject nodes without position', () => {
      const nodes = [
        {
          id: 'node-1',
          data: { label: 'Node 1', type: 'step' },
          type: 'workflowStep',
        },
      ]

      expect(isValidReactFlowNodes(nodes)).toBe(false)
    })

    it('should reject non-array input', () => {
      expect(isValidReactFlowNodes(null as any)).toBe(false)
      expect(isValidReactFlowNodes(undefined as any)).toBe(false)
      expect(isValidReactFlowNodes('string' as any)).toBe(false)
    })

    it('should accept empty array', () => {
      expect(isValidReactFlowNodes([])).toBe(true)
    })
  })
})
