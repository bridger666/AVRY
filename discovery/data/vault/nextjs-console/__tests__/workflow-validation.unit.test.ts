// @ts-nocheck
/**
 * Unit Tests for Workflow Validation Utilities
 * 
 * Tests verify that all validation functions work correctly:
 * - validateTriggerExists() rejects specs without triggers
 * - validateAppConnections() rejects invalid appIds
 * - validateConnectionStatus() rejects inactive connections
 * - detectCycles() detects cycles correctly
 * - validateWorkflowSpec() orchestrator runs all validations
 */

import {
  validateTriggerExists,
  validateAppConnections,
  validateConnectionStatus,
  detectCycles,
  validateWorkflowSpec,
  ValidationError,
} from '../lib/workflowValidation'
import { AivoryWorkflowSpec, AivoryWorkflowEdge } from '../types/workflows'

describe('Workflow Validation - Unit Tests', () => {
  describe('validateTriggerExists()', () => {
    it('should pass when workflow has a trigger step', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'webhook',
            actionId: 'receive',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
        ],
      }

      const error = validateTriggerExists(spec)
      expect(error).toBeNull()
    })

    it('should fail when workflow has no trigger step', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 480 },
          },
        ],
      }

      const error = validateTriggerExists(spec)
      expect(error).not.toBeNull()
      expect(error?.field).toBe('steps')
      expect(error?.reason).toBe('Workflow must have at least one trigger step')
    })

    it('should fail when workflow has empty steps array', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [],
      }

      const error = validateTriggerExists(spec)
      expect(error).not.toBeNull()
      expect(error?.reason).toBe('Workflow must have at least one trigger step')
    })

    it('should pass when workflow has trigger and other steps', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'webhook',
            actionId: 'receive',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
          {
            id: 'step_2',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_2',
            inputs: {},
            position: { x: 400, y: 480 },
          },
          {
            id: 'step_3',
            type: 'ai',
            appId: 'openai',
            actionId: 'generate_text',
            connectionId: 'conn_3',
            inputs: {},
            position: { x: 400, y: 660 },
          },
        ],
      }

      const error = validateTriggerExists(spec)
      expect(error).toBeNull()
    })
  })

  describe('validateAppConnections()', () => {
    it('should pass when all appIds are available', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'webhook',
            actionId: 'receive',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
          {
            id: 'step_2',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_2',
            inputs: {},
            position: { x: 400, y: 480 },
          },
        ],
      }

      const availableAppIds = ['webhook', 'slack', 'gmail']
      const error = validateAppConnections(spec, availableAppIds)
      expect(error).toBeNull()
    })

    it('should fail when an appId is not available', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'webhook',
            actionId: 'receive',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
          {
            id: 'step_2',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_2',
            inputs: {},
            position: { x: 400, y: 480 },
          },
        ],
      }

      const availableAppIds = ['webhook', 'gmail']
      const error = validateAppConnections(spec, availableAppIds)
      expect(error).not.toBeNull()
      expect(error?.field).toBe('appId')
      expect(error?.reason).toContain('slack')
      expect(error?.reason).toContain('not available')
    })

    it('should fail on first unavailable appId', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
          {
            id: 'step_2',
            type: 'action',
            appId: 'notion',
            actionId: 'create_page',
            connectionId: 'conn_2',
            inputs: {},
            position: { x: 400, y: 480 },
          },
        ],
      }

      const availableAppIds = ['gmail']
      const error = validateAppConnections(spec, availableAppIds)
      expect(error).not.toBeNull()
      expect(error?.reason).toContain('slack')
    })

    it('should pass with empty steps array', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [],
      }

      const availableAppIds = ['slack']
      const error = validateAppConnections(spec, availableAppIds)
      expect(error).toBeNull()
    })
  })

  describe('validateConnectionStatus()', () => {
    it('should pass when all connections are active', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'webhook',
            actionId: 'receive',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
          {
            id: 'step_2',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_2',
            inputs: {},
            position: { x: 400, y: 480 },
          },
        ],
      }

      const connectionStatus = { conn_1: true, conn_2: true }
      const error = validateConnectionStatus(spec, connectionStatus)
      expect(error).toBeNull()
    })

    it('should fail when a connection is inactive', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'webhook',
            actionId: 'receive',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
          {
            id: 'step_2',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_2',
            inputs: {},
            position: { x: 400, y: 480 },
          },
        ],
      }

      const connectionStatus = { conn_1: true, conn_2: false }
      const error = validateConnectionStatus(spec, connectionStatus)
      expect(error).not.toBeNull()
      expect(error?.field).toBe('connectionId')
      expect(error?.reason).toContain('conn_2')
      expect(error?.reason).toContain('not active')
    })

    it('should fail when a connection is missing from status map', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'webhook',
            actionId: 'receive',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
        ],
      }

      const connectionStatus = {}
      const error = validateConnectionStatus(spec, connectionStatus)
      expect(error).not.toBeNull()
      expect(error?.reason).toContain('conn_1')
    })

    it('should pass with empty steps array', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [],
      }

      const connectionStatus = {}
      const error = validateConnectionStatus(spec, connectionStatus)
      expect(error).toBeNull()
    })
  })

  describe('detectCycles()', () => {
    it('should pass for acyclic workflow', () => {
      const edges: AivoryWorkflowEdge[] = [
        { from: 'step_1', to: 'step_2' },
        { from: 'step_2', to: 'step_3' },
      ]
      const stepIds = ['step_1', 'step_2', 'step_3']

      const error = detectCycles(edges, stepIds)
      expect(error).toBeNull()
    })

    it('should fail for simple cycle', () => {
      const edges: AivoryWorkflowEdge[] = [
        { from: 'step_1', to: 'step_2' },
        { from: 'step_2', to: 'step_1' },
      ]
      const stepIds = ['step_1', 'step_2']

      const error = detectCycles(edges, stepIds)
      expect(error).not.toBeNull()
      expect(error?.field).toBe('edges')
      expect(error?.reason).toContain('cycle')
    })

    it('should fail for self-loop', () => {
      const edges: AivoryWorkflowEdge[] = [
        { from: 'step_1', to: 'step_1' },
      ]
      const stepIds = ['step_1']

      const error = detectCycles(edges, stepIds)
      expect(error).not.toBeNull()
      expect(error?.reason).toContain('cycle')
    })

    it('should fail for complex cycle', () => {
      const edges: AivoryWorkflowEdge[] = [
        { from: 'step_1', to: 'step_2' },
        { from: 'step_2', to: 'step_3' },
        { from: 'step_3', to: 'step_1' },
      ]
      const stepIds = ['step_1', 'step_2', 'step_3']

      const error = detectCycles(edges, stepIds)
      expect(error).not.toBeNull()
      expect(error?.reason).toContain('cycle')
    })

    it('should pass for branching workflow', () => {
      const edges: AivoryWorkflowEdge[] = [
        { from: 'step_1', to: 'step_2' },
        { from: 'step_1', to: 'step_3' },
        { from: 'step_2', to: 'step_4' },
        { from: 'step_3', to: 'step_4' },
      ]
      const stepIds = ['step_1', 'step_2', 'step_3', 'step_4']

      const error = detectCycles(edges, stepIds)
      expect(error).toBeNull()
    })

    it('should pass for empty edges', () => {
      const edges: AivoryWorkflowEdge[] = []
      const stepIds = ['step_1', 'step_2']

      const error = detectCycles(edges, stepIds)
      expect(error).toBeNull()
    })

    it('should pass for disconnected nodes', () => {
      const edges: AivoryWorkflowEdge[] = [
        { from: 'step_1', to: 'step_2' },
      ]
      const stepIds = ['step_1', 'step_2', 'step_3']

      const error = detectCycles(edges, stepIds)
      expect(error).toBeNull()
    })

    it('should fail for cycle in larger graph', () => {
      const edges: AivoryWorkflowEdge[] = [
        { from: 'step_1', to: 'step_2' },
        { from: 'step_2', to: 'step_3' },
        { from: 'step_3', to: 'step_4' },
        { from: 'step_4', to: 'step_2' }, // Cycle: step_2 -> step_3 -> step_4 -> step_2
      ]
      const stepIds = ['step_1', 'step_2', 'step_3', 'step_4']

      const error = detectCycles(edges, stepIds)
      expect(error).not.toBeNull()
      expect(error?.reason).toContain('cycle')
    })
  })

  describe('validateWorkflowSpec()', () => {
    it('should pass for valid workflow', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'webhook',
            actionId: 'receive',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
          {
            id: 'step_2',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_2',
            inputs: {},
            position: { x: 400, y: 480 },
          },
        ],
      }

      const availableAppIds = ['webhook', 'slack']
      const connectionStatus = { conn_1: true, conn_2: true }
      const edges: AivoryWorkflowEdge[] = [{ from: 'step_1', to: 'step_2' }]

      const error = validateWorkflowSpec(spec, availableAppIds, connectionStatus, edges)
      expect(error).toBeNull()
    })

    it('should fail on missing trigger', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
        ],
      }

      const availableAppIds = ['slack']
      const connectionStatus = { conn_1: true }
      const edges: AivoryWorkflowEdge[] = []

      const error = validateWorkflowSpec(spec, availableAppIds, connectionStatus, edges)
      expect(error).not.toBeNull()
      expect(error?.reason).toContain('trigger')
    })

    it('should fail on invalid app', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'webhook',
            actionId: 'receive',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
          {
            id: 'step_2',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_2',
            inputs: {},
            position: { x: 400, y: 480 },
          },
        ],
      }

      const availableAppIds = ['webhook']
      const connectionStatus = { conn_1: true, conn_2: true }
      const edges: AivoryWorkflowEdge[] = [{ from: 'step_1', to: 'step_2' }]

      const error = validateWorkflowSpec(spec, availableAppIds, connectionStatus, edges)
      expect(error).not.toBeNull()
      expect(error?.reason).toContain('slack')
    })

    it('should fail on inactive connection', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'webhook',
            actionId: 'receive',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
          {
            id: 'step_2',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_2',
            inputs: {},
            position: { x: 400, y: 480 },
          },
        ],
      }

      const availableAppIds = ['webhook', 'slack']
      const connectionStatus = { conn_1: true, conn_2: false }
      const edges: AivoryWorkflowEdge[] = [{ from: 'step_1', to: 'step_2' }]

      const error = validateWorkflowSpec(spec, availableAppIds, connectionStatus, edges)
      expect(error).not.toBeNull()
      expect(error?.reason).toContain('not active')
    })

    it('should fail on cycle', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'webhook',
            actionId: 'receive',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
          {
            id: 'step_2',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_2',
            inputs: {},
            position: { x: 400, y: 480 },
          },
        ],
      }

      const availableAppIds = ['webhook', 'slack']
      const connectionStatus = { conn_1: true, conn_2: true }
      const edges: AivoryWorkflowEdge[] = [
        { from: 'step_1', to: 'step_2' },
        { from: 'step_2', to: 'step_1' },
      ]

      const error = validateWorkflowSpec(spec, availableAppIds, connectionStatus, edges)
      expect(error).not.toBeNull()
      expect(error?.reason).toContain('cycle')
    })

    it('should return first error in validation order', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test',
        description: 'Test workflow',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'action',
            appId: 'unknown',
            actionId: 'send_message',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 },
          },
        ],
      }

      const availableAppIds = ['slack']
      const connectionStatus = { conn_1: false }
      const edges: AivoryWorkflowEdge[] = []

      const error = validateWorkflowSpec(spec, availableAppIds, connectionStatus, edges)
      expect(error).not.toBeNull()
      // Should fail on trigger first (before app or connection)
      expect(error?.reason).toContain('trigger')
    })
  })
})
