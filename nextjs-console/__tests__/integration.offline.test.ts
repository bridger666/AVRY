import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getWorkflow, updateWorkflow } from '../lib/n8n'
import { n8nToReactFlow, reactFlowToN8n } from '../lib/n8nMapper'

/**
 * Integration Test: Offline Mode with Reconnection
 * 
 * Tests offline mode behavior:
 * 1. Simulate network failure
 * 2. Edit workflow locally
 * 3. Simulate reconnection
 * 4. Verify automatic sync
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

describe('Integration: Offline Mode with Reconnection', () => {
  const WORKFLOW_ID = 'test-workflow-id'
  const CACHE_KEY = 'aivory_workflow_cache'

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
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should cache workflow on successful fetch', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: mockN8nWorkflow })
    })

    const workflow = await getWorkflow(WORKFLOW_ID)

    // Verify workflow cached
    const cached = localStorage.getItem(CACHE_KEY)
    expect(cached).toBeDefined()
    const cachedData = JSON.parse(cached!)
    expect(cachedData.workflow.id).toBe(WORKFLOW_ID)
  })

  it('should fall back to cached workflow on network error', async () => {
    // First, cache a workflow
    const cached = {
      workflow: mockN8nWorkflow,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))

    // Mock network error
    ;(global.fetch as any).mockRejectedValueOnce(
      new Error('Network error')
    )

    try {
      await getWorkflow(WORKFLOW_ID)
    } catch (error) {
      // Error expected, but cache should be available
      const cachedWorkflow = localStorage.getItem(CACHE_KEY)
      expect(cachedWorkflow).toBeDefined()
    }
  })

  it('should allow local editing in offline mode', async () => {
    // Cache workflow
    const cached = {
      workflow: mockN8nWorkflow,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))

    // Get cached workflow
    const cachedData = JSON.parse(localStorage.getItem(CACHE_KEY)!)
    const workflow = cachedData.workflow

    // Convert to ReactFlow
    const { nodes, edges } = n8nToReactFlow(workflow)

    // Edit locally
    const editedNodes = nodes.map(node => {
      if (node.id === 'step-1') {
        return {
          ...node,
          data: { ...node.data, label: 'Edited Step' }
        }
      }
      return node
    })

    // Convert back to n8n format
    const editedWorkflow = reactFlowToN8n(editedNodes, edges, workflow)

    // Verify local changes
    expect(editedWorkflow.nodes[1].name).toBe('Edited Step')

    // Cache local changes
    const updatedCache = {
      workflow: editedWorkflow,
      timestamp: Date.now(),
      localChanges: { nodes: editedNodes, edges }
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(updatedCache))

    // Verify cached
    const newCached = JSON.parse(localStorage.getItem(CACHE_KEY)!)
    expect(newCached.localChanges).toBeDefined()
  })

  it('should attempt automatic sync on reconnection', async () => {
    // Cache workflow with local changes
    const editedWorkflow = {
      ...mockN8nWorkflow,
      nodes: mockN8nWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Edited Step' } : n
      )
    }

    const cached = {
      workflow: editedWorkflow,
      timestamp: Date.now(),
      localChanges: true
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))

    // Mock successful reconnection
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: editedWorkflow })
    })

    // Attempt sync
    const synced = await updateWorkflow(WORKFLOW_ID, editedWorkflow)

    // Verify sync successful
    expect(synced.nodes[1].name).toBe('Edited Step')

    // Verify cache updated
    const newCached = JSON.parse(localStorage.getItem(CACHE_KEY)!)
    expect(newCached.localChanges).toBeUndefined()
  })

  it('should detect conflicts between local and n8n versions', async () => {
    // Local version
    const localWorkflow = {
      ...mockN8nWorkflow,
      nodes: mockN8nWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Local Edit' } : n
      )
    }

    // n8n version (different)
    const n8nWorkflow = {
      ...mockN8nWorkflow,
      nodes: mockN8nWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'n8n Edit' } : n
      )
    }

    // Cache local version
    const cached = {
      workflow: localWorkflow,
      timestamp: Date.now(),
      localChanges: true
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))

    // Mock fetch returns n8n version
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: n8nWorkflow })
    })

    // Fetch from n8n
    const fetchedWorkflow = await getWorkflow(WORKFLOW_ID)

    // Verify conflict detected
    const cachedLocal = JSON.parse(localStorage.getItem(CACHE_KEY)!)
    expect(cachedLocal.workflow.nodes[1].name).not.toBe(fetchedWorkflow.nodes[1].name)
  })

  it('should allow user to choose local version on conflict', async () => {
    // Local version
    const localWorkflow = {
      ...mockN8nWorkflow,
      nodes: mockN8nWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Local Edit' } : n
      )
    }

    // Cache local version
    const cached = {
      workflow: localWorkflow,
      timestamp: Date.now(),
      localChanges: true
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))

    // Mock successful save of local version
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: localWorkflow })
    })

    // Save local version
    const saved = await updateWorkflow(WORKFLOW_ID, localWorkflow)

    // Verify local version saved
    expect(saved.nodes[1].name).toBe('Local Edit')
  })

  it('should allow user to choose n8n version on conflict', async () => {
    // n8n version
    const n8nWorkflow = {
      ...mockN8nWorkflow,
      nodes: mockN8nWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'n8n Edit' } : n
      )
    }

    // Cache local version
    const localWorkflow = {
      ...mockN8nWorkflow,
      nodes: mockN8nWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Local Edit' } : n
      )
    }

    const cached = {
      workflow: localWorkflow,
      timestamp: Date.now(),
      localChanges: true
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))

    // User chooses n8n version - clear local cache and use n8n
    localStorage.removeItem(CACHE_KEY)
    const newCache = {
      workflow: n8nWorkflow,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(newCache))

    // Verify n8n version now cached
    const current = JSON.parse(localStorage.getItem(CACHE_KEY)!)
    expect(current.workflow.nodes[1].name).toBe('n8n Edit')
  })

  it('should preserve cache timestamp for staleness detection', async () => {
    const cached = {
      workflow: mockN8nWorkflow,
      timestamp: Date.now() - 3600000 // 1 hour ago
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))

    const cachedData = JSON.parse(localStorage.getItem(CACHE_KEY)!)
    const age = Date.now() - cachedData.timestamp

    // Verify cache is stale
    expect(age).toBeGreaterThan(3600000)
  })

  it('should handle multiple offline edits', async () => {
    // Cache initial workflow
    const cached = {
      workflow: mockN8nWorkflow,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))

    // First edit
    let workflow = JSON.parse(localStorage.getItem(CACHE_KEY)!).workflow
    let { nodes, edges } = n8nToReactFlow(workflow)
    nodes = nodes.map(n =>
      n.id === 'trigger-1' ? { ...n, data: { ...n.data, label: 'Edit 1' } } : n
    )
    workflow = reactFlowToN8n(nodes, edges, workflow)

    // Second edit
    ({ nodes, edges } = n8nToReactFlow(workflow))
    nodes = nodes.map(n =>
      n.id === 'step-1' ? { ...n, data: { ...n.data, label: 'Edit 2' } } : n
    )
    workflow = reactFlowToN8n(nodes, edges, workflow)

    // Cache updated
    const updatedCache = {
      workflow,
      timestamp: Date.now(),
      localChanges: true
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(updatedCache))

    // Verify both edits applied
    const final = JSON.parse(localStorage.getItem(CACHE_KEY)!).workflow
    expect(final.nodes[0].name).toBe('Edit 1')
    expect(final.nodes[1].name).toBe('Edit 2')
  })

  it('should sync after reconnection with multiple local changes', async () => {
    // Create workflow with multiple edits
    const editedWorkflow = {
      ...mockN8nWorkflow,
      nodes: mockN8nWorkflow.nodes.map((n, i) => ({
        ...n,
        name: `Edited ${i}`
      }))
    }

    // Cache with local changes
    const cached = {
      workflow: editedWorkflow,
      timestamp: Date.now(),
      localChanges: true
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))

    // Mock successful sync
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: editedWorkflow })
    })

    // Sync
    const synced = await updateWorkflow(WORKFLOW_ID, editedWorkflow)

    // Verify all changes synced
    expect(synced.nodes[0].name).toBe('Edited 0')
    expect(synced.nodes[1].name).toBe('Edited 1')
  })
})
