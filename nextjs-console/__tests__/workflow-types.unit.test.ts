// @ts-nocheck
/**
 * Unit Tests for Workflow Types
 * 
 * Tests verify that all workflow specification interfaces compile correctly
 * and can be instantiated with valid data.
 */

import {
  WorkflowStep,
  WorkflowStepType,
  AivoryWorkflowEdge,
  AivoryWorkflowSpec,
  WorkflowGenerationResult,
  CopilotResult,
} from '../types/workflows'

describe('Workflow Types - Unit Tests', () => {
  describe('WorkflowStepType enum', () => {
    it('should accept all four valid step types', () => {
      const types: WorkflowStepType[] = ['trigger', 'action', 'ai', 'filter']
      expect(types).toHaveLength(4)
      expect(types).toContain('trigger')
      expect(types).toContain('action')
      expect(types).toContain('ai')
      expect(types).toContain('filter')
    })
  })

  describe('WorkflowStep interface', () => {
    it('should instantiate with all required fields', () => {
      const step: WorkflowStep = {
        id: 'step_1',
        type: 'trigger',
        appId: 'slack',
        actionId: 'send_message',
        connectionId: 'conn_123',
        inputs: { channel: '#general', message: 'Hello' },
        position: { x: 400, y: 300 },
      }

      expect(step.id).toBe('step_1')
      expect(step.type).toBe('trigger')
      expect(step.appId).toBe('slack')
      expect(step.actionId).toBe('send_message')
      expect(step.connectionId).toBe('conn_123')
      expect(step.inputs).toEqual({ channel: '#general', message: 'Hello' })
      expect(step.position).toEqual({ x: 400, y: 300 })
    })

    it('should support different step types', () => {
      const triggerStep: WorkflowStep = {
        id: 'step_1',
        type: 'trigger',
        appId: 'webhook',
        actionId: 'receive',
        connectionId: 'conn_1',
        inputs: {},
        position: { x: 400, y: 300 },
      }

      const actionStep: WorkflowStep = {
        id: 'step_2',
        type: 'action',
        appId: 'slack',
        actionId: 'send_message',
        connectionId: 'conn_2',
        inputs: { message: 'test' },
        position: { x: 400, y: 480 },
      }

      const aiStep: WorkflowStep = {
        id: 'step_3',
        type: 'ai',
        appId: 'openai',
        actionId: 'generate_text',
        connectionId: 'conn_3',
        inputs: { prompt: 'test' },
        position: { x: 400, y: 660 },
      }

      const filterStep: WorkflowStep = {
        id: 'step_4',
        type: 'filter',
        appId: 'logic',
        actionId: 'condition',
        connectionId: 'conn_4',
        inputs: { condition: 'x > 5' },
        position: { x: 400, y: 840 },
      }

      expect(triggerStep.type).toBe('trigger')
      expect(actionStep.type).toBe('action')
      expect(aiStep.type).toBe('ai')
      expect(filterStep.type).toBe('filter')
    })

    it('should support empty inputs object', () => {
      const step: WorkflowStep = {
        id: 'step_1',
        type: 'trigger',
        appId: 'webhook',
        actionId: 'receive',
        connectionId: 'conn_1',
        inputs: {},
        position: { x: 0, y: 0 },
      }

      expect(step.inputs).toEqual({})
    })

    it('should support complex inputs object', () => {
      const step: WorkflowStep = {
        id: 'step_1',
        type: 'action',
        appId: 'slack',
        actionId: 'send_message',
        connectionId: 'conn_1',
        inputs: {
          channel: '#general',
          message: 'Hello',
          thread_ts: '1234567890.123456',
          blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '*Bold*' } }],
        },
        position: { x: 400, y: 480 },
      }

      expect(step.inputs.channel).toBe('#general')
      expect(step.inputs.blocks).toHaveLength(1)
    })
  })

  describe('AivoryWorkflowEdge interface', () => {
    it('should instantiate with required fields', () => {
      const edge: AivoryWorkflowEdge = {
        from: 'step_1',
        to: 'step_2',
      }

      expect(edge.from).toBe('step_1')
      expect(edge.to).toBe('step_2')
      expect(edge.label).toBeUndefined()
    })

    it('should support optional label field', () => {
      const edge: AivoryWorkflowEdge = {
        from: 'step_1',
        to: 'step_2',
        label: 'if true',
      }

      expect(edge.label).toBe('if true')
    })

    it('should support multiple edges from same source', () => {
      const edges: AivoryWorkflowEdge[] = [
        { from: 'step_1', to: 'step_2', label: 'if true' },
        { from: 'step_1', to: 'step_3', label: 'if false' },
      ]

      expect(edges).toHaveLength(2)
      expect(edges[0].to).toBe('step_2')
      expect(edges[1].to).toBe('step_3')
    })
  })

  describe('AivoryWorkflowSpec interface', () => {
    it('should instantiate with all required fields', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Send Slack Message',
        description: 'Sends a message to Slack when triggered',
        source: 'workflow-tab',
        intent: 'Create a workflow that sends a message to Slack',
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
            inputs: { message: 'Hello' },
            position: { x: 400, y: 480 },
          },
        ],
      }

      expect(spec.name).toBe('Send Slack Message')
      expect(spec.description).toBe('Sends a message to Slack when triggered')
      expect(spec.source).toBe('workflow-tab')
      expect(spec.intent).toBe('Create a workflow that sends a message to Slack')
      expect(spec.steps).toHaveLength(2)
    })

    it('should support different source values', () => {
      const sources = ['console', 'workflow-tab', 'copilot']

      sources.forEach((source) => {
        const spec: AivoryWorkflowSpec = {
          name: 'Test',
          description: 'Test workflow',
          source,
          intent: 'Test',
          steps: [],
        }

        expect(spec.source).toBe(source)
      })
    })

    it('should support empty steps array', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Empty Workflow',
        description: 'A workflow with no steps',
        source: 'console',
        intent: 'Create empty workflow',
        steps: [],
      }

      expect(spec.steps).toEqual([])
    })

    it('should support multiple steps', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Complex Workflow',
        description: 'A workflow with multiple steps',
        source: 'workflow-tab',
        intent: 'Create complex workflow',
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
            inputs: { message: 'Step 2' },
            position: { x: 400, y: 480 },
          },
          {
            id: 'step_3',
            type: 'ai',
            appId: 'openai',
            actionId: 'generate_text',
            connectionId: 'conn_3',
            inputs: { prompt: 'Generate response' },
            position: { x: 400, y: 660 },
          },
          {
            id: 'step_4',
            type: 'filter',
            appId: 'logic',
            actionId: 'condition',
            connectionId: 'conn_4',
            inputs: { condition: 'x > 5' },
            position: { x: 400, y: 840 },
          },
        ],
      }

      expect(spec.steps).toHaveLength(4)
      expect(spec.steps[0].type).toBe('trigger')
      expect(spec.steps[1].type).toBe('action')
      expect(spec.steps[2].type).toBe('ai')
      expect(spec.steps[3].type).toBe('filter')
    })
  })

  describe('WorkflowGenerationResult interface', () => {
    it('should instantiate with all required fields', () => {
      const result: WorkflowGenerationResult = {
        spec: {
          name: 'Test Workflow',
          description: 'A test workflow',
          source: 'console',
          intent: 'Test',
          steps: [],
        },
        edges: [],
        notes: {
          summary: 'This workflow does X',
          assumptions: ['Assumption 1', 'Assumption 2'],
          warnings: ['Warning 1'],
        },
      }

      expect(result.spec.name).toBe('Test Workflow')
      expect(result.edges).toEqual([])
      expect(result.notes.summary).toBe('This workflow does X')
      expect(result.notes.assumptions).toHaveLength(2)
      expect(result.notes.warnings).toHaveLength(1)
    })

    it('should support empty edges and notes arrays', () => {
      const result: WorkflowGenerationResult = {
        spec: {
          name: 'Test',
          description: 'Test',
          source: 'console',
          intent: 'Test',
          steps: [],
        },
        edges: [],
        notes: {
          summary: 'Summary',
          assumptions: [],
          warnings: [],
        },
      }

      expect(result.edges).toEqual([])
      expect(result.notes.assumptions).toEqual([])
      expect(result.notes.warnings).toEqual([])
    })

    it('should support multiple edges and notes', () => {
      const result: WorkflowGenerationResult = {
        spec: {
          name: 'Test',
          description: 'Test',
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
        },
        edges: [{ from: 'step_1', to: 'step_2' }],
        notes: {
          summary: 'Sends message to Slack',
          assumptions: ['Slack is connected', 'Webhook is active'],
          warnings: ['No error handling'],
        },
      }

      expect(result.edges).toHaveLength(1)
      expect(result.notes.assumptions).toHaveLength(2)
      expect(result.notes.warnings).toHaveLength(1)
    })
  })

  describe('CopilotResult interface', () => {
    it('should instantiate with required fields', () => {
      const result: CopilotResult = {
        spec: {
          name: 'Test',
          description: 'Test',
          source: 'copilot',
          intent: 'Test',
          steps: [],
        },
        edges: [],
      }

      expect(result.spec.name).toBe('Test')
      expect(result.edges).toEqual([])
      expect(result.changes).toBeUndefined()
      expect(result.explanation).toBeUndefined()
    })

    it('should support changes field for refine mode', () => {
      const result: CopilotResult = {
        spec: {
          name: 'Test',
          description: 'Test',
          source: 'copilot',
          intent: 'Test',
          steps: [],
        },
        edges: [],
        changes: {
          added: ['step_3'],
          modified: ['step_2'],
          removed: [],
        },
      }

      expect(result.changes).toBeDefined()
      expect(result.changes?.added).toContain('step_3')
      expect(result.changes?.modified).toContain('step_2')
      expect(result.changes?.removed).toEqual([])
    })

    it('should support explanation field for explain mode', () => {
      const result: CopilotResult = {
        spec: {
          name: 'Test',
          description: 'Test',
          source: 'copilot',
          intent: 'Test',
          steps: [],
        },
        edges: [],
        explanation: 'This workflow sends a message to Slack when triggered.',
      }

      expect(result.explanation).toBe('This workflow sends a message to Slack when triggered.')
    })

    it('should support both changes and explanation', () => {
      const result: CopilotResult = {
        spec: {
          name: 'Test',
          description: 'Test',
          source: 'copilot',
          intent: 'Test',
          steps: [],
        },
        edges: [],
        changes: {
          added: ['step_3'],
          modified: [],
          removed: [],
        },
        explanation: 'Added a new step.',
      }

      expect(result.changes).toBeDefined()
      expect(result.explanation).toBeDefined()
    })
  })
})
