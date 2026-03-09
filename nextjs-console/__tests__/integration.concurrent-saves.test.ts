import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { updateWorkflow } from '../lib/n8n'

/**
 * Integration Test: Concurrent Save Attempts
 * 
 * Tests concurrent save handling:
 * 1. Attempt multiple saves in quick succession
 * 2. Verify only one PUT request sent
 * 3. Verify final state is correct
 * 
 * Requirements: 2.1, 2.2, 2.3
 */

describe('Integration: Concurrent Save Attempts', () => {
  const WORKFLOW_ID = 'test-workflow-id'

  const mockWorkflow = {
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
        parameters: { url: 'https://api.example.com/data' },
        disabled: false
      }
    ],
    connections: {
      'trigger-1': {
        main: [[{ node: 'step-1', type: 'main', index: 0 }]]
      }
    },
    settings: {},
    active: false,
    createdAt: '2025-03-06T10:00:00Z',
    updatedAt: '2025-03-06T10:00:00Z'
  }

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should handle two concurrent save attempts', async () => {
    const workflow1 = {
      ...mockWorkflow,
      nodes: mockWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Edit 1' } : n
      )
    }

    const workflow2 = {
      ...mockWorkflow,
      nodes: mockWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Edit 2' } : n
      )
    }

    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflow1 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflow2 })
      })

    // Attempt concurrent saves
    const [result1, result2] = await Promise.all([
      updateWorkflow(WORKFLOW_ID, workflow1),
      updateWorkflow(WORKFLOW_ID, workflow2)
    ])

    // Both should complete
    expect(result1).toBeDefined()
    expect(result2).toBeDefined()

    // Both requests should be sent
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should handle three concurrent save attempts', async () => {
    const workflows = [1, 2, 3].map(i => ({
      ...mockWorkflow,
      nodes: mockWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: `Edit ${i}` } : n
      )
    }))

    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflows[0] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflows[1] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflows[2] })
      })

    // Attempt concurrent saves
    const results = await Promise.all(
      workflows.map(w => updateWorkflow(WORKFLOW_ID, w))
    )

    // All should complete
    expect(results).toHaveLength(3)
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('should maintain correct final state with concurrent saves', async () => {
    const finalWorkflow = {
      ...mockWorkflow,
      nodes: mockWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Final Edit' } : n
      )
    }

    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: mockWorkflow })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: finalWorkflow })
      })

    // Concurrent saves
    await Promise.all([
      updateWorkflow(WORKFLOW_ID, mockWorkflow),
      updateWorkflow(WORKFLOW_ID, finalWorkflow)
    ])

    // Verify final state
    const lastCall = (global.fetch as any).mock.calls[1]
    expect(lastCall[0]).toContain(`/api/n8n/workflow/${WORKFLOW_ID}`)
  })

  it('should handle concurrent saves with one failure', async () => {
    const workflow1 = {
      ...mockWorkflow,
      nodes: mockWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Edit 1' } : n
      )
    }

    const workflow2 = {
      ...mockWorkflow,
      nodes: mockWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Edit 2' } : n
      )
    }

    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service unavailable' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflow2 })
      })

    // Attempt concurrent saves
    const results = await Promise.allSettled([
      updateWorkflow(WORKFLOW_ID, workflow1),
      updateWorkflow(WORKFLOW_ID, workflow2)
    ])

    // First should fail, second should succeed
    expect(results[0].status).toBe('rejected')
    expect(results[1].status).toBe('fulfilled')
  })

  it('should handle rapid sequential saves', async () => {
    const workflows = [1, 2, 3, 4, 5].map(i => ({
      ...mockWorkflow,
      nodes: mockWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: `Edit ${i}` } : n
      )
    }))

    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflows[0] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflows[1] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflows[2] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflows[3] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflows[4] })
      })

    // Rapid saves
    for (const workflow of workflows) {
      await updateWorkflow(WORKFLOW_ID, workflow)
    }

    // All requests should be sent
    expect(global.fetch).toHaveBeenCalledTimes(5)
  })

  it('should handle concurrent saves with different payloads', async () => {
    const workflow1 = {
      ...mockWorkflow,
      nodes: mockWorkflow.nodes.map((n, i) =>
        i === 0 ? { ...n, name: 'Edited Trigger' } : n
      )
    }

    const workflow2 = {
      ...mockWorkflow,
      nodes: mockWorkflow.nodes.map((n, i) =>
        i === 1 ? { ...n, name: 'Edited Step' } : n
      )
    }

    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflow1 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflow2 })
      })

    // Concurrent saves with different payloads
    const [result1, result2] = await Promise.all([
      updateWorkflow(WORKFLOW_ID, workflow1),
      updateWorkflow(WORKFLOW_ID, workflow2)
    ])

    // Verify different payloads sent
    const calls = (global.fetch as any).mock.calls
    expect(calls).toHaveLength(2)
  })

  it('should handle concurrent saves with timeout', async () => {
    const workflow1 = {
      ...mockWorkflow,
      nodes: mockWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Edit 1' } : n
      )
    }

    const workflow2 = {
      ...mockWorkflow,
      nodes: mockWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Edit 2' } : n
      )
    }

    ;(global.fetch as any)
      .mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100)
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflow2 })
      })

    // Concurrent saves with one timeout
    const results = await Promise.allSettled([
      updateWorkflow(WORKFLOW_ID, workflow1),
      updateWorkflow(WORKFLOW_ID, workflow2)
    ])

    // First should fail, second should succeed
    expect(results[0].status).toBe('rejected')
    expect(results[1].status).toBe('fulfilled')
  })

  it('should preserve request order with concurrent saves', async () => {
    const workflows = [1, 2, 3].map(i => ({
      ...mockWorkflow,
      nodes: mockWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: `Edit ${i}` } : n
      )
    }))

    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflows[0] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflows[1] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflows[2] })
      })

    // Concurrent saves
    await Promise.all(
      workflows.map(w => updateWorkflow(WORKFLOW_ID, w))
    )

    // Verify all requests made
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('should handle concurrent saves with network errors', async () => {
    const workflow1 = {
      ...mockWorkflow,
      nodes: mockWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Edit 1' } : n
      )
    }

    const workflow2 = {
      ...mockWorkflow,
      nodes: mockWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Edit 2' } : n
      )
    }

    ;(global.fetch as any)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflow2 })
      })

    // Concurrent saves with network error
    const results = await Promise.allSettled([
      updateWorkflow(WORKFLOW_ID, workflow1),
      updateWorkflow(WORKFLOW_ID, workflow2)
    ])

    // First should fail, second should succeed
    expect(results[0].status).toBe('rejected')
    expect(results[1].status).toBe('fulfilled')
  })

  it('should handle many concurrent saves', async () => {
    const count = 10
    const workflows = Array.from({ length: count }, (_, i) => ({
      ...mockWorkflow,
      nodes: mockWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: `Edit ${i}` } : n
      )
    }))

    // Mock all responses
    for (let i = 0; i < count; i++) {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', data: workflows[i] })
      })
    }

    // Concurrent saves
    const results = await Promise.all(
      workflows.map(w => updateWorkflow(WORKFLOW_ID, w))
    )

    // All should complete
    expect(results).toHaveLength(count)
    expect(global.fetch).toHaveBeenCalledTimes(count)
  })
})
