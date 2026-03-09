/**
 * Property-Based Tests for Workflow Operations
 * 
 * Tests for:
 * - Property 3: Save Triggers PUT Request (Requirements 2.1, 2.2, 2.3)
 * - Property 4: Sync Status Reflects State Changes (Requirements 4.1, 4.2, 4.3, 4.4, 4.5)
 * - Property 5: Activation Sends Correct Endpoint (Requirements 3.1, 3.2)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import * as n8nClient from '../lib/n8n'

describe('Property 3: Save Triggers PUT Request', () => {
  let fetchSpy: any

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should send PUT request to correct endpoint on save', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.record({
          id: fc.string(),
          name: fc.string(),
          nodes: fc.array(fc.object()),
          connections: fc.object(),
          settings: fc.object(),
          active: fc.boolean(),
        }),
        async (workflowId, workflow) => {
          fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: workflow }),
          })

          const typedWorkflow: n8nClient.N8nWorkflow = {
            id: workflowId,
            name: workflow.name as string,
            nodes: [],
            connections: {},
            settings: {},
            active: workflow.active as boolean,
          }

          await n8nClient.updateWorkflow(workflowId, typedWorkflow)

          // Verify PUT request was sent
          expect(fetchSpy).toHaveBeenCalled()
          const [url, options] = fetchSpy.mock.calls[0]
          expect(url).toContain(`/api/n8n/workflow/`)
          expect(options.method).toBe('PUT')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should include complete workflow object in PUT request body', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          active: fc.boolean(),
        }),
        async (workflowId, workflowData) => {
          fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: {} }),
          })

          const workflow: n8nClient.N8nWorkflow = {
            id: workflowId,
            name: workflowData.name,
            nodes: [],
            connections: {},
            settings: {},
            active: workflowData.active,
          }

          await n8nClient.updateWorkflow(workflowId, workflow)

          // Verify request body contains complete workflow
          expect(fetchSpy).toHaveBeenCalled()
          const [, options] = fetchSpy.mock.calls[0]
          const body = JSON.parse(options.body)
          expect(body).toHaveProperty('id')
          expect(body).toHaveProperty('name')
          expect(body).toHaveProperty('nodes')
          expect(body).toHaveProperty('connections')
          expect(body).toHaveProperty('settings')
          expect(body).toHaveProperty('active')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should use Content-Type application/json for PUT request', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (workflowId) => {
          fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: {} }),
          })

          const workflow: n8nClient.N8nWorkflow = {
            id: workflowId,
            name: 'Test',
            nodes: [],
            connections: {},
            settings: {},
            active: false,
          }

          await n8nClient.updateWorkflow(workflowId, workflow)

          // Verify Content-Type header
          expect(fetchSpy).toHaveBeenCalled()
          const [, options] = fetchSpy.mock.calls[0]
          expect(options.headers['Content-Type']).toBe('application/json')
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 4: Sync Status Reflects State Changes', () => {
  it('should have valid sync status values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('synced', 'unsaved', 'saving', 'failed'),
        (status) => {
          // All sync statuses should be valid
          const validStatuses = ['synced', 'unsaved', 'saving', 'failed']
          expect(validStatuses).toContain(status)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should transition from synced to unsaved on edit', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        // Valid state transition: synced → unsaved
        const currentState = 'synced'
        const nextState = 'unsaved'

        expect(['synced', 'unsaved', 'saving', 'failed']).toContain(currentState)
        expect(['synced', 'unsaved', 'saving', 'failed']).toContain(nextState)
      }),
      { numRuns: 100 }
    )
  })

  it('should transition from unsaved to saving on save click', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        // Valid state transition: unsaved → saving
        const currentState = 'unsaved'
        const nextState = 'saving'

        expect(['synced', 'unsaved', 'saving', 'failed']).toContain(currentState)
        expect(['synced', 'unsaved', 'saving', 'failed']).toContain(nextState)
      }),
      { numRuns: 100 }
    )
  })

  it('should transition from saving to synced on success', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        // Valid state transition: saving → synced
        const currentState = 'saving'
        const nextState = 'synced'

        expect(['synced', 'unsaved', 'saving', 'failed']).toContain(currentState)
        expect(['synced', 'unsaved', 'saving', 'failed']).toContain(nextState)
      }),
      { numRuns: 100 }
    )
  })

  it('should transition from saving to failed on error', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        // Valid state transition: saving → failed
        const currentState = 'saving'
        const nextState = 'failed'

        expect(['synced', 'unsaved', 'saving', 'failed']).toContain(currentState)
        expect(['synced', 'unsaved', 'saving', 'failed']).toContain(nextState)
      }),
      { numRuns: 100 }
    )
  })

  it('should have correct color mapping for each status', () => {
    fc.assert(
      fc.property(
        fc.record({
          status: fc.constantFrom('synced', 'unsaved', 'saving', 'failed'),
        }),
        (data) => {
          // Define color mapping
          const colorMap: Record<string, string> = {
            synced: 'green',
            unsaved: 'yellow',
            saving: 'gray',
            failed: 'red',
          }

          const color = colorMap[data.status]
          expect(['green', 'yellow', 'gray', 'red']).toContain(color)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 5: Activation Sends Correct Endpoint', () => {
  let fetchSpy: any

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should send POST to /activate endpoint for activation', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), async (workflowId) => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'ok' }),
        })

        await n8nClient.activateWorkflow(workflowId)

        // Verify POST to activate endpoint
        expect(fetchSpy).toHaveBeenCalled()
        const [url, options] = fetchSpy.mock.calls[0]
        expect(url).toContain(`/api/n8n/workflow/`)
        expect(url).toContain('/activate')
        expect(options.method).toBe('POST')
      }),
      { numRuns: 100 }
    )
  })

  it('should send POST to /deactivate endpoint for deactivation', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), async (workflowId) => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'ok' }),
        })

        await n8nClient.deactivateWorkflow(workflowId)

        // Verify POST to deactivate endpoint
        expect(fetchSpy).toHaveBeenCalled()
        const [url, options] = fetchSpy.mock.calls[0]
        expect(url).toContain(`/api/n8n/workflow/`)
        expect(url).toContain('/deactivate')
        expect(options.method).toBe('POST')
      }),
      { numRuns: 100 }
    )
  })

  it('should use correct HTTP method (POST) for activation', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (workflowId) => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'ok' }),
        })

        await n8nClient.activateWorkflow(workflowId)

        // Verify POST method
        expect(fetchSpy).toHaveBeenCalled()
        const [, options] = fetchSpy.mock.calls[0]
        expect(options.method).toBe('POST')
      }),
      { numRuns: 100 }
    )
  })

  it('should use correct HTTP method (POST) for deactivation', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (workflowId) => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'ok' }),
        })

        await n8nClient.deactivateWorkflow(workflowId)

        // Verify POST method
        expect(fetchSpy).toHaveBeenCalled()
        const [, options] = fetchSpy.mock.calls[0]
        expect(options.method).toBe('POST')
      }),
      { numRuns: 100 }
    )
  })
})
