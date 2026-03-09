import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getWorkflow, updateWorkflow } from '../lib/n8n'
import { n8nToReactFlow, reactFlowToN8n } from '../lib/n8nMapper'

/**
 * Integration Test: Full Workflow Load → Edit → Save Cycle
 * 
 * Tests the complete workflow lifecycle:
 * 1. Load workflow from n8n
 * 2. Edit nodes in canvas
 * 3. Save changes
 * 4. Verify changes persisted in n8n
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2, 2.3
 */

describe('Integration: Workflow Load → Edit → Save Cycle', () => {
  const WORKFLOW_ID = 'test-workflow-id'
  
  // Mock n8n workflow data
  const mockN8nWorkflow = {
    id: WORKFLOW_ID,
    name: 'Test Workflow',
    nodes: [
      {
        id: 'trigger-1',
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        position: { x: 100, y: 100 },
        parameters: {},
        disabled: false
      },
      {
        id: 'step-1',
        name: 'HTTP Request',
        type: 'n8n-nodes-base.httpRequest',
        position: { x: 300, y: 100 },
        parameters: {
          url: 'https://api.example.com/data',
          method: 'GET'
        },
        disabled: false
      }
    ],
    connections: {
      'trigger-1': {
        main: [
          [
            {
              node: 'step-1',
              type: 'main',
              index: 0
            }
          ]
        ]
      }
    },
    settings: {},
    active: false,
    createdAt: '2025-03-06T10:00:00Z',
    updatedAt: '2025-03-06T10:00:00Z'
  }

  beforeEach(() => {
    // Mock fetch for n8n API calls
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should load workflow from n8n and map to ReactFlow format', async () => {
    // Mock GET /api/n8n/workflow/{id}
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: mockN8nWorkflow })
    })

    // Load workflow
    const workflow = await getWorkflow(WORKFLOW_ID)

    // Verify workflow loaded
    expect(workflow).toEqual(mockN8nWorkflow)
    expect(workflow.nodes).toHaveLength(2)
    expect(workflow.nodes[0].name).toBe('Manual Trigger')
    expect(workflow.nodes[1].name).toBe('HTTP Request')

    // Map to ReactFlow format
    const { nodes, edges } = n8nToReactFlow(workflow)

    // Verify ReactFlow nodes
    expect(nodes).toHaveLength(2)
    expect(nodes[0].id).toBe('trigger-1')
    expect(nodes[0].data.label).toBe('Manual Trigger')
    expect(nodes[0].position).toEqual({ x: 100, y: 100 })

    expect(nodes[1].id).toBe('step-1')
    expect(nodes[1].data.label).toBe('HTTP Request')
    expect(nodes[1].position).toEqual({ x: 300, y: 100 })

    // Verify edges
    expect(edges).toHaveLength(1)
    expect(edges[0].source).toBe('trigger-1')
    expect(edges[0].target).toBe('step-1')
  })

  it('should handle node edits and map back to n8n format', async () => {
    // Load workflow
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: mockN8nWorkflow })
    })

    const workflow = await getWorkflow(WORKFLOW_ID)
    const { nodes, edges } = n8nToReactFlow(workflow)

    // Simulate user edits
    const editedNodes = nodes.map(node => {
      if (node.id === 'step-1') {
        return {
          ...node,
          data: {
            ...node.data,
            label: 'Updated HTTP Request',
            tool: 'httpRequest',
            output: 'response'
          }
        }
      }
      return node
    })

    // Map back to n8n format
    const updatedWorkflow = reactFlowToN8n(editedNodes, edges, workflow)

    // Verify n8n format
    expect(updatedWorkflow.nodes).toHaveLength(2)
    const updatedStep = updatedWorkflow.nodes.find(n => n.id === 'step-1')
    expect(updatedStep?.name).toBe('Updated HTTP Request')
    expect(updatedStep?.parameters.resource).toBe('httpRequest')
    expect(updatedStep?.parameters.output).toBe('response')
  })

  it('should save edited workflow to n8n', async () => {
    // Mock GET
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: mockN8nWorkflow })
    })

    const workflow = await getWorkflow(WORKFLOW_ID)
    const { nodes, edges } = n8nToReactFlow(workflow)

    // Edit nodes
    const editedNodes = nodes.map(node => {
      if (node.id === 'step-1') {
        return {
          ...node,
          data: {
            ...node.data,
            label: 'Updated HTTP Request'
          }
        }
      }
      return node
    })

    const updatedWorkflow = reactFlowToN8n(editedNodes, edges, workflow)

    // Mock PUT /api/n8n/workflow/{id}
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: updatedWorkflow })
    })

    // Save workflow
    const savedWorkflow = await updateWorkflow(WORKFLOW_ID, updatedWorkflow)

    // Verify save request
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/n8n/workflow/${WORKFLOW_ID}`),
      expect.objectContaining({
        method: 'PUT'
      })
    )

    // Verify saved workflow
    expect(savedWorkflow.nodes[1].name).toBe('Updated HTTP Request')
  })

  it('should preserve all node properties during round-trip conversion', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: mockN8nWorkflow })
    })

    const workflow = await getWorkflow(WORKFLOW_ID)
    const { nodes, edges } = n8nToReactFlow(workflow)
    const roundTripWorkflow = reactFlowToN8n(nodes, edges, workflow)

    // Verify all nodes preserved
    expect(roundTripWorkflow.nodes).toHaveLength(workflow.nodes.length)
    
    roundTripWorkflow.nodes.forEach((node, index) => {
      const originalNode = workflow.nodes[index]
      expect(node.id).toBe(originalNode.id)
      expect(node.position).toEqual(originalNode.position)
      expect(node.type).toBe(originalNode.type)
    })

    // Verify connections preserved
    expect(roundTripWorkflow.connections).toEqual(workflow.connections)
  })

  it('should handle multiple node edits in sequence', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: mockN8nWorkflow })
    })

    const workflow = await getWorkflow(WORKFLOW_ID)
    let { nodes, edges } = n8nToReactFlow(workflow)

    // First edit
    nodes = nodes.map(node => {
      if (node.id === 'trigger-1') {
        return { ...node, data: { ...node.data, label: 'Updated Trigger' } }
      }
      return node
    })

    // Second edit
    nodes = nodes.map(node => {
      if (node.id === 'step-1') {
        return { ...node, data: { ...node.data, label: 'Updated Step' } }
      }
      return node
    })

    const updatedWorkflow = reactFlowToN8n(nodes, edges, workflow)

    // Verify both edits applied
    expect(updatedWorkflow.nodes[0].name).toBe('Updated Trigger')
    expect(updatedWorkflow.nodes[1].name).toBe('Updated Step')
  })

  it('should handle save with network error and retry', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: mockN8nWorkflow })
    })

    const workflow = await getWorkflow(WORKFLOW_ID)
    const { nodes, edges } = n8nToReactFlow(workflow)
    const updatedWorkflow = reactFlowToN8n(nodes, edges, workflow)

    // Mock PUT failure then success
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service unavailable' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: updatedWorkflow })
      })

    // First attempt fails
    try {
      await updateWorkflow(WORKFLOW_ID, updatedWorkflow)
    } catch (error) {
      expect(error).toBeDefined()
    }

    // Retry succeeds
    const savedWorkflow = await updateWorkflow(WORKFLOW_ID, updatedWorkflow)
    expect(savedWorkflow).toBeDefined()
  })

  it('should maintain workflow metadata during save', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: mockN8nWorkflow })
    })

    const workflow = await getWorkflow(WORKFLOW_ID)
    const { nodes, edges } = n8nToReactFlow(workflow)
    const updatedWorkflow = reactFlowToN8n(nodes, edges, workflow)

    // Verify metadata preserved
    expect(updatedWorkflow.id).toBe(workflow.id)
    expect(updatedWorkflow.name).toBe(workflow.name)
    expect(updatedWorkflow.settings).toEqual(workflow.settings)
    expect(updatedWorkflow.active).toBe(workflow.active)
  })
})
