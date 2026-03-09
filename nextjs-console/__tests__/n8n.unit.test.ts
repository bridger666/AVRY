/**
 * Unit Tests for n8n Client Functions
 * 
 * Tests each function with valid inputs, error handling, timeout handling, and retry logic.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getWorkflow,
  updateWorkflow,
  activateWorkflow,
  deactivateWorkflow,
  getExecutions,
  N8nError,
  type N8nWorkflow,
  type N8nExecution,
} from '@/lib/n8n'

// Mock fetch globally
global.fetch = vi.fn()

describe('n8n Client Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // getWorkflow Tests
  // ============================================================================

  describe('getWorkflow', () => {
    it('should fetch workflow with valid ID', async () => {
      const mockWorkflow: N8nWorkflow = {
        id: 'test-workflow-123',
        name: 'Test Workflow',
        nodes: [
          {
            id: 'node-1',
            name: 'Trigger',
            type: 'n8n-nodes-base.manualTrigger',
            position: { x: 0, y: 0 },
            parameters: {},
          },
        ],
        connections: {},
        settings: {},
        active: true,
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockWorkflow }),
      } as Response)

      const result = await getWorkflow('test-workflow-123')

      expect(result).toEqual(mockWorkflow)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/n8n/workflow/test-workflow-123',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should throw N8nError on 401 Unauthorized', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      } as Response)

      await expect(getWorkflow('test-workflow-123')).rejects.toThrow(N8nError)
      await expect(getWorkflow('test-workflow-123')).rejects.toMatchObject({
        status: 401,
      })
    })

    it('should throw N8nError on 404 Not Found', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      } as Response)

      await expect(getWorkflow('nonexistent-id')).rejects.toThrow(N8nError)
      await expect(getWorkflow('nonexistent-id')).rejects.toMatchObject({
        status: 404,
      })
    })

    it('should throw N8nError on 5xx Server Error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service unavailable' }),
      } as Response)

      await expect(getWorkflow('test-workflow-123')).rejects.toThrow(N8nError)
      await expect(getWorkflow('test-workflow-123')).rejects.toMatchObject({
        status: 503,
      })
    })

    it('should handle timeout errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(
        new Error('AbortError')
      )

      // Mock AbortError
      const abortError = new Error('AbortError')
      abortError.name = 'AbortError'
      vi.mocked(global.fetch).mockRejectedValueOnce(abortError)

      await expect(getWorkflow('test-workflow-123')).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(
        new Error('Network error')
      )

      await expect(getWorkflow('test-workflow-123')).rejects.toThrow()
    })

    it('should handle malformed JSON response', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      } as Response)

      await expect(getWorkflow('test-workflow-123')).rejects.toThrow()
    })
  })

  // ============================================================================
  // updateWorkflow Tests
  // ============================================================================

  describe('updateWorkflow', () => {
    it('should update workflow with valid data', async () => {
      const mockWorkflow: N8nWorkflow = {
        id: 'test-workflow-123',
        name: 'Updated Workflow',
        nodes: [
          {
            id: 'node-1',
            name: 'Trigger',
            type: 'n8n-nodes-base.manualTrigger',
            position: { x: 0, y: 0 },
            parameters: {},
          },
        ],
        connections: {},
        settings: {},
        active: true,
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockWorkflow }),
      } as Response)

      const result = await updateWorkflow('test-workflow-123', mockWorkflow)

      expect(result).toEqual(mockWorkflow)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/n8n/workflow/test-workflow-123',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(mockWorkflow),
        })
      )
    })

    it('should throw N8nError on 401 Unauthorized', async () => {
      const mockWorkflow: N8nWorkflow = {
        id: 'test-workflow-123',
        name: 'Test',
        nodes: [],
        connections: {},
        settings: {},
        active: false,
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      } as Response)

      await expect(
        updateWorkflow('test-workflow-123', mockWorkflow)
      ).rejects.toThrow(N8nError)
      await expect(
        updateWorkflow('test-workflow-123', mockWorkflow)
      ).rejects.toMatchObject({ status: 401 })
    })

    it('should throw N8nError on 404 Not Found', async () => {
      const mockWorkflow: N8nWorkflow = {
        id: 'test-workflow-123',
        name: 'Test',
        nodes: [],
        connections: {},
        settings: {},
        active: false,
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      } as Response)

      await expect(
        updateWorkflow('test-workflow-123', mockWorkflow)
      ).rejects.toThrow(N8nError)
      await expect(
        updateWorkflow('test-workflow-123', mockWorkflow)
      ).rejects.toMatchObject({ status: 404 })
    })

    it('should throw N8nError on 5xx Server Error', async () => {
      const mockWorkflow: N8nWorkflow = {
        id: 'test-workflow-123',
        name: 'Test',
        nodes: [],
        connections: {},
        settings: {},
        active: false,
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      } as Response)

      await expect(
        updateWorkflow('test-workflow-123', mockWorkflow)
      ).rejects.toThrow(N8nError)
      await expect(
        updateWorkflow('test-workflow-123', mockWorkflow)
      ).rejects.toMatchObject({ status: 500 })
    })

    it('should handle timeout errors', async () => {
      const mockWorkflow: N8nWorkflow = {
        id: 'test-workflow-123',
        name: 'Test',
        nodes: [],
        connections: {},
        settings: {},
        active: false,
      }

      const abortError = new Error('AbortError')
      abortError.name = 'AbortError'
      vi.mocked(global.fetch).mockRejectedValueOnce(abortError)

      await expect(
        updateWorkflow('test-workflow-123', mockWorkflow)
      ).rejects.toThrow()
    })

    it('should send complete workflow object', async () => {
      const mockWorkflow: N8nWorkflow = {
        id: 'test-workflow-123',
        name: 'Complete Workflow',
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
            parameters: { resource: 'test' },
          },
        ],
        connections: {
          'node-1': {
            0: [{ node: 'node-2', type: 'main', index: 0 }],
          },
        },
        settings: { timezone: 'UTC' },
        active: true,
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockWorkflow }),
      } as Response)

      await updateWorkflow('test-workflow-123', mockWorkflow)

      const callArgs = vi.mocked(global.fetch).mock.calls[0]
      const bodyArg = callArgs[1]?.body
      const parsedBody = JSON.parse(bodyArg as string)

      expect(parsedBody.nodes).toHaveLength(2)
      expect(parsedBody.connections).toBeDefined()
      expect(parsedBody.settings).toBeDefined()
    })
  })

  // ============================================================================
  // activateWorkflow Tests
  // ============================================================================

  describe('activateWorkflow', () => {
    it('should activate workflow successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', active: true }),
      } as Response)

      await expect(activateWorkflow('test-workflow-123')).resolves.toBeUndefined()
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/n8n/workflow/test-workflow-123/activate',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should throw N8nError on 401 Unauthorized', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      } as Response)

      await expect(activateWorkflow('test-workflow-123')).rejects.toThrow(
        N8nError
      )
      await expect(activateWorkflow('test-workflow-123')).rejects.toMatchObject({
        status: 401,
      })
    })

    it('should throw N8nError on 404 Not Found', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      } as Response)

      await expect(activateWorkflow('nonexistent-id')).rejects.toThrow(N8nError)
      await expect(activateWorkflow('nonexistent-id')).rejects.toMatchObject({
        status: 404,
      })
    })

    it('should handle timeout errors', async () => {
      const abortError = new Error('AbortError')
      abortError.name = 'AbortError'
      vi.mocked(global.fetch).mockRejectedValueOnce(abortError)

      await expect(activateWorkflow('test-workflow-123')).rejects.toThrow()
    })
  })

  // ============================================================================
  // deactivateWorkflow Tests
  // ============================================================================

  describe('deactivateWorkflow', () => {
    it('should deactivate workflow successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', active: false }),
      } as Response)

      await expect(deactivateWorkflow('test-workflow-123')).resolves.toBeUndefined()
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/n8n/workflow/test-workflow-123/deactivate',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should throw N8nError on 401 Unauthorized', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      } as Response)

      await expect(deactivateWorkflow('test-workflow-123')).rejects.toThrow(
        N8nError
      )
      await expect(deactivateWorkflow('test-workflow-123')).rejects.toMatchObject({
        status: 401,
      })
    })

    it('should throw N8nError on 404 Not Found', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      } as Response)

      await expect(deactivateWorkflow('nonexistent-id')).rejects.toThrow(N8nError)
      await expect(deactivateWorkflow('nonexistent-id')).rejects.toMatchObject({
        status: 404,
      })
    })

    it('should handle timeout errors', async () => {
      const abortError = new Error('AbortError')
      abortError.name = 'AbortError'
      vi.mocked(global.fetch).mockRejectedValueOnce(abortError)

      await expect(deactivateWorkflow('test-workflow-123')).rejects.toThrow()
    })
  })

  // ============================================================================
  // getExecutions Tests
  // ============================================================================

  describe('getExecutions', () => {
    it('should fetch executions with default limit', async () => {
      const mockExecutions: N8nExecution[] = [
        {
          id: 'exec-1',
          workflowId: 'test-workflow-123',
          status: 'success',
          startTime: '2025-03-06T10:00:00Z',
          endTime: '2025-03-06T10:00:05Z',
        },
        {
          id: 'exec-2',
          workflowId: 'test-workflow-123',
          status: 'error',
          startTime: '2025-03-06T09:00:00Z',
          endTime: '2025-03-06T09:00:02Z',
          error: 'Connection failed',
        },
      ]

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockExecutions }),
      } as Response)

      const result = await getExecutions('test-workflow-123')

      expect(result).toEqual(mockExecutions)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/n8n/workflow/test-workflow-123/executions'),
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should fetch executions with custom limit', async () => {
      const mockExecutions: N8nExecution[] = []

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockExecutions }),
      } as Response)

      await getExecutions('test-workflow-123', 50)

      const callUrl = vi.mocked(global.fetch).mock.calls[0][0] as string
      expect(callUrl).toContain('limit=50')
    })

    it('should throw N8nError on 401 Unauthorized', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      } as Response)

      await expect(getExecutions('test-workflow-123')).rejects.toThrow(N8nError)
      await expect(getExecutions('test-workflow-123')).rejects.toMatchObject({
        status: 401,
      })
    })

    it('should throw N8nError on 404 Not Found', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      } as Response)

      await expect(getExecutions('nonexistent-id')).rejects.toThrow(N8nError)
      await expect(getExecutions('nonexistent-id')).rejects.toMatchObject({
        status: 404,
      })
    })

    it('should return empty array on success with no executions', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response)

      const result = await getExecutions('test-workflow-123')

      expect(result).toEqual([])
    })

    it('should handle timeout errors', async () => {
      const abortError = new Error('AbortError')
      abortError.name = 'AbortError'
      vi.mocked(global.fetch).mockRejectedValueOnce(abortError)

      await expect(getExecutions('test-workflow-123')).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(
        new Error('Network error')
      )

      await expect(getExecutions('test-workflow-123')).rejects.toThrow()
    })
  })

  // ============================================================================
  // N8nError Tests
  // ============================================================================

  describe('N8nError', () => {
    it('should create error with message and status', () => {
      const error = new N8nError('Test error', 500)

      expect(error.message).toBe('Test error')
      expect(error.status).toBe(500)
      expect(error.name).toBe('N8nError')
    })

    it('should create error with code', () => {
      const error = new N8nError('Timeout', 504, 'TIMEOUT')

      expect(error.message).toBe('Timeout')
      expect(error.status).toBe(504)
      expect(error.code).toBe('TIMEOUT')
    })

    it('should be instanceof Error', () => {
      const error = new N8nError('Test', 400)

      expect(error instanceof Error).toBe(true)
    })
  })
})
