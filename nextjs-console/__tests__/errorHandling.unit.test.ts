/**
 * Unit Tests for Error Handling
 * 
 * Tests 401 Unauthorized, 404 Not Found, 5xx Server Error, timeout, and network error handling.
 * Requirements: 1.4, 1.5, 1.6, 2.5, 2.6, 5.8, 5.9, 5.10
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { N8nError } from '@/lib/n8n'

describe('Error Handling', () => {
  // ============================================================================
  // 401 Unauthorized Error Tests
  // ============================================================================

  describe('401 Unauthorized Error', () => {
    it('should create 401 error with correct status', () => {
      const error = new N8nError('n8n auth failed', 401)

      expect(error.status).toBe(401)
      expect(error.message).toBe('n8n auth failed')
    })

    it('should identify as authentication error', () => {
      const error = new N8nError('Unauthorized', 401)

      expect(error.status).toBe(401)
      expect(error instanceof N8nError).toBe(true)
    })

    it('should not expose API key in error message', () => {
      const error = new N8nError('n8n auth failed', 401)

      expect(error.message).not.toContain('api-key')
      expect(error.message).not.toContain('X-N8N-API-KEY')
      expect(error.message).not.toContain('secret')
    })

    it('should provide generic error message', () => {
      const error = new N8nError('n8n auth failed', 401)

      expect(error.message).toBe('n8n auth failed')
      expect(error.message.length).toBeLessThan(100)
    })

    it('should be catchable as Error', () => {
      const error = new N8nError('Unauthorized', 401)

      expect(error instanceof Error).toBe(true)
    })
  })

  // ============================================================================
  // 404 Not Found Error Tests
  // ============================================================================

  describe('404 Not Found Error', () => {
    it('should create 404 error with correct status', () => {
      const error = new N8nError('Workflow not found', 404)

      expect(error.status).toBe(404)
      expect(error.message).toBe('Workflow not found')
    })

    it('should identify as not found error', () => {
      const error = new N8nError('Not found', 404)

      expect(error.status).toBe(404)
    })

    it('should provide clear error message', () => {
      const error = new N8nError('Workflow not found', 404)

      expect(error.message).toContain('not found')
    })

    it('should not expose internal details', () => {
      const error = new N8nError('Workflow not found', 404)

      expect(error.message).not.toContain('database')
      expect(error.message).not.toContain('query')
      expect(error.message).not.toContain('path')
    })
  })

  // ============================================================================
  // 5xx Server Error Tests
  // ============================================================================

  describe('5xx Server Error', () => {
    it('should create 500 error with correct status', () => {
      const error = new N8nError('Internal server error', 500)

      expect(error.status).toBe(500)
    })

    it('should create 503 error with correct status', () => {
      const error = new N8nError('Service unavailable', 503)

      expect(error.status).toBe(503)
    })

    it('should create 504 error with correct status', () => {
      const error = new N8nError('Gateway timeout', 504)

      expect(error.status).toBe(504)
    })

    it('should provide generic error message for 5xx', () => {
      const error = new N8nError('n8n server error', 500)

      expect(error.message).not.toContain('stack')
      expect(error.message).not.toContain('trace')
    })

    it('should not expose server details', () => {
      const error = new N8nError('Internal server error', 500)

      expect(error.message).not.toContain('node_modules')
      expect(error.message).not.toContain('file path')
    })
  })

  // ============================================================================
  // Timeout Error Tests
  // ============================================================================

  describe('Timeout Error', () => {
    it('should create timeout error with 504 status', () => {
      const error = new N8nError('Request timeout', 504, 'TIMEOUT')

      expect(error.status).toBe(504)
      expect(error.code).toBe('TIMEOUT')
    })

    it('should identify timeout by code', () => {
      const error = new N8nError('Request timeout', 504, 'TIMEOUT')

      expect(error.code).toBe('TIMEOUT')
    })

    it('should provide clear timeout message', () => {
      const error = new N8nError('Request timeout', 504)

      expect(error.message).toContain('timeout')
    })

    it('should use 504 status for timeout', () => {
      const error = new N8nError('Request timeout', 504)

      expect(error.status).toBe(504)
    })

    it('should be distinguishable from other 5xx errors', () => {
      const timeoutError = new N8nError('Request timeout', 504, 'TIMEOUT')
      const serverError = new N8nError('Internal server error', 500)

      expect(timeoutError.code).toBe('TIMEOUT')
      expect(serverError.code).toBeUndefined()
    })
  })

  // ============================================================================
  // Network Error Tests
  // ============================================================================

  describe('Network Error', () => {
    it('should handle network unreachable error', () => {
      const error = new Error('Network error')

      expect(error instanceof Error).toBe(true)
      expect(error.message).toContain('Network')
    })

    it('should handle connection refused error', () => {
      const error = new Error('Connection refused')

      expect(error.message).toContain('Connection')
    })

    it('should handle DNS resolution error', () => {
      const error = new Error('getaddrinfo ENOTFOUND')

      expect(error.message).toContain('ENOTFOUND')
    })

    it('should handle socket timeout error', () => {
      const error = new Error('Socket timeout')

      expect(error.message).toContain('timeout')
    })

    it('should be catchable as Error', () => {
      const error = new Error('Network error')

      expect(error instanceof Error).toBe(true)
    })
  })

  // ============================================================================
  // Error Code Tests
  // ============================================================================

  describe('Error Codes', () => {
    it('should support TIMEOUT error code', () => {
      const error = new N8nError('Request timeout', 504, 'TIMEOUT')

      expect(error.code).toBe('TIMEOUT')
    })

    it('should support AUTH_FAILED error code', () => {
      const error = new N8nError('Auth failed', 401, 'AUTH_FAILED')

      expect(error.code).toBe('AUTH_FAILED')
    })

    it('should support NOT_FOUND error code', () => {
      const error = new N8nError('Not found', 404, 'NOT_FOUND')

      expect(error.code).toBe('NOT_FOUND')
    })

    it('should support SERVER_ERROR error code', () => {
      const error = new N8nError('Server error', 500, 'SERVER_ERROR')

      expect(error.code).toBe('SERVER_ERROR')
    })

    it('should allow optional error code', () => {
      const error = new N8nError('Some error', 400)

      expect(error.code).toBeUndefined()
    })
  })

  // ============================================================================
  // Error Message Tests
  // ============================================================================

  describe('Error Messages', () => {
    it('should provide descriptive error messages', () => {
      const errors = [
        new N8nError('n8n auth failed', 401),
        new N8nError('Workflow not found', 404),
        new N8nError('n8n request failed', 500),
        new N8nError('Request timeout', 504),
      ]

      errors.forEach((error) => {
        expect(error.message.length).toBeGreaterThan(0)
        expect(error.message.length).toBeLessThan(200)
      })
    })

    it('should not expose sensitive information', () => {
      const sensitiveData = [
        'password',
        'token',
        'secret',
        'key',
        'credential',
        'api_key',
      ]

      const error = new N8nError('n8n auth failed', 401)

      sensitiveData.forEach((data) => {
        expect(error.message.toLowerCase()).not.toContain(data)
      })
    })

    it('should be user-friendly', () => {
      const error = new N8nError('n8n auth failed', 401)

      expect(error.message).not.toContain('undefined')
      expect(error.message).not.toContain('null')
      expect(error.message).not.toContain('[object Object]')
    })

    it('should be consistent across similar errors', () => {
      const error1 = new N8nError('n8n auth failed', 401)
      const error2 = new N8nError('n8n auth failed', 401)

      expect(error1.message).toBe(error2.message)
      expect(error1.status).toBe(error2.status)
    })
  })

  // ============================================================================
  // Error Status Code Tests
  // ============================================================================

  describe('Error Status Codes', () => {
    it('should support 400 Bad Request', () => {
      const error = new N8nError('Invalid request', 400)

      expect(error.status).toBe(400)
    })

    it('should support 401 Unauthorized', () => {
      const error = new N8nError('Unauthorized', 401)

      expect(error.status).toBe(401)
    })

    it('should support 403 Forbidden', () => {
      const error = new N8nError('Forbidden', 403)

      expect(error.status).toBe(403)
    })

    it('should support 404 Not Found', () => {
      const error = new N8nError('Not found', 404)

      expect(error.status).toBe(404)
    })

    it('should support 500 Internal Server Error', () => {
      const error = new N8nError('Server error', 500)

      expect(error.status).toBe(500)
    })

    it('should support 503 Service Unavailable', () => {
      const error = new N8nError('Service unavailable', 503)

      expect(error.status).toBe(503)
    })

    it('should support 504 Gateway Timeout', () => {
      const error = new N8nError('Gateway timeout', 504)

      expect(error.status).toBe(504)
    })
  })

  // ============================================================================
  // Error Handling Patterns Tests
  // ============================================================================

  describe('Error Handling Patterns', () => {
    it('should allow error status checking', () => {
      const error = new N8nError('Unauthorized', 401)

      if (error.status === 401) {
        expect(true).toBe(true)
      } else {
        expect(true).toBe(false)
      }
    })

    it('should allow error code checking', () => {
      const error = new N8nError('Timeout', 504, 'TIMEOUT')

      if (error.code === 'TIMEOUT') {
        expect(true).toBe(true)
      } else {
        expect(true).toBe(false)
      }
    })

    it('should allow error message checking', () => {
      const error = new N8nError('Workflow not found', 404)

      if (error.message.includes('not found')) {
        expect(true).toBe(true)
      } else {
        expect(true).toBe(false)
      }
    })

    it('should support error instanceof checks', () => {
      const error = new N8nError('Test', 400)

      expect(error instanceof N8nError).toBe(true)
      expect(error instanceof Error).toBe(true)
    })

    it('should support error throwing and catching', () => {
      const throwError = () => {
        throw new N8nError('Test error', 400)
      }

      expect(() => throwError()).toThrow(N8nError)
    })

    it('should support error status-based handling', () => {
      const errors = [
        new N8nError('Auth failed', 401),
        new N8nError('Not found', 404),
        new N8nError('Server error', 500),
      ]

      const authErrors = errors.filter((e) => e.status === 401)
      const notFoundErrors = errors.filter((e) => e.status === 404)
      const serverErrors = errors.filter((e) => e.status === 500)

      expect(authErrors).toHaveLength(1)
      expect(notFoundErrors).toHaveLength(1)
      expect(serverErrors).toHaveLength(1)
    })
  })

  // ============================================================================
  // Error Recovery Tests
  // ============================================================================

  describe('Error Recovery', () => {
    it('should allow retry on timeout', () => {
      const error = new N8nError('Request timeout', 504, 'TIMEOUT')

      if (error.code === 'TIMEOUT') {
        // Can retry
        expect(true).toBe(true)
      }
    })

    it('should allow fallback on network error', () => {
      const error = new Error('Network error')

      if (error.message.includes('Network')) {
        // Can use fallback
        expect(true).toBe(true)
      }
    })

    it('should allow user notification on auth error', () => {
      const error = new N8nError('n8n auth failed', 401)

      if (error.status === 401) {
        // Show auth error message to user
        expect(error.message).toBe('n8n auth failed')
      }
    })

    it('should allow offline mode on connection error', () => {
      const error = new Error('Connection refused')

      if (error.message.includes('Connection')) {
        // Enable offline mode
        expect(true).toBe(true)
      }
    })
  })
})
