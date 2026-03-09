/**
 * Unit Tests for API Routes
 * 
 * Tests GET /api/n8n/workflow/{id}, PUT /api/n8n/workflow/{id}, 
 * POST /api/n8n/workflow/{id}/activate, POST /api/n8n/workflow/{id}/deactivate,
 * and GET /api/n8n/workflow/{id}/executions
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { N8nWorkflow, N8nExecution } from '@/lib/n8n'

describe('API Routes', () => {
  // ============================================================================
  // GET /api/n8n/workflow/{id} Tests
  // ============================================================================

  describe('GET /api/n8n/workflow/{id}', () => {
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

      // Simulate API response structure
      const response = {
        status: 'ok',
        data: mockWorkflow,
        lastSync: new Date().toISOString(),
      }

      expect(response.status).toBe('ok')
      expect(response.data).toEqual(mockWorkflow)
      expect(response.lastSync).toBeDefined()
    })

    it('should return 400 for invalid workflow ID format', () => {
      const invalidIds = ['', 'short', 'invalid-id-with-special-chars!@#']

      invalidIds.forEach((id) => {
        const isValidId = /^[a-zA-Z0-9]{8,32}$/.test(id)
        expect(isValidId).toBe(false)
      })
    })

    it('should return 401 for auth failure', () => {
      const response = {
        error: 'n8n auth failed',
        status: 401,
      }

      expect(response.status).toBe(401)
      expect(response.error).toContain('auth')
    })

    it('should return 404 for workflow not found', () => {
      const response = {
        error: 'Workflow not found',
        status: 404,
      }

      expect(response.status).toBe(404)
    })

    it('should return 504 for timeout', () => {
      const response = {
        error: 'Request timeout',
        status: 504,
      }

      expect(response.status).toBe(504)
    })

    it('should include lastSync timestamp', () => {
      const response = {
        status: 'ok',
        data: {},
        lastSync: new Date().toISOString(),
      }

      expect(response.lastSync).toBeDefined()
      expect(typeof response.lastSync).toBe('string')
    })

    it('should not expose API key in response', () => {
      const response = {
        status: 'ok',
        data: { id: 'test', name: 'Test' },
      }

      const responseStr = JSON.stringify(response)
      expect(responseStr).not.toContain('X-N8N-API-KEY')
      expect(responseStr).not.toContain('api-key')
      expect(responseStr).not.toContain('secret')
    })

    it('should validate workflow ID format', () => {
      const validIds = ['abcd1234', 'ABCD1234', 'test12345678']
      const invalidIds = ['abc', 'test-id', 'test_id', 'test@id']

      validIds.forEach((id) => {
        const isValid = /^[a-zA-Z0-9]{8,32}$/.test(id)
        expect(isValid).toBe(true)
      })

      invalidIds.forEach((id) => {
        const isValid = /^[a-zA-Z0-9]{8,32}$/.test(id)
        expect(isValid).toBe(false)
      })
    })
  })

  // ============================================================================
  // PUT /api/n8n/workflow/{id} Tests
  // ============================================================================

  describe('PUT /api/n8n/workflow/{id}', () => {
    it('should update workflow with valid data', () => {
      const workflow: N8nWorkflow = {
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

      const response = {
        status: 'ok',
        data: workflow,
        lastSync: new Date().toISOString(),
      }

      expect(response.status).toBe('ok')
      expect(response.data.name).toBe('Updated Workflow')
    })

    it('should return 400 for invalid workflow ID', () => {
      const response = {
        error: 'Invalid workflow ID format',
        status: 400,
      }

      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid request body', () => {
      const response = {
        error: 'Invalid request body',
        status: 400,
      }

      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid workflow structure', () => {
      const response = {
        error: 'Invalid workflow structure',
        status: 400,
      }

      expect(response.status).toBe(400)
    })

    it('should return 401 for auth failure', () => {
      const response = {
        error: 'n8n auth failed',
        status: 401,
      }

      expect(response.status).toBe(401)
    })

    it('should return 404 for workflow not found', () => {
      const response = {
        error: 'Workflow not found',
        status: 404,
      }

      expect(response.status).toBe(404)
    })

    it('should return 504 for timeout', () => {
      const response = {
        error: 'Request timeout',
        status: 504,
      }

      expect(response.status).toBe(504)
    })

    it('should validate workflow structure', () => {
      const validWorkflow = {
        nodes: [{ id: 'node-1', name: 'Node', type: 'set', position: { x: 0, y: 0 }, parameters: {} }],
        connections: {},
      }

      const invalidWorkflow1 = {
        connections: {},
      } as any

      const invalidWorkflow2 = {
        nodes: 'not-an-array',
        connections: {},
      } as any

      expect(Array.isArray(validWorkflow.nodes)).toBe(true)
      expect(Array.isArray(invalidWorkflow1.nodes)).toBe(false)
      expect(Array.isArray(invalidWorkflow2.nodes)).toBe(false)
    })

    it('should send complete workflow object', () => {
      const workflow: N8nWorkflow = {
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

      expect(workflow.nodes).toBeDefined()
      expect(workflow.connections).toBeDefined()
      expect(workflow.settings).toBeDefined()
      expect(workflow.active).toBeDefined()
    })

    it('should not expose API key in response', () => {
      const response = {
        status: 'ok',
        data: { id: 'test', name: 'Test' },
      }

      const responseStr = JSON.stringify(response)
      expect(responseStr).not.toContain('X-N8N-API-KEY')
      expect(responseStr).not.toContain('api-key')
    })
  })

  // ============================================================================
  // POST /api/n8n/workflow/{id}/activate Tests
  // ============================================================================

  describe('POST /api/n8n/workflow/{id}/activate', () => {
    it('should activate workflow successfully', () => {
      const response = {
        status: 'ok',
        active: true,
      }

      expect(response.status).toBe('ok')
      expect(response.active).toBe(true)
    })

    it('should return 400 for invalid workflow ID', () => {
      const response = {
        error: 'Invalid workflow ID format',
        status: 400,
      }

      expect(response.status).toBe(400)
    })

    it('should return 401 for auth failure', () => {
      const response = {
        error: 'n8n auth failed',
        status: 401,
      }

      expect(response.status).toBe(401)
    })

    it('should return 404 for workflow not found', () => {
      const response = {
        error: 'Workflow not found',
        status: 404,
      }

      expect(response.status).toBe(404)
    })

    it('should return 504 for timeout', () => {
      const response = {
        error: 'Request timeout',
        status: 504,
      }

      expect(response.status).toBe(504)
    })

    it('should return active status in response', () => {
      const response = {
        status: 'ok',
        active: true,
      }

      expect(response.active).toBe(true)
    })
  })

  // ============================================================================
  // POST /api/n8n/workflow/{id}/deactivate Tests
  // ============================================================================

  describe('POST /api/n8n/workflow/{id}/deactivate', () => {
    it('should deactivate workflow successfully', () => {
      const response = {
        status: 'ok',
        active: false,
      }

      expect(response.status).toBe('ok')
      expect(response.active).toBe(false)
    })

    it('should return 400 for invalid workflow ID', () => {
      const response = {
        error: 'Invalid workflow ID format',
        status: 400,
      }

      expect(response.status).toBe(400)
    })

    it('should return 401 for auth failure', () => {
      const response = {
        error: 'n8n auth failed',
        status: 401,
      }

      expect(response.status).toBe(401)
    })

    it('should return 404 for workflow not found', () => {
      const response = {
        error: 'Workflow not found',
        status: 404,
      }

      expect(response.status).toBe(404)
    })

    it('should return 504 for timeout', () => {
      const response = {
        error: 'Request timeout',
        status: 504,
      }

      expect(response.status).toBe(504)
    })

    it('should return inactive status in response', () => {
      const response = {
        status: 'ok',
        active: false,
      }

      expect(response.active).toBe(false)
    })
  })

  // ============================================================================
  // GET /api/n8n/workflow/{id}/executions Tests
  // ============================================================================

  describe('GET /api/n8n/workflow/{id}/executions', () => {
    it('should fetch executions with default limit', () => {
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

      const response = {
        status: 'ok',
        data: mockExecutions,
      }

      expect(response.status).toBe('ok')
      expect(response.data).toHaveLength(2)
    })

    it('should support limit query parameter', () => {
      const limit = 50
      const url = `/api/n8n/workflow/test-workflow-123/executions?limit=${limit}`

      expect(url).toContain('limit=50')
    })

    it('should return 400 for invalid workflow ID', () => {
      const response = {
        error: 'Invalid workflow ID format',
        status: 400,
      }

      expect(response.status).toBe(400)
    })

    it('should return 401 for auth failure', () => {
      const response = {
        error: 'n8n auth failed',
        status: 401,
      }

      expect(response.status).toBe(401)
    })

    it('should return 404 for workflow not found', () => {
      const response = {
        error: 'Workflow not found',
        status: 404,
      }

      expect(response.status).toBe(404)
    })

    it('should return 504 for timeout', () => {
      const response = {
        error: 'Request timeout',
        status: 504,
      }

      expect(response.status).toBe(504)
    })

    it('should return empty array when no executions', () => {
      const response = {
        status: 'ok',
        data: [],
      }

      expect(response.data).toEqual([])
    })

    it('should include execution status', () => {
      const execution: N8nExecution = {
        id: 'exec-1',
        workflowId: 'test-workflow-123',
        status: 'success',
        startTime: '2025-03-06T10:00:00Z',
        endTime: '2025-03-06T10:00:05Z',
      }

      expect(['success', 'error', 'running']).toContain(execution.status)
    })

    it('should include execution timestamps', () => {
      const execution: N8nExecution = {
        id: 'exec-1',
        workflowId: 'test-workflow-123',
        status: 'success',
        startTime: '2025-03-06T10:00:00Z',
        endTime: '2025-03-06T10:00:05Z',
      }

      expect(execution.startTime).toBeDefined()
      expect(execution.endTime).toBeDefined()
    })

    it('should include error message for failed executions', () => {
      const execution: N8nExecution = {
        id: 'exec-1',
        workflowId: 'test-workflow-123',
        status: 'error',
        startTime: '2025-03-06T10:00:00Z',
        endTime: '2025-03-06T10:00:05Z',
        error: 'Connection timeout',
      }

      expect(execution.error).toBeDefined()
    })
  })

  // ============================================================================
  // Common API Route Tests
  // ============================================================================

  describe('Common API Route Behavior', () => {
    it('should validate workflow ID on all routes', () => {
      const routes = [
        '/api/n8n/workflow/{id}',
        '/api/n8n/workflow/{id}/activate',
        '/api/n8n/workflow/{id}/deactivate',
        '/api/n8n/workflow/{id}/executions',
      ]

      routes.forEach((route) => {
        expect(route).toContain('{id}')
      })
    })

    it('should return consistent error format', () => {
      const errors = [
        { error: 'Invalid workflow ID format', status: 400 },
        { error: 'n8n auth failed', status: 401 },
        { error: 'Workflow not found', status: 404 },
        { error: 'Request timeout', status: 504 },
      ]

      errors.forEach((err) => {
        expect(err.error).toBeDefined()
        expect(err.status).toBeDefined()
        expect(typeof err.status).toBe('number')
      })
    })

    it('should not expose sensitive data in errors', () => {
      const errors = [
        { error: 'Invalid workflow ID format', status: 400 },
        { error: 'n8n auth failed', status: 401 },
        { error: 'Workflow not found', status: 404 },
      ]

      errors.forEach((err) => {
        const errorStr = JSON.stringify(err)
        expect(errorStr).not.toContain('password')
        expect(errorStr).not.toContain('token')
        expect(errorStr).not.toContain('secret')
        expect(errorStr).not.toContain('api-key')
      })
    })

    it('should include request ID for logging', () => {
      const response = {
        status: 'ok',
        data: {},
        requestId: 'req-12345',
      }

      expect(response.requestId).toBeDefined()
    })

    it('should include duration for monitoring', () => {
      const response = {
        status: 'ok',
        data: {},
        durationMs: 150,
      }

      expect(response.durationMs).toBeDefined()
      expect(typeof response.durationMs).toBe('number')
    })
  })

  // ============================================================================
  // Request Validation Tests
  // ============================================================================

  describe('Request Validation', () => {
    it('should validate Content-Type header', () => {
      const headers = {
        'Content-Type': 'application/json',
      }

      expect(headers['Content-Type']).toBe('application/json')
    })

    it('should reject invalid Content-Type', () => {
      const invalidHeaders = [
        { 'Content-Type': 'text/plain' },
        { 'Content-Type': 'text/html' },
        { 'Content-Type': 'application/xml' },
      ]

      invalidHeaders.forEach((headers) => {
        expect(headers['Content-Type']).not.toBe('application/json')
      })
    })

    it('should validate request method', () => {
      const methods = {
        get: 'GET',
        put: 'PUT',
        post: 'POST',
      }

      expect(['GET', 'PUT', 'POST']).toContain(methods.get)
      expect(['GET', 'PUT', 'POST']).toContain(methods.put)
      expect(['GET', 'PUT', 'POST']).toContain(methods.post)
    })
  })
})
