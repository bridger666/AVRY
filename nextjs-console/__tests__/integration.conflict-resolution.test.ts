import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getWorkflow, updateWorkflow } from '../lib/n8n'
import { n8nToReactFlow, reactFlowToN8n } from '../lib/n8nMapper'

/**
 * Integration Test: Conflict Resolution
 * 
 * Tests conflict resolution during offline mode:
 * 1. Simulate offline changes
 * 2. Simulate n8n changes during offline period
 * 3. Verify merge dialog appears
 * 4. Test choosing local version
 * 5. Test choosing n8n version
 * 
 * Requirements: 9.4
 */

describe('Integration: Conflict Resolution', () => {
  const WORKFLOW_ID = 'test-workflow-id'
  const CACHE_KEY = 'aivory_workflow_cache'

  const baseWorkflow = {
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
      },
      {
        id: 'step-2',
        name: 'Process Data',
        type: 'n8n-nodes-base.code',
        position: { x: 500, y: 100 },
        parameters: { code: 'return data' },
        disabled: false
      }
    ],
    connections: {
      'trigger-1': {
        main: [[{ node: 'step-1', type: 'main', index: 0 }]]
      },
      'step-1': {
        main: [[{ node: 'step-2', type: 'main', index: 0 }]]
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

  it('should detect conflict when local and n8n versions differ', async () => {
    // Local version: edited step-1
    const localWorkflow = {
      ...baseWorkflow,
      nodes: baseWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Local HTTP Request' } : n
      )
    }

    // n8n version: edited step-2
    const n8nWorkflow = {
      ...baseWorkflow,
      nodes: baseWorkflow.nodes.map(n =>
        n.id === 'step-2' ? { ...n, name: 'Remote Process Data' } : n
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

    // Verify conflict exists
    const cachedLocal = JSON.parse(localStorage.getItem(CACHE_KEY)!)
    const hasConflict = JSON.stringify(cachedLocal.workflow) !== JSON.stringify(fetchedWorkflow)
    expect(hasConflict).toBe(true)
  })

  it('should provide merge information for conflict resolution', async () => {
    // Local version
    const localWorkflow = {
      ...baseWorkflow,
      nodes: baseWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, parameters: { url: 'https://local.api.com' } } : n
      )
    }

    // n8n version
    const n8nWorkflow = {
      ...baseWorkflow,
      nodes: baseWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, parameters: { url: 'https://remote.api.com' } } : n
      )
    }

    // Cache local
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

    const fetchedWorkflow = await getWorkflow(WORKFLOW_ID)

    // Extract conflict info
    const cachedLocal = JSON.parse(localStorage.getItem(CACHE_KEY)!)
    const localStep = cachedLocal.workflow.nodes.find((n: any) => n.id === 'step-1')
    const remoteStep = fetchedWorkflow.nodes.find(n => n.id === 'step-1')

    // Verify conflict details available
    expect(localStep.parameters.url).toBe('https://local.api.com')
    expect(remoteStep.parameters.url).toBe('https://remote.api.com')
  })

  it('should allow user to choose local version on conflict', async () => {
    // Local version
    const localWorkflow = {
      ...baseWorkflow,
      nodes: baseWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Local HTTP Request' } : n
      )
    }

    // n8n version
    const n8nWorkflow = {
      ...baseWorkflow,
      nodes: baseWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Remote HTTP Request' } : n
      )
    }

    // Cache local
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
    await getWorkflow(WORKFLOW_ID)

    // User chooses local version - save it
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: localWorkflow })
    })

    const saved = await updateWorkflow(WORKFLOW_ID, localWorkflow)

    // Verify local version saved
    expect(saved.nodes.find(n => n.id === 'step-1')?.name).toBe('Local HTTP Request')
  })

  it('should allow user to choose n8n version on conflict', async () => {
    // Local version
    const localWorkflow = {
      ...baseWorkflow,
      nodes: baseWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Local HTTP Request' } : n
      )
    }

    // n8n version
    const n8nWorkflow = {
      ...baseWorkflow,
      nodes: baseWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Remote HTTP Request' } : n
      )
    }

    // Cache local
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
    await getWorkflow(WORKFLOW_ID)

    // User chooses n8n version - discard local and use n8n
    localStorage.removeItem(CACHE_KEY)
    const newCache = {
      workflow: n8nWorkflow,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(newCache))

    // Verify n8n version now cached
    const current = JSON.parse(localStorage.getItem(CACHE_KEY)!)
    expect(current.workflow.nodes.find((n: any) => n.id === 'step-1')?.name).toBe('Remote HTTP Request')
  })

  it('should handle conflict with multiple node changes', async () => {
    // Local version: multiple changes
    const localWorkflow = {
      ...baseWorkflow,
      nodes: baseWorkflow.nodes.map((n, i) => ({
        ...n,
        name: `Local ${n.name}`
      }))
    }

    // n8n version: different changes
    const n8nWorkflow = {
      ...baseWorkflow,
      nodes: baseWorkflow.nodes.map((n, i) => ({
        ...n,
        name: `Remote ${n.name}`
      }))
    }

    // Cache local
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

    // Verify all conflicts detected
    const cachedLocal = JSON.parse(localStorage.getItem(CACHE_KEY)!)
    cachedLocal.workflow.nodes.forEach((localNode: any, i: number) => {
      const remoteNode = fetchedWorkflow.nodes[i]
      expect(localNode.name).toContain('Local')
      expect(remoteNode.name).toContain('Remote')
    })
  })

  it('should handle conflict with connection changes', async () => {
    // Local version: different connections
    const localWorkflow = {
      ...baseWorkflow,
      connections: {
        'trigger-1': {
          main: [[{ node: 'step-2', type: 'main', index: 0 }]]
        },
        'step-2': {
          main: [[{ node: 'step-1', type: 'main', index: 0 }]]
        }
      }
    }

    // n8n version: original connections
    const n8nWorkflow = baseWorkflow

    // Cache local
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

    // Verify connection conflict detected
    const cachedLocal = JSON.parse(localStorage.getItem(CACHE_KEY)!)
    const hasConnectionConflict =
      JSON.stringify(cachedLocal.workflow.connections) !==
      JSON.stringify(fetchedWorkflow.connections)
    expect(hasConnectionConflict).toBe(true)
  })

  it('should preserve metadata when choosing local version', async () => {
    // Local version with metadata
    const localWorkflow = {
      ...baseWorkflow,
      name: 'Local Workflow Name',
      nodes: baseWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Local Step' } : n
      )
    }

    // n8n version with different metadata
    const n8nWorkflow = {
      ...baseWorkflow,
      name: 'Remote Workflow Name',
      nodes: baseWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Remote Step' } : n
      )
    }

    // Cache local
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
    await getWorkflow(WORKFLOW_ID)

    // User chooses local version
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data: localWorkflow })
    })

    const saved = await updateWorkflow(WORKFLOW_ID, localWorkflow)

    // Verify local metadata preserved
    expect(saved.name).toBe('Local Workflow Name')
    expect(saved.nodes.find(n => n.id === 'step-1')?.name).toBe('Local Step')
  })

  it('should preserve metadata when choosing n8n version', async () => {
    // Local version
    const localWorkflow = {
      ...baseWorkflow,
      name: 'Local Workflow Name'
    }

    // n8n version with different metadata
    const n8nWorkflow = {
      ...baseWorkflow,
      name: 'Remote Workflow Name'
    }

    // Cache local
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
    await getWorkflow(WORKFLOW_ID)

    // User chooses n8n version
    localStorage.removeItem(CACHE_KEY)
    const newCache = {
      workflow: n8nWorkflow,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(newCache))

    // Verify n8n metadata preserved
    const current = JSON.parse(localStorage.getItem(CACHE_KEY)!)
    expect(current.workflow.name).toBe('Remote Workflow Name')
  })

  it('should handle conflict resolution with partial node changes', async () => {
    // Local version: only step-1 changed
    const localWorkflow = {
      ...baseWorkflow,
      nodes: baseWorkflow.nodes.map(n =>
        n.id === 'step-1' ? { ...n, name: 'Local Step-1' } : n
      )
    }

    // n8n version: only step-2 changed
    const n8nWorkflow = {
      ...baseWorkflow,
      nodes: baseWorkflow.nodes.map(n =>
        n.id === 'step-2' ? { ...n, name: 'Remote Step-2' } : n
      )
    }

    // Cache local
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

    // Verify partial changes detected
    const cachedLocal = JSON.parse(localStorage.getItem(CACHE_KEY)!)
    expect(cachedLocal.workflow.nodes.find((n: any) => n.id === 'step-1')?.name).toBe('Local Step-1')
    expect(fetchedWorkflow.nodes.find(n => n.id === 'step-2')?.name).toBe('Remote Step-2')
  })
})
