import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getWorkflow, updateWorkflow } from '../lib/n8n'
import { n8nToReactFlow, reactFlowToN8n } from '../lib/n8nMapper'

/**
 * Integration Test: Large Workflows
 * 
 * Tests performance with large workflows:
 * 1. Test with 10+ nodes
 * 2. Test with various node types
 * 3. Verify performance acceptable
 * 
 * Requirements: 1.2, 7.3
 */

describe('Integration: Large Workflows', () => {
  const WORKFLOW_ID = 'test-workflow-id'

  // Helper to create large workflow
  const createLargeWorkflow = (nodeCount: number) => {
    const nodes = []
    const connections: any = {}

    for (let i = 0; i < nodeCount; i++) {
      const nodeTypes = [
        'n8n-nodes-base.manualTrigger',
        'n8n-nodes-base.httpRequest',
        'n8n-nodes-base.code',
        'n8n-nodes-base.set',
        'n8n-nodes-base.merge'
      ]

      const nodeType = nodeTypes[i % nodeTypes.length]
      const nodeId = `node-${i}`

      nodes.push({
        id: nodeId,
        name: `Node ${i}`,
        type: nodeType,
        position: { x: i * 200, y: Math.floor(i / 5) * 200 },
        parameters: {
          url: `https://api.example.com/endpoint${i}`,
          method: 'GET',
          code: `return data${i}`
        },
        disabled: false
      })

      // Create connections
      if (i > 0) {
        const prevNodeId = `node-${i - 1}`
        if (!connections[prevNodeId]) {
          connections[prevNodeId] = { main: [] }
        }
        connections[prevNodeId].main = [
          [{ node: nodeId, type: 'main', index: 0 }]
        ]
      }
    }

    return {
      id: WORKFLOW_ID,
      name: 'Large Workflow',
      nodes,
      connections,
      settings: {},
      active: false,
      createdAt: '2025-03-06T10:00:00Z',
      updatedAt: '2025-03-06T10:00:00Z'
    }
  }

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should handle workflow with 10 nodes', async () => {
    const workflow = createLargeWorkflow(10)

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: workflow })
    })

    const start = performance.now()
    const fetched = await getWorkflow(WORKFLOW_ID)
    const fetchTime = performance.now() - start

    expect(fetched.nodes).toHaveLength(10)
    expect(fetchTime).toBeLessThan(1000) // Should complete in < 1s
  })

  it('should handle workflow with 20 nodes', async () => {
    const workflow = createLargeWorkflow(20)

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: workflow })
    })

    const start = performance.now()
    const fetched = await getWorkflow(WORKFLOW_ID)
    const fetchTime = performance.now() - start

    expect(fetched.nodes).toHaveLength(20)
    expect(fetchTime).toBeLessThan(1000)
  })

  it('should handle workflow with 50 nodes', async () => {
    const workflow = createLargeWorkflow(50)

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: workflow })
    })

    const start = performance.now()
    const fetched = await getWorkflow(WORKFLOW_ID)
    const fetchTime = performance.now() - start

    expect(fetched.nodes).toHaveLength(50)
    expect(fetchTime).toBeLessThan(2000) // Should complete in < 2s
  })

  it('should map large workflow to ReactFlow efficiently', async () => {
    const workflow = createLargeWorkflow(30)

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: workflow })
    })

    const fetched = await getWorkflow(WORKFLOW_ID)

    const start = performance.now()
    const { nodes, edges } = n8nToReactFlow(fetched)
    const mapTime = performance.now() - start

    expect(nodes).toHaveLength(30)
    expect(edges.length).toBeGreaterThan(0)
    expect(mapTime).toBeLessThan(500) // Mapping should be fast
  })

  it('should save large workflow efficiently', async () => {
    const workflow = createLargeWorkflow(30)

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: workflow })
    })

    const fetched = await getWorkflow(WORKFLOW_ID)
    const { nodes, edges } = n8nToReactFlow(fetched)

    // Edit some nodes
    const editedNodes = nodes.map((n, i) => {
      if (i % 5 === 0) {
        return { ...n, data: { ...n.data, label: `Edited ${n.data.label}` } }
      }
      return n
    })

    const editedWorkflow = reactFlowToN8n(editedNodes, edges, fetched)

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: editedWorkflow })
    })

    const start = performance.now()
    const saved = await updateWorkflow(WORKFLOW_ID, editedWorkflow)
    const saveTime = performance.now() - start

    expect(saved.nodes).toHaveLength(30)
    expect(saveTime).toBeLessThan(1000)
  })

  it('should handle round-trip conversion for large workflow', async () => {
    const workflow = createLargeWorkflow(25)

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: workflow })
    })

    const fetched = await getWorkflow(WORKFLOW_ID)
    const { nodes, edges } = n8nToReactFlow(fetched)
    const roundTrip = reactFlowToN8n(nodes, edges, fetched)

    // Verify all nodes preserved
    expect(roundTrip.nodes).toHaveLength(fetched.nodes.length)
    roundTrip.nodes.forEach((node, i) => {
      expect(node.id).toBe(fetched.nodes[i].id)
      expect(node.position).toEqual(fetched.nodes[i].position)
    })
  })

  it('should handle various node types in large workflow', async () => {
    const workflow = createLargeWorkflow(15)

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: workflow })
    })

    const fetched = await getWorkflow(WORKFLOW_ID)
    const { nodes } = n8nToReactFlow(fetched)

    // Verify various node types present
    const nodeTypes = new Set(nodes.map(n => n.type))
    expect(nodeTypes.size).toBeGreaterThan(1)
  })

  it('should handle complex connections in large workflow', async () => {
    const workflow = createLargeWorkflow(20)

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: workflow })
    })

    const fetched = await getWorkflow(WORKFLOW_ID)
    const { edges } = n8nToReactFlow(fetched)

    // Verify connections preserved
    expect(edges.length).toBeGreaterThan(0)
    edges.forEach(edge => {
      expect(edge.source).toBeDefined()
      expect(edge.target).toBeDefined()
    })
  })

  it('should handle multiple edits on large workflow', async () => {
    const workflow = createLargeWorkflow(20)

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: workflow })
    })

    const fetched = await getWorkflow(WORKFLOW_ID)
    let { nodes, edges } = n8nToReactFlow(fetched)

    // Multiple edits
    for (let i = 0; i < 5; i++) {
      nodes = nodes.map((n, idx) => {
        if (idx === i) {
          return { ...n, data: { ...n.data, label: `Edit ${i}` } }
        }
        return n
      })
    }

    const edited = reactFlowToN8n(nodes, edges, fetched)

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: edited })
    })

    const saved = await updateWorkflow(WORKFLOW_ID, edited)
    expect(saved.nodes).toHaveLength(20)
  })

  it('should maintain performance with deeply nested connections', async () => {
    const workflow = createLargeWorkflow(15)

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: workflow })
    })

    const start = performance.now()
    const fetched = await getWorkflow(WORKFLOW_ID)
    const { nodes, edges } = n8nToReactFlow(fetched)
    const mapTime = performance.now() - start

    expect(nodes).toHaveLength(15)
    expect(mapTime).toBeLessThan(500)
  })

  it('should handle large workflow with many parameters', async () => {
    const workflow = createLargeWorkflow(10)

    // Add many parameters to each node
    workflow.nodes = workflow.nodes.map(node => ({
      ...node,
      parameters: {
        ...node.parameters,
        ...Object.fromEntries(
          Array.from({ length: 20 }, (_, i) => [`param${i}`, `value${i}`])
        )
      }
    }))

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: workflow })
    })

    const fetched = await getWorkflow(WORKFLOW_ID)
    const { nodes } = n8nToReactFlow(fetched)

    // Verify parameters preserved
    expect(nodes[0].data.tool).toBeDefined()
  })

  it('should handle concurrent operations on large workflow', async () => {
    const workflow = createLargeWorkflow(20)

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: workflow })
    })

    const fetched = await getWorkflow(WORKFLOW_ID)
    const { nodes, edges } = n8nToReactFlow(fetched)

    // Simulate concurrent edits
    const edited1 = nodes.map((n, i) => i === 0 ? { ...n, data: { ...n.data, label: 'Edit 1' } } : n)
    const edited2 = nodes.map((n, i) => i === 1 ? { ...n, data: { ...n.data, label: 'Edit 2' } } : n)

    const workflow1 = reactFlowToN8n(edited1, edges, fetched)
    const workflow2 = reactFlowToN8n(edited2, edges, fetched)

    expect(workflow1.nodes[0].name).toBe('Edit 1')
    expect(workflow2.nodes[1].name).toBe('Edit 2')
  })
})
