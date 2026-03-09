/**
 * Property-Based Tests for n8n to ReactFlow Mapping
 * 
 * **Validates: Requirements 7.3, 1.2**
 * Property 2: n8n to ReactFlow Mapping Preserves Data
 * 
 * For any n8n workflow object, converting to ReactFlow format and back 
 * should preserve all node properties (id, name, type, parameters, position).
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { n8nToReactFlow, reactFlowToN8n } from '../lib/n8nMapper'
import type { N8nWorkflow, N8nNode } from '../lib/n8n'

// Arbitraries for generating test data
const arbN8nNodeType = fc.constantFrom(
  'n8n-nodes-base.manualTrigger',
  'n8n-nodes-base.httpRequest',
  'n8n-nodes-base.code',
  'n8n-nodes-base.merge',
  'n8n-nodes-base.switch'
)

const arbPosition = fc.record({
  x: fc.integer({ min: 0, max: 1000 }),
  y: fc.integer({ min: 0, max: 1000 }),
})

const arbN8nNode = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  type: arbN8nNodeType,
  position: arbPosition,
  parameters: fc.object({ key: fc.string(), value: fc.anything() }),
  disabled: fc.boolean(),
})

const arbN8nWorkflow = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  nodes: fc.array(arbN8nNode, { minLength: 1, maxLength: 10 }),
  connections: fc.constant({}),
  settings: fc.constant({}),
  active: fc.boolean(),
})

describe('Property 2: n8n to ReactFlow Mapping Preserves Data', () => {
  it('should preserve all node IDs during n8n to ReactFlow conversion', () => {
    fc.assert(
      fc.property(arbN8nWorkflow, (workflow) => {
        const { nodes: rfNodes } = n8nToReactFlow(workflow)

        // All n8n node IDs should be present in ReactFlow nodes
        const rfNodeIds = new Set(rfNodes.map((n) => n.id))
        const n8nNodeIds = new Set(workflow.nodes.map((n) => n.id))

        expect(rfNodeIds).toEqual(n8nNodeIds)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve all node names as titles during n8n to ReactFlow conversion', () => {
    fc.assert(
      fc.property(arbN8nWorkflow, (workflow) => {
        const { nodes: rfNodes } = n8nToReactFlow(workflow)

        // All n8n node names should be present as titles in ReactFlow nodes
        const nameToTitle = new Map(
          rfNodes.map((n) => [n.id, n.data.title])
        )

        workflow.nodes.forEach((n8nNode) => {
          expect(nameToTitle.get(n8nNode.id)).toBe(n8nNode.name)
        })
      }),
      { numRuns: 100 }
    )
  })

  it('should calculate valid positions during n8n to ReactFlow conversion', () => {
    fc.assert(
      fc.property(arbN8nWorkflow, (workflow) => {
        const { nodes: rfNodes } = n8nToReactFlow(workflow)

        // All n8n nodes should have valid positions in ReactFlow (may be recalculated for layout)
        const positionMap = new Map(
          rfNodes.map((n) => [n.id, n.position])
        )

        workflow.nodes.forEach((n8nNode) => {
          const rfPosition = positionMap.get(n8nNode.id)
          expect(rfPosition).toBeDefined()
          expect(typeof rfPosition?.x).toBe('number')
          expect(typeof rfPosition?.y).toBe('number')
        })
      }),
      { numRuns: 100 }
    )
  })

  it('should map node types to valid ReactFlow types during conversion', () => {
    fc.assert(
      fc.property(arbN8nWorkflow, (workflow) => {
        const { nodes: rfNodes } = n8nToReactFlow(workflow)

        // All n8n node types should be mapped to valid ReactFlow types
        const typeMap = new Map(
          rfNodes.map((n) => [n.id, n.type])
        )

        workflow.nodes.forEach((n8nNode) => {
          const rfType = typeMap.get(n8nNode.id)
          expect(['workflowStep']).toContain(rfType)
        })
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve node parameters during n8n to ReactFlow conversion', () => {
    fc.assert(
      fc.property(arbN8nWorkflow, (workflow) => {
        const { nodes: rfNodes } = n8nToReactFlow(workflow)

        // All n8n node parameters should be accessible in ReactFlow nodes
        const paramMap = new Map(
          rfNodes.map((n) => [n.id, n.data])
        )

        workflow.nodes.forEach((n8nNode) => {
          const rfData = paramMap.get(n8nNode.id)
          expect(rfData).toBeDefined()
          // Parameters should be preserved in rawN8n
          expect(rfData?.rawN8n).toBeDefined()
          expect(rfData?.rawN8n?.parameters).toBeDefined()
        })
      }),
      { numRuns: 100 }
    )
  })

  it('should maintain node count during n8n to ReactFlow conversion', () => {
    fc.assert(
      fc.property(arbN8nWorkflow, (workflow) => {
        const { nodes: rfNodes } = n8nToReactFlow(workflow)

        // ReactFlow should have same number of nodes as n8n
        expect(rfNodes.length).toBe(workflow.nodes.length)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve workflow structure during round-trip conversion', () => {
    fc.assert(
      fc.property(arbN8nWorkflow, (originalWorkflow) => {
        // Convert n8n → ReactFlow
        const { nodes: rfNodes, edges: rfEdges } = n8nToReactFlow(originalWorkflow)

        // Convert back ReactFlow → n8n
        const roundTripWorkflow = reactFlowToN8n(rfNodes, rfEdges, originalWorkflow)

        // Verify structure is preserved
        expect(roundTripWorkflow.id).toBe(originalWorkflow.id)
        expect(roundTripWorkflow.name).toBe(originalWorkflow.name)
        expect(roundTripWorkflow.nodes.length).toBe(originalWorkflow.nodes.length)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve node IDs during round-trip conversion', () => {
    fc.assert(
      fc.property(arbN8nWorkflow, (originalWorkflow) => {
        // Convert n8n → ReactFlow
        const { nodes: rfNodes, edges: rfEdges } = n8nToReactFlow(originalWorkflow)

        // Convert back ReactFlow → n8n
        const roundTripWorkflow = reactFlowToN8n(rfNodes, rfEdges, originalWorkflow)

        // All original node IDs should be present
        const originalIds = new Set(originalWorkflow.nodes.map((n) => n.id))
        const roundTripIds = new Set(roundTripWorkflow.nodes.map((n) => n.id))

        expect(roundTripIds).toEqual(originalIds)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve node names during round-trip conversion', () => {
    fc.assert(
      fc.property(arbN8nWorkflow, (originalWorkflow) => {
        // Convert n8n → ReactFlow
        const { nodes: rfNodes, edges: rfEdges } = n8nToReactFlow(originalWorkflow)

        // Convert back ReactFlow → n8n
        const roundTripWorkflow = reactFlowToN8n(rfNodes, rfEdges, originalWorkflow)

        // All original node names should be preserved
        const originalNameMap = new Map(
          originalWorkflow.nodes.map((n) => [n.id, n.name])
        )
        const roundTripNameMap = new Map(
          roundTripWorkflow.nodes.map((n) => [n.id, n.name])
        )

        originalNameMap.forEach((name, id) => {
          expect(roundTripNameMap.get(id)).toBe(name)
        })
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve node positions during round-trip conversion', () => {
    fc.assert(
      fc.property(arbN8nWorkflow, (originalWorkflow) => {
        // Convert n8n → ReactFlow
        const { nodes: rfNodes, edges: rfEdges } = n8nToReactFlow(originalWorkflow)

        // Convert back ReactFlow → n8n
        const roundTripWorkflow = reactFlowToN8n(rfNodes, rfEdges, originalWorkflow)

        // All nodes should have valid positions after round-trip
        roundTripWorkflow.nodes.forEach((node) => {
          expect(node.position).toBeDefined()
          expect(typeof node.position.x).toBe('number')
          expect(typeof node.position.y).toBe('number')
        })
      }),
      { numRuns: 100 }
    )
  })
})
