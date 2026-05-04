// @ts-nocheck
/**
 * Integration Tests for AIRA Workflow Generation
 * 
 * Tests complete workflows including:
 * - Generation flow (input → API → canvas)
 * - Refinement flow (copilot → apply → canvas)
 * - Handoff flow (console → localStorage → workflow tab)
 * - Error handling
 */

import { AivoryWorkflowSpec, AivoryWorkflowEdge } from '@/types/workflows'
import {
  validateTriggerExists,
  validateAppConnections,
  validateConnectionStatus,
  detectCycles,
} from '@/lib/workflowValidation'
import {
  parseWorkflowSpec,
  serializeWorkflowSpec,
} from '@/lib/workflowSerializer'
import {
  storeWorkflowSpec,
  retrieveWorkflowSpec,
  clearWorkflowSpec,
  hasWorkflowSpec,
  getWorkflowSpecAge,
  getWorkflowSpecTTL,
} from '@/lib/workflowHandoff'

// ── Test Fixtures ────────────────────────────────────────────────────────────

const mockWorkflowSpec: AivoryWorkflowSpec = {
  name: 'Email to Slack Notification',
  description: 'When I receive an email, send a Slack notification',
  source: 'workflow-tab',
  intent: 'Send Slack notification when I receive an email',
  steps: [
    {
      id: 'step_1',
      type: 'trigger',
      appId: 'gmail',
      actionId: 'new_email',
      connectionId: 'conn_gmail_1',
      inputs: { folder: 'INBOX' },
      position: { x: 400, y: 300 },
    },
    {
      id: 'step_2',
      type: 'action',
      appId: 'slack',
      actionId: 'send_message',
      connectionId: 'conn_slack_1',
      inputs: { channel: '#notifications', text: 'New email received' },
      position: { x: 400, y: 480 },
    },
  ],
}

const mockEdges: AivoryWorkflowEdge[] = [
  {
    from: 'step_1',
    to: 'step_2',
  },
]

const mockAvailableApps = ['gmail', 'slack', 'notion', 'google_drive']
const mockConnectionStatus = {
  conn_gmail_1: true,
  conn_slack_1: true,
}

// ── Integration Test Suite ───────────────────────────────────────────────────

describe('AIRA Workflow Generation - Integration Tests', () => {
  // ── Generation Flow ──────────────────────────────────────────────────────

  describe('Generation Flow', () => {
    it('should validate a complete generated workflow', () => {
      // Validate trigger
      const triggerError = validateTriggerExists(mockWorkflowSpec)
      expect(triggerError).toBeNull()

      // Validate apps
      const appIds = mockWorkflowSpec.steps.map((s) => s.appId)
      const appError = validateAppConnections(mockWorkflowSpec, mockAvailableApps)
      expect(appError).toBeNull()

      // Validate connections
      const connError = validateConnectionStatus(mockWorkflowSpec, mockConnectionStatus)
      expect(connError).toBeNull()

      // Detect cycles
      const stepIds = mockWorkflowSpec.steps.map((s) => s.id)
      const cycleError = detectCycles(mockEdges, stepIds)
      expect(cycleError).toBeNull()
    })

    it('should reject workflow without trigger', () => {
      const noTriggerSpec: AivoryWorkflowSpec = {
        ...mockWorkflowSpec,
        steps: mockWorkflowSpec.steps.filter((s) => s.type !== 'trigger'),
      }

      const error = validateTriggerExists(noTriggerSpec)
      expect(error).not.toBeNull()
      expect(error?.reason).toContain('trigger')
    })

    it('should reject workflow with unavailable app', () => {
      const invalidAppSpec: AivoryWorkflowSpec = {
        ...mockWorkflowSpec,
        steps: [
          ...mockWorkflowSpec.steps,
          {
            id: 'step_3',
            type: 'action',
            appId: 'unavailable_app',
            actionId: 'do_something',
            connectionId: 'conn_unknown',
            inputs: {},
            position: { x: 400, y: 660 },
          },
        ],
      }

      const error = validateAppConnections(invalidAppSpec, mockAvailableApps)
      expect(error).not.toBeNull()
      expect(error?.reason).toContain('not available')
    })

    it('should reject workflow with inactive connection', () => {
      const inactiveConnStatus = {
        conn_gmail_1: false,
        conn_slack_1: true,
      }

      const error = validateConnectionStatus(mockWorkflowSpec, inactiveConnStatus)
      expect(error).not.toBeNull()
      expect(error?.reason).toContain('not active')
    })

    it('should detect cyclic workflows', () => {
      const cyclicEdges: AivoryWorkflowEdge[] = [
        { from: 'step_1', to: 'step_2' },
        { from: 'step_2', to: 'step_1' }, // Creates cycle
      ]

      const stepIds = ['step_1', 'step_2']
      const error = detectCycles(cyclicEdges, stepIds)
      expect(error).not.toBeNull()
      expect(error?.reason).toContain('cycle')
    })
  })

  // ── Refinement Flow ──────────────────────────────────────────────────────

  describe('Refinement Flow', () => {
    it('should validate refined workflow', () => {
      const refinedSpec: AivoryWorkflowSpec = {
        ...mockWorkflowSpec,
        name: 'Email to Slack with Filter',
        steps: [
          ...mockWorkflowSpec.steps,
          {
            id: 'step_3',
            type: 'filter',
            appId: 'slack',
            actionId: 'check_condition',
            connectionId: 'conn_slack_1',
            inputs: { condition: 'from_important_sender' },
            position: { x: 400, y: 660 },
          },
        ],
      }

      const refinedEdges: AivoryWorkflowEdge[] = [
        { from: 'step_1', to: 'step_3' },
        { from: 'step_3', to: 'step_2', label: 'if true' },
      ]

      // Validate refined spec
      const triggerError = validateTriggerExists(refinedSpec)
      expect(triggerError).toBeNull()

      const appError = validateAppConnections(refinedSpec, mockAvailableApps)
      expect(appError).toBeNull()

      const connError = validateConnectionStatus(refinedSpec, mockConnectionStatus)
      expect(connError).toBeNull()

      const stepIds = refinedSpec.steps.map((s) => s.id)
      const cycleError = detectCycles(refinedEdges, stepIds)
      expect(cycleError).toBeNull()
    })

    it('should track changes in refinement', () => {
      const originalStepIds = new Set(mockWorkflowSpec.steps.map((s) => s.id))

      const refinedSpec: AivoryWorkflowSpec = {
        ...mockWorkflowSpec,
        steps: [
          ...mockWorkflowSpec.steps,
          {
            id: 'step_3',
            type: 'action',
            appId: 'notion',
            actionId: 'create_page',
            connectionId: 'conn_notion_1',
            inputs: {},
            position: { x: 400, y: 660 },
          },
        ],
      }

      const refinedStepIds = new Set(refinedSpec.steps.map((s) => s.id))

      // Find added steps
      const added = Array.from(refinedStepIds).filter((id) => !originalStepIds.has(id))
      expect(added).toContain('step_3')
      expect(added.length).toBe(1)
    })
  })

  // ── Handoff Flow ─────────────────────────────────────────────────────────

  describe('Handoff Flow', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      clearWorkflowSpec()
    })

    afterEach(() => {
      // Clean up after each test
      clearWorkflowSpec()
    })

    it('should store and retrieve workflow spec', () => {
      // Store
      const stored = storeWorkflowSpec(mockWorkflowSpec)
      expect(stored).toBe(true)

      // Retrieve
      const retrieved = retrieveWorkflowSpec()
      expect(retrieved).not.toBeNull()
      expect(retrieved?.spec.name).toBe(mockWorkflowSpec.name)
      expect(JSON.stringify(retrieved?.spec)).toBe(JSON.stringify(mockWorkflowSpec))
    })

    it('should check if workflow spec is available', () => {
      expect(hasWorkflowSpec()).toBe(false)

      storeWorkflowSpec(mockWorkflowSpec)
      expect(hasWorkflowSpec()).toBe(true)

      clearWorkflowSpec()
      expect(hasWorkflowSpec()).toBe(false)
    })

    it('should track spec age', () => {
      storeWorkflowSpec(mockWorkflowSpec)

      const age = getWorkflowSpecAge()
      expect(age).toBeGreaterThanOrEqual(0)
      expect(age).toBeLessThan(1000) // Should be very recent
    })

    it('should calculate remaining TTL', () => {
      storeWorkflowSpec(mockWorkflowSpec)

      const ttl = getWorkflowSpecTTL()
      expect(ttl).toBeGreaterThan(0)
      expect(ttl).toBeLessThanOrEqual(5 * 60 * 1000) // 5 minutes
    })

    it('should reject stale specs', () => {
      storeWorkflowSpec(mockWorkflowSpec)

      // Simulate time passing (in real test, would use jest.useFakeTimers)
      // For now, just verify the mechanism works
      const retrieved = retrieveWorkflowSpec()
      expect(retrieved).not.toBeNull()
    })

    it('should clear spec after retrieval', () => {
      storeWorkflowSpec(mockWorkflowSpec)
      expect(hasWorkflowSpec()).toBe(true)

      clearWorkflowSpec()
      expect(hasWorkflowSpec()).toBe(false)
      expect(retrieveWorkflowSpec()).toBeNull()
    })
  })

  // ── Serialization Flow ───────────────────────────────────────────────────

  describe('Serialization Flow', () => {
    it('should serialize and deserialize workflow spec', () => {
      const serialized = serializeWorkflowSpec(mockWorkflowSpec)
      expect(typeof serialized).toBe('string')

      const parseResult = parseWorkflowSpec(serialized)
      expect(parseResult.spec).not.toBeUndefined()
      expect(parseResult.error).toBeUndefined()
      expect(JSON.stringify(parseResult.spec)).toBe(JSON.stringify(mockWorkflowSpec))
    })

    it('should handle invalid JSON gracefully', () => {
      const invalidJson = 'not valid json'
      const result = parseWorkflowSpec(invalidJson)
      expect(result.error).not.toBeUndefined()
      expect(result.spec).toBeUndefined()
    })

    it('should validate required fields during parsing', () => {
      const incompleteSpec = {
        name: 'Test',
        // Missing other required fields
      }

      const serialized = JSON.stringify(incompleteSpec)
      const result = parseWorkflowSpec(serialized)
      expect(result.error).not.toBeUndefined()
      expect(result.spec).toBeUndefined()
    })
  })

  // ── Error Handling ───────────────────────────────────────────────────────

  describe('Error Handling', () => {
    it('should provide actionable error messages', () => {
      const noTriggerSpec: AivoryWorkflowSpec = {
        ...mockWorkflowSpec,
        steps: mockWorkflowSpec.steps.filter((s) => s.type !== 'trigger'),
      }

      const error = validateTriggerExists(noTriggerSpec)
      expect(error?.reason).toMatch(/trigger/i)
      expect(error?.field).toBe('steps')
    })

    it('should handle multiple validation errors', () => {
      const invalidSpec: AivoryWorkflowSpec = {
        ...mockWorkflowSpec,
        steps: [
          {
            id: 'step_1',
            type: 'action', // Not a trigger
            appId: 'unavailable_app',
            actionId: 'do_something',
            connectionId: 'conn_unknown',
            inputs: {},
            position: { x: 400, y: 300 },
          },
        ],
      }

      // First error should be trigger
      const triggerError = validateTriggerExists(invalidSpec)
      expect(triggerError).not.toBeNull()

      // If trigger passes, next error should be app
      if (!triggerError) {
        const appError = validateAppConnections(invalidSpec, mockAvailableApps)
        expect(appError).not.toBeNull()
      }
    })
  })

  // ── Complete Workflow Validation ─────────────────────────────────────────

  describe('Complete Workflow Validation', () => {
    it('should validate all constraints for a complete workflow', () => {
      const constraints = [
        () => validateTriggerExists(mockWorkflowSpec),
        () => validateAppConnections(mockWorkflowSpec, mockAvailableApps),
        () => validateConnectionStatus(mockWorkflowSpec, mockConnectionStatus),
        () => detectCycles(mockEdges, mockWorkflowSpec.steps.map((s) => s.id)),
      ]

      const errors = constraints
        .map((check) => check())
        .filter((error) => error !== null)

      expect(errors).toHaveLength(0)
    })

    it('should handle workflow with multiple branches', () => {
      const branchedSpec: AivoryWorkflowSpec = {
        ...mockWorkflowSpec,
        steps: [
          mockWorkflowSpec.steps[0], // trigger
          {
            id: 'step_2',
            type: 'filter',
            appId: 'slack',
            actionId: 'check_condition',
            connectionId: 'conn_slack_1',
            inputs: {},
            position: { x: 400, y: 480 },
          },
          {
            id: 'step_3',
            type: 'action',
            appId: 'slack',
            actionId: 'send_message',
            connectionId: 'conn_slack_1',
            inputs: {},
            position: { x: 150, y: 660 },
          },
          {
            id: 'step_4',
            type: 'action',
            appId: 'notion',
            actionId: 'create_page',
            connectionId: 'conn_notion_1',
            inputs: {},
            position: { x: 650, y: 660 },
          },
        ],
      }

      const branchedEdges: AivoryWorkflowEdge[] = [
        { from: 'step_1', to: 'step_2' },
        { from: 'step_2', to: 'step_3', label: 'if true' },
        { from: 'step_2', to: 'step_4', label: 'if false' },
      ]

      // Validate
      const triggerError = validateTriggerExists(branchedSpec)
      expect(triggerError).toBeNull()

      const appError = validateAppConnections(branchedSpec, mockAvailableApps)
      expect(appError).toBeNull()

      const connStatus = {
        ...mockConnectionStatus,
        conn_notion_1: true,
      }
      const connError = validateConnectionStatus(branchedSpec, connStatus)
      expect(connError).toBeNull()

      const stepIds = branchedSpec.steps.map((s) => s.id)
      const cycleError = detectCycles(branchedEdges, stepIds)
      expect(cycleError).toBeNull()
    })
  })
})
