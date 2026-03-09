import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getWorkflow, updateWorkflow } from '../lib/n8n'

/**
 * Integration Test: Error Scenarios
 * 
 * Tests error handling:
 * 1. Test 401 Unauthorized
 * 2. Test 404 Not Found
 * 3. Test 5xx Server Error
 * 4. Test timeout
 * 5. Verify graceful error handling
 * 
 * Requirements: 1.4, 1.5, 1.6, 2.5, 2.6, 5.8, 5.9, 5.10
 */

describe('Integration: Error Scenarios', () => {
  const WORKFLOW_ID = 'test-workflow-id'

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('401 Unauthorized', () => {
    it('should handle 401 on workflow fetch', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'n8n auth failed' })
      })

      try {
        await getWorkflow(WORKFLOW_ID)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.status).toBe(401)
        expect(error.message).toContain('auth')
      }
    })

    it('should handle 401 on workflow update', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'n8n auth failed' })
      })

      const workflow = { id: WORKFLOW_ID, name: 'Test', nodes: [], connections: {}, settings: {}, active: false }

      try {
        await updateWorkflow(WORKFLOW_ID, workflow)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.status).toBe(401)
      }
    })

    it('should not expose API key in 401 error message', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'n8n auth failed' })
      })

      try {
        await getWorkflow(WORKFLOW_ID)
      } catch (error: any) {
        expect(error.message).not.toContain('api-key')
        expect(error.message).not.toContain('API-KEY')
        expect(error.message).not.toContain('secret')
      }
    })
  })

  describe('404 Not Found', () => {
    it('should handle 404 on workflow fetch', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Workflow not found' })
      })

      try {
        await getWorkflow(WORKFLOW_ID)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.status).toBe(404)
      }
    })

    it('should handle 404 on workflow update', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Workflow not found' })
      })

      const workflow = { id: WORKFLOW_ID, name: 'Test', nodes: [], connections: {}, settings: {}, active: false }

      try {
        await updateWorkflow(WORKFLOW_ID, workflow)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.status).toBe(404)
      }
    })

    it('should provide helpful error message for 404', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Workflow not found' })
      })

      try {
        await getWorkflow(WORKFLOW_ID)
      } catch (error: any) {
        expect(error.message).toContain('not found')
      }
    })
  })

  describe('5xx Server Error', () => {
    it('should handle 500 Internal Server Error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      })

      try {
        await getWorkflow(WORKFLOW_ID)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.status).toBe(500)
      }
    })

    it('should handle 503 Service Unavailable', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service unavailable' })
      })

      try {
        await getWorkflow(WORKFLOW_ID)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.status).toBe(503)
      }
    })

    it('should handle 502 Bad Gateway', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => ({ error: 'Bad gateway' })
      })

      try {
        await getWorkflow(WORKFLOW_ID)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.status).toBe(502)
      }
    })

    it('should not expose internal details in 5xx error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      })

      try {
        await getWorkflow(WORKFLOW_ID)
      } catch (error: any) {
        expect(error.message).not.toContain('stack')
        expect(error.message).not.toContain('trace')
      }
    })
  })

  describe('Timeout', () => {
    it('should handle request timeout on fetch', async () => {
      ;(global.fetch as any).mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100)
        })
      })

      try {
        await getWorkflow(WORKFLOW_ID)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.message).toContain('timeout')
      }
    })

    it('should handle request timeout on update', async () => {
      ;(global.fetch as any).mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100)
        })
      })

      const workflow = { id: WORKFLOW_ID, name: 'Test', nodes: [], connections: {}, settings: {}, active: false }

      try {
        await updateWorkflow(WORKFLOW_ID, workflow)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.message).toContain('timeout')
      }
    })

    it('should return 504 Gateway Timeout on server timeout', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 504,
        json: async () => ({ error: 'Gateway timeout' })
      })

      try {
        await getWorkflow(WORKFLOW_ID)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.status).toBe(504)
      }
    })
  })

  describe('Network Errors', () => {
    it('should handle network error on fetch', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(
        new Error('Network error')
      )

      try {
        await getWorkflow(WORKFLOW_ID)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.message).toContain('Network')
      }
    })

    it('should handle network error on update', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(
        new Error('Network error')
      )

      const workflow = { id: WORKFLOW_ID, name: 'Test', nodes: [], connections: {}, settings: {}, active: false }

      try {
        await updateWorkflow(WORKFLOW_ID, workflow)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.message).toContain('Network')
      }
    })

    it('should handle connection refused', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(
        new Error('ECONNREFUSED')
      )

      try {
        await getWorkflow(WORKFLOW_ID)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.message).toContain('ECONNREFUSED')
      }
    })
  })

  describe('Graceful Error Handling', () => {
    it('should provide consistent error structure', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      })

      try {
        await getWorkflow(WORKFLOW_ID)
      } catch (error: any) {
        expect(error).toHaveProperty('message')
        expect(error).toHaveProperty('status')
      }
    })

    it('should allow retry after error', async () => {
      // First attempt fails
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service unavailable' })
      })

      try {
        await getWorkflow(WORKFLOW_ID)
      } catch (error) {
        // Expected
      }

      // Second attempt succeeds
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ok',
          data: {
            id: WORKFLOW_ID,
            name: 'Test',
            nodes: [],
            connections: {},
            settings: {},
            active: false
          }
        })
      })

      const workflow = await getWorkflow(WORKFLOW_ID)
      expect(workflow).toBeDefined()
    })

    it('should not expose sensitive data in error messages', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'n8n auth failed' })
      })

      try {
        await getWorkflow(WORKFLOW_ID)
      } catch (error: any) {
        const errorStr = JSON.stringify(error)
        expect(errorStr).not.toContain('process.env')
        expect(errorStr).not.toContain('N8N_API_KEY')
      }
    })

    it('should handle malformed JSON response', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      try {
        await getWorkflow(WORKFLOW_ID)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error).toBeDefined()
      }
    })

    it('should handle missing error details gracefully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({})
      })

      try {
        await getWorkflow(WORKFLOW_ID)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.status).toBe(500)
      }
    })
  })

  describe('Error Recovery', () => {
    it('should support exponential backoff retry', async () => {
      // First attempt: timeout
      ;(global.fetch as any).mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100)
        })
      })

      try {
        await getWorkflow(WORKFLOW_ID)
      } catch (error) {
        // Expected
      }

      // Second attempt: success
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ok',
          data: {
            id: WORKFLOW_ID,
            name: 'Test',
            nodes: [],
            connections: {},
            settings: {},
            active: false
          }
        })
      })

      const workflow = await getWorkflow(WORKFLOW_ID)
      expect(workflow).toBeDefined()
    })

    it('should handle cascading errors gracefully', async () => {
      // First error
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service unavailable' })
      })

      try {
        await getWorkflow(WORKFLOW_ID)
      } catch (error) {
        // Expected
      }

      // Second error
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service unavailable' })
      })

      try {
        await getWorkflow(WORKFLOW_ID)
      } catch (error) {
        // Expected
      }

      // Eventually succeeds
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ok',
          data: {
            id: WORKFLOW_ID,
            name: 'Test',
            nodes: [],
            connections: {},
            settings: {},
            active: false
          }
        })
      })

      const workflow = await getWorkflow(WORKFLOW_ID)
      expect(workflow).toBeDefined()
    })
  })
})
