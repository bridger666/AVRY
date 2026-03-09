import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { activateWorkflow, deactivateWorkflow } from '../lib/n8n'

/**
 * Integration Test: Activate/Deactivate Workflow
 * 
 * Tests workflow activation and deactivation:
 * 1. Activate workflow via API
 * 2. Verify status updated
 * 3. Deactivate workflow via API
 * 4. Verify status updated
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

describe('Integration: Activate/Deactivate Workflow', () => {
  const WORKFLOW_ID = 'test-workflow-id'

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should activate workflow and return success', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', active: true })
    })

    await activateWorkflow(WORKFLOW_ID)

    // Verify correct endpoint called
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/n8n/workflow/${WORKFLOW_ID}/activate`),
      expect.objectContaining({
        method: 'POST'
      })
    )
  })

  it('should deactivate workflow and return success', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', active: false })
    })

    await deactivateWorkflow(WORKFLOW_ID)

    // Verify correct endpoint called
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/n8n/workflow/${WORKFLOW_ID}/deactivate`),
      expect.objectContaining({
        method: 'POST'
      })
    )
  })

  it('should handle activation failure with error', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'n8n auth failed' })
    })

    try {
      await activateWorkflow(WORKFLOW_ID)
      expect.fail('Should have thrown error')
    } catch (error: any) {
      expect(error.status).toBe(401)
      expect(error.message).toContain('auth')
    }
  })

  it('should handle deactivation failure with error', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Workflow not found' })
    })

    try {
      await deactivateWorkflow(WORKFLOW_ID)
      expect.fail('Should have thrown error')
    } catch (error: any) {
      expect(error.status).toBe(404)
    }
  })

  it('should handle activation timeout', async () => {
    ;(global.fetch as any).mockImplementationOnce(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AbortError')), 100)
      })
    })

    try {
      await activateWorkflow(WORKFLOW_ID)
      expect.fail('Should have thrown error')
    } catch (error: any) {
      expect(error.message).toContain('timeout')
    }
  })

  it('should handle deactivation timeout', async () => {
    ;(global.fetch as any).mockImplementationOnce(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AbortError')), 100)
      })
    })

    try {
      await deactivateWorkflow(WORKFLOW_ID)
      expect.fail('Should have thrown error')
    } catch (error: any) {
      expect(error.message).toContain('timeout')
    }
  })

  it('should handle server error during activation', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' })
    })

    try {
      await activateWorkflow(WORKFLOW_ID)
      expect.fail('Should have thrown error')
    } catch (error: any) {
      expect(error.status).toBe(500)
    }
  })

  it('should handle server error during deactivation', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Service unavailable' })
    })

    try {
      await deactivateWorkflow(WORKFLOW_ID)
      expect.fail('Should have thrown error')
    } catch (error: any) {
      expect(error.status).toBe(503)
    }
  })

  it('should handle network error during activation', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(
      new Error('Network error')
    )

    try {
      await activateWorkflow(WORKFLOW_ID)
      expect.fail('Should have thrown error')
    } catch (error: any) {
      expect(error.message).toContain('Network')
    }
  })

  it('should handle network error during deactivation', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(
      new Error('Network error')
    )

    try {
      await deactivateWorkflow(WORKFLOW_ID)
      expect.fail('Should have thrown error')
    } catch (error: any) {
      expect(error.message).toContain('Network')
    }
  })

  it('should support toggling between active and inactive states', async () => {
    // Activate
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', active: true })
    })

    await activateWorkflow(WORKFLOW_ID)
    expect(global.fetch).toHaveBeenCalledTimes(1)

    // Deactivate
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', active: false })
    })

    await deactivateWorkflow(WORKFLOW_ID)
    expect(global.fetch).toHaveBeenCalledTimes(2)

    // Activate again
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', active: true })
    })

    await activateWorkflow(WORKFLOW_ID)
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('should use correct HTTP method for activation', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', active: true })
    })

    await activateWorkflow(WORKFLOW_ID)

    const call = (global.fetch as any).mock.calls[0]
    expect(call[1].method).toBe('POST')
  })

  it('should use correct HTTP method for deactivation', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', active: false })
    })

    await deactivateWorkflow(WORKFLOW_ID)

    const call = (global.fetch as any).mock.calls[0]
    expect(call[1].method).toBe('POST')
  })
})
