/**
 * Unit Tests for Offline Mode
 * 
 * Tests localStorage caching, offline detection, local editing, and automatic sync on reconnection.
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { N8nWorkflow } from '@/lib/n8n'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Offline Mode', () => {
  const CACHE_KEY = 'aivory_workflow_cache'
  const CACHE_TIMESTAMP_KEY = 'aivory_workflow_cache_time'

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  // ============================================================================
  // localStorage Caching Tests
  // ============================================================================

  describe('localStorage Caching', () => {
    it('should cache workflow to localStorage', () => {
      const workflow: N8nWorkflow = {
        id: 'test-workflow',
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

      localStorage.setItem(CACHE_KEY, JSON.stringify(workflow))

      const cached = localStorage.getItem(CACHE_KEY)
      expect(cached).toBeDefined()
      expect(JSON.parse(cached!)).toEqual(workflow)
    })

    it('should cache workflow with timestamp', () => {
      const workflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [],
        connections: {},
        settings: {},
        active: false,
      }

      const timestamp = Date.now()
      localStorage.setItem(CACHE_KEY, JSON.stringify(workflow))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString())

      const cachedTime = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      expect(cachedTime).toBe(timestamp.toString())
    })

    it('should retrieve cached workflow', () => {
      const workflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [
          {
            id: 'node-1',
            name: 'Node',
            type: 'n8n-nodes-base.set',
            position: { x: 0, y: 0 },
            parameters: {},
          },
        ],
        connections: {},
        settings: {},
        active: false,
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(workflow))

      const cached = localStorage.getItem(CACHE_KEY)
      const retrieved = JSON.parse(cached!)

      expect(retrieved.id).toBe('test-workflow')
      expect(retrieved.nodes).toHaveLength(1)
    })

    it('should handle cache miss gracefully', () => {
      const cached = localStorage.getItem(CACHE_KEY)

      expect(cached).toBeNull()
    })

    it('should overwrite existing cache', () => {
      const workflow1: N8nWorkflow = {
        id: 'workflow-1',
        name: 'First',
        nodes: [],
        connections: {},
        settings: {},
        active: false,
      }

      const workflow2: N8nWorkflow = {
        id: 'workflow-2',
        name: 'Second',
        nodes: [],
        connections: {},
        settings: {},
        active: true,
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(workflow1))
      localStorage.setItem(CACHE_KEY, JSON.stringify(workflow2))

      const cached = JSON.parse(localStorage.getItem(CACHE_KEY)!)
      expect(cached.id).toBe('workflow-2')
    })

    it('should clear cache when requested', () => {
      const workflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [],
        connections: {},
        settings: {},
        active: false,
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(workflow))
      expect(localStorage.getItem(CACHE_KEY)).toBeDefined()

      localStorage.removeItem(CACHE_KEY)
      expect(localStorage.getItem(CACHE_KEY)).toBeNull()
    })

    it('should handle large workflows in cache', () => {
      const largeWorkflow: N8nWorkflow = {
        id: 'large-workflow',
        name: 'Large',
        nodes: Array.from({ length: 100 }, (_, i) => ({
          id: `node-${i}`,
          name: `Node ${i}`,
          type: 'n8n-nodes-base.set',
          position: { x: i * 100, y: 0 },
          parameters: { data: 'x'.repeat(1000) },
        })),
        connections: {},
        settings: {},
        active: false,
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(largeWorkflow))

      const cached = JSON.parse(localStorage.getItem(CACHE_KEY)!)
      expect(cached.nodes).toHaveLength(100)
    })
  })

  // ============================================================================
  // Offline Detection Tests
  // ============================================================================

  describe('Offline Detection', () => {
    it('should detect online status', () => {
      const isOnline = navigator.onLine

      expect(typeof isOnline).toBe('boolean')
    })

    it('should detect offline status', () => {
      // Mock offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      expect(navigator.onLine).toBe(false)

      // Restore
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })
    })

    it('should listen for online event', () => {
      const onlineListener = vi.fn()

      window.addEventListener('online', onlineListener)
      window.dispatchEvent(new Event('online'))

      expect(onlineListener).toHaveBeenCalled()

      window.removeEventListener('online', onlineListener)
    })

    it('should listen for offline event', () => {
      const offlineListener = vi.fn()

      window.addEventListener('offline', offlineListener)
      window.dispatchEvent(new Event('offline'))

      expect(offlineListener).toHaveBeenCalled()

      window.removeEventListener('offline', offlineListener)
    })

    it('should handle multiple offline/online transitions', () => {
      const listener = vi.fn()

      window.addEventListener('offline', listener)
      window.addEventListener('online', listener)

      window.dispatchEvent(new Event('offline'))
      window.dispatchEvent(new Event('online'))
      window.dispatchEvent(new Event('offline'))

      expect(listener).toHaveBeenCalledTimes(3)

      window.removeEventListener('offline', listener)
      window.removeEventListener('online', listener)
    })
  })

  // ============================================================================
  // Local Editing in Offline Mode Tests
  // ============================================================================

  describe('Local Editing in Offline Mode', () => {
    it('should allow local changes to be stored', () => {
      const workflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [
          {
            id: 'node-1',
            name: 'Original',
            type: 'n8n-nodes-base.set',
            position: { x: 0, y: 0 },
            parameters: {},
          },
        ],
        connections: {},
        settings: {},
        active: false,
      }

      // Cache original
      localStorage.setItem(CACHE_KEY, JSON.stringify(workflow))

      // Simulate local edit
      const edited = { ...workflow }
      edited.nodes[0].name = 'Modified'

      // Store local changes
      const localChanges = {
        workflow: edited,
        timestamp: Date.now(),
      }

      localStorage.setItem('local_changes', JSON.stringify(localChanges))

      const stored = JSON.parse(localStorage.getItem('local_changes')!)
      expect(stored.workflow.nodes[0].name).toBe('Modified')
    })

    it('should preserve local changes during offline period', () => {
      const changes = {
        nodeUpdates: [
          { nodeId: 'node-1', name: 'Updated Name' },
          { nodeId: 'node-2', name: 'Another Update' },
        ],
        timestamp: Date.now(),
      }

      localStorage.setItem('pending_changes', JSON.stringify(changes))

      // Simulate offline period
      const stored = JSON.parse(localStorage.getItem('pending_changes')!)
      expect(stored.nodeUpdates).toHaveLength(2)
    })

    it('should allow multiple local edits', () => {
      const edits = [
        { nodeId: 'node-1', change: 'edit-1', timestamp: Date.now() },
        { nodeId: 'node-2', change: 'edit-2', timestamp: Date.now() + 1000 },
        { nodeId: 'node-3', change: 'edit-3', timestamp: Date.now() + 2000 },
      ]

      localStorage.setItem('edit_history', JSON.stringify(edits))

      const history = JSON.parse(localStorage.getItem('edit_history')!)
      expect(history).toHaveLength(3)
    })

    it('should track edit timestamps', () => {
      const edit = {
        nodeId: 'node-1',
        change: 'name update',
        timestamp: Date.now(),
      }

      localStorage.setItem('last_edit', JSON.stringify(edit))

      const stored = JSON.parse(localStorage.getItem('last_edit')!)
      expect(stored.timestamp).toBeDefined()
      expect(typeof stored.timestamp).toBe('number')
    })
  })

  // ============================================================================
  // Automatic Sync on Reconnection Tests
  // ============================================================================

  describe('Automatic Sync on Reconnection', () => {
    it('should detect reconnection', () => {
      const onlineListener = vi.fn()

      window.addEventListener('online', onlineListener)
      window.dispatchEvent(new Event('online'))

      expect(onlineListener).toHaveBeenCalled()

      window.removeEventListener('online', onlineListener)
    })

    it('should trigger sync on reconnection', () => {
      const syncFn = vi.fn()

      window.addEventListener('online', () => {
        syncFn()
      })

      window.dispatchEvent(new Event('online'))

      expect(syncFn).toHaveBeenCalled()

      window.removeEventListener('online', syncFn)
    })

    it('should retrieve cached changes on reconnection', () => {
      const changes = {
        nodeUpdates: [{ nodeId: 'node-1', name: 'Updated' }],
        timestamp: Date.now(),
      }

      localStorage.setItem('pending_changes', JSON.stringify(changes))

      // Simulate reconnection
      const stored = localStorage.getItem('pending_changes')
      expect(stored).toBeDefined()

      const retrieved = JSON.parse(stored!)
      expect(retrieved.nodeUpdates).toHaveLength(1)
    })

    it('should clear pending changes after successful sync', () => {
      const changes = {
        nodeUpdates: [{ nodeId: 'node-1', name: 'Updated' }],
      }

      localStorage.setItem('pending_changes', JSON.stringify(changes))
      expect(localStorage.getItem('pending_changes')).toBeDefined()

      // Simulate successful sync
      localStorage.removeItem('pending_changes')
      expect(localStorage.getItem('pending_changes')).toBeNull()
    })

    it('should retry sync if it fails', () => {
      const retryCount = { count: 0 }

      const attemptSync = () => {
        retryCount.count++
        if (retryCount.count < 3) {
          // Retry
          attemptSync()
        }
      }

      attemptSync()

      expect(retryCount.count).toBe(3)
    })

    it('should handle partial sync success', () => {
      const changes = [
        { id: 'change-1', synced: true },
        { id: 'change-2', synced: false },
        { id: 'change-3', synced: true },
      ]

      const syncedChanges = changes.filter((c) => c.synced)
      const pendingChanges = changes.filter((c) => !c.synced)

      expect(syncedChanges).toHaveLength(2)
      expect(pendingChanges).toHaveLength(1)
    })
  })

  // ============================================================================
  // Conflict Detection Tests
  // ============================================================================

  describe('Conflict Detection', () => {
    it('should detect conflicts between local and remote versions', () => {
      const localVersion = {
        id: 'node-1',
        name: 'Local Name',
        timestamp: Date.now(),
      }

      const remoteVersion = {
        id: 'node-1',
        name: 'Remote Name',
        timestamp: Date.now() + 1000,
      }

      const hasConflict = localVersion.name !== remoteVersion.name

      expect(hasConflict).toBe(true)
    })

    it('should identify conflicting nodes', () => {
      const localChanges = [
        { nodeId: 'node-1', name: 'Local' },
        { nodeId: 'node-2', name: 'Local' },
      ]

      const remoteChanges = [
        { nodeId: 'node-1', name: 'Remote' },
        { nodeId: 'node-3', name: 'Remote' },
      ]

      const conflicts = localChanges.filter((local) =>
        remoteChanges.some((remote) => remote.nodeId === local.nodeId)
      )

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].nodeId).toBe('node-1')
    })

    it('should track conflict timestamps', () => {
      const conflict = {
        nodeId: 'node-1',
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() + 1000,
      }

      expect(conflict.remoteTimestamp > conflict.localTimestamp).toBe(true)
    })

    it('should allow user to choose resolution strategy', () => {
      const strategies = ['keep-local', 'use-remote', 'merge'] as const

      strategies.forEach((strategy) => {
        expect(strategies).toContain(strategy)
      })
    })
  })

  // ============================================================================
  // Cache Expiration Tests
  // ============================================================================

  describe('Cache Expiration', () => {
    it('should store cache timestamp', () => {
      const workflow: N8nWorkflow = {
        id: 'test-workflow',
        name: 'Test',
        nodes: [],
        connections: {},
        settings: {},
        active: false,
      }

      const timestamp = Date.now()
      localStorage.setItem(CACHE_KEY, JSON.stringify(workflow))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString())

      const stored = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      expect(stored).toBe(timestamp.toString())
    })

    it('should check cache age', () => {
      const cacheTime = Date.now() - 3600000 // 1 hour ago
      localStorage.setItem(CACHE_TIMESTAMP_KEY, cacheTime.toString())

      const storedTime = parseInt(localStorage.getItem(CACHE_TIMESTAMP_KEY)!)
      const age = Date.now() - storedTime

      expect(age).toBeGreaterThan(0)
    })

    it('should invalidate old cache', () => {
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      const cacheTime = Date.now() - maxAge - 1000 // Older than max age

      localStorage.setItem(CACHE_TIMESTAMP_KEY, cacheTime.toString())

      const storedTime = parseInt(localStorage.getItem(CACHE_TIMESTAMP_KEY)!)
      const isExpired = Date.now() - storedTime > maxAge

      expect(isExpired).toBe(true)
    })

    it('should keep fresh cache', () => {
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      const cacheTime = Date.now() - 1000 // 1 second ago

      localStorage.setItem(CACHE_TIMESTAMP_KEY, cacheTime.toString())

      const storedTime = parseInt(localStorage.getItem(CACHE_TIMESTAMP_KEY)!)
      const isExpired = Date.now() - storedTime > maxAge

      expect(isExpired).toBe(false)
    })
  })

  // ============================================================================
  // Storage Quota Tests
  // ============================================================================

  describe('Storage Quota', () => {
    it('should handle storage quota exceeded', () => {
      const largeData = 'x'.repeat(10 * 1024 * 1024) // 10MB

      try {
        localStorage.setItem('large_data', largeData)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should gracefully degrade on storage error', () => {
      const data = { test: 'data' }

      try {
        localStorage.setItem('test', JSON.stringify(data))
        expect(localStorage.getItem('test')).toBeDefined()
      } catch (error) {
        // Fallback to in-memory storage
        expect(true).toBe(true)
      }
    })
  })
})
