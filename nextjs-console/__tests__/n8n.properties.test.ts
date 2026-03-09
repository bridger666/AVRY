/**
 * Property-Based Tests for n8n Client Proxy Routes
 * 
 * **Validates: Requirements 6.6**
 * Property 12: n8n Client Uses Proxy Routes
 * 
 * For any n8n client function call, the request should target /api/n8n/... 
 * proxy routes, not direct n8n endpoints.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import * as n8nClient from '../lib/n8n'

describe('Property 12: n8n Client Uses Proxy Routes', () => {
  let fetchSpy: any

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should use /api/n8n/workflow/{id} proxy route for getWorkflow', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (workflowId) => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              id: workflowId,
              name: 'Test Workflow',
              nodes: [],
              connections: {},
              settings: {},
              active: false,
            },
          }),
        })

        await n8nClient.getWorkflow(workflowId)

        // Verify the fetch was called with the proxy route
        expect(fetchSpy).toHaveBeenCalled()
        const callUrl = fetchSpy.mock.calls[0][0]
        expect(callUrl).toContain('/api/n8n/workflow/')
        expect(callUrl).not.toContain('43.156.108.96')
        expect(callUrl).not.toContain('5678')
      }),
      { numRuns: 100 }
    )
  })

  it('should use /api/n8n/workflow/{id} proxy route for updateWorkflow', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.object({ key: fc.string(), value: fc.anything() }),
        async (workflowId, params) => {
          fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              data: {
                id: workflowId,
                name: 'Updated Workflow',
                nodes: [],
                connections: {},
                settings: {},
                active: false,
              },
            }),
          })

          const workflow: n8nClient.N8nWorkflow = {
            id: workflowId,
            name: 'Updated Workflow',
            nodes: [],
            connections: {},
            settings: {},
            active: false,
          }

          await n8nClient.updateWorkflow(workflowId, workflow)

          // Verify the fetch was called with the proxy route
          expect(fetchSpy).toHaveBeenCalled()
          const callUrl = fetchSpy.mock.calls[0][0]
          expect(callUrl).toContain('/api/n8n/workflow/')
          expect(callUrl).not.toContain('43.156.108.96')
          expect(callUrl).not.toContain('5678')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should use /api/n8n/workflow/{id}/activate proxy route for activateWorkflow', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (workflowId) => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'ok' }),
        })

        await n8nClient.activateWorkflow(workflowId)

        // Verify the fetch was called with the proxy route
        expect(fetchSpy).toHaveBeenCalled()
        const callUrl = fetchSpy.mock.calls[0][0]
        expect(callUrl).toContain('/api/n8n/workflow/')
        expect(callUrl).toContain('/activate')
        expect(callUrl).not.toContain('43.156.108.96')
        expect(callUrl).not.toContain('5678')
      }),
      { numRuns: 100 }
    )
  })

  it('should use /api/n8n/workflow/{id}/deactivate proxy route for deactivateWorkflow', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (workflowId) => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'ok' }),
        })

        await n8nClient.deactivateWorkflow(workflowId)

        // Verify the fetch was called with the proxy route
        expect(fetchSpy).toHaveBeenCalled()
        const callUrl = fetchSpy.mock.calls[0][0]
        expect(callUrl).toContain('/api/n8n/workflow/')
        expect(callUrl).toContain('/deactivate')
        expect(callUrl).not.toContain('43.156.108.96')
        expect(callUrl).not.toContain('5678')
      }),
      { numRuns: 100 }
    )
  })

  it('should use /api/n8n/workflow/{id}/executions proxy route for getExecutions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 100 }),
        async (workflowId, limit) => {
          fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [] }),
          })

          await n8nClient.getExecutions(workflowId, limit)

          // Verify the fetch was called with the proxy route
          expect(fetchSpy).toHaveBeenCalled()
          const callUrl = fetchSpy.mock.calls[0][0]
          expect(callUrl).toContain('/api/n8n/workflow/')
          expect(callUrl).toContain('/executions')
          expect(callUrl).not.toContain('43.156.108.96')
          expect(callUrl).not.toContain('5678')
        }
      ),
      { numRuns: 100 }
    )
  })
})
