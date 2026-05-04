// @ts-nocheck
/**
 * Unit Tests for Workflow Serialization Utilities
 * 
 * Tests parseWorkflowSpec(), serializeWorkflowSpec(), and round-trip validation
 */

import {
  parseWorkflowSpec,
  serializeWorkflowSpec,
  validateRoundTrip,
  ParseError
} from '@/lib/workflowSerializer'
import { AivoryWorkflowSpec, WorkflowStep } from '@/types/workflows'

describe('parseWorkflowSpec', () => {
  describe('valid JSON parsing', () => {
    it('should parse valid workflow spec JSON', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Test Workflow',
        description: 'A test workflow',
        source: 'console',
        intent: 'Send a message to Slack',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'slack',
            actionId: 'message_received',
            connectionId: 'conn_1',
            inputs: { channel: '#general' },
            position: { x: 400, y: 300 }
          }
        ]
      }

      const json = JSON.stringify(spec)
      const result = parseWorkflowSpec(json)

      expect(result.error).toBeUndefined()
      expect(result.spec).toBeDefined()
      expect(result.spec?.name).toBe('Test Workflow')
      expect(result.spec?.steps).toHaveLength(1)
    })

    it('should parse spec with multiple steps', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Multi-step Workflow',
        description: 'Multiple steps',
        source: 'workflow-tab',
        intent: 'Send message and log',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'slack',
            actionId: 'message_received',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 }
          },
          {
            id: 'step_2',
            type: 'action',
            appId: 'gmail',
            actionId: 'send_email',
            connectionId: 'conn_2',
            inputs: { to: 'user@example.com' },
            position: { x: 400, y: 480 }
          },
          {
            id: 'step_3',
            type: 'ai',
            appId: 'openai',
            actionId: 'generate_text',
            connectionId: 'conn_3',
            inputs: { prompt: 'Summarize' },
            position: { x: 400, y: 660 }
          }
        ]
      }

      const json = JSON.stringify(spec)
      const result = parseWorkflowSpec(json)

      expect(result.error).toBeUndefined()
      expect(result.spec?.steps).toHaveLength(3)
      expect(result.spec?.steps[0].type).toBe('trigger')
      expect(result.spec?.steps[1].type).toBe('action')
      expect(result.spec?.steps[2].type).toBe('ai')
    })

    it('should preserve all step properties including position', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Position Test',
        description: 'Test position preservation',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'slack',
            actionId: 'message_received',
            connectionId: 'conn_1',
            inputs: { channel: '#general', timeout: 5000 },
            position: { x: 123, y: 456 }
          }
        ]
      }

      const json = JSON.stringify(spec)
      const result = parseWorkflowSpec(json)

      expect(result.spec?.steps[0].position.x).toBe(123)
      expect(result.spec?.steps[0].position.y).toBe(456)
      expect(result.spec?.steps[0].inputs.channel).toBe('#general')
      expect(result.spec?.steps[0].inputs.timeout).toBe(5000)
    })

    it('should handle empty inputs object', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Empty Inputs',
        description: 'Test empty inputs',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'slack',
            actionId: 'message_received',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 }
          }
        ]
      }

      const json = JSON.stringify(spec)
      const result = parseWorkflowSpec(json)

      expect(result.error).toBeUndefined()
      expect(result.spec?.steps[0].inputs).toEqual({})
    })

    it('should handle complex nested inputs', () => {
      const spec: AivoryWorkflowSpec = {
        name: 'Complex Inputs',
        description: 'Test complex inputs',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'action',
            appId: 'api',
            actionId: 'call_endpoint',
            connectionId: 'conn_1',
            inputs: {
              url: 'https://api.example.com',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: { key: 'value', nested: { deep: 'data' } }
            },
            position: { x: 400, y: 300 }
          }
        ]
      }

      const json = JSON.stringify(spec)
      const result = parseWorkflowSpec(json)

      expect(result.error).toBeUndefined()
      expect(result.spec?.steps[0].inputs.body.nested.deep).toBe('data')
    })
  })

  describe('invalid JSON', () => {
    it('should reject invalid JSON syntax', () => {
      const result = parseWorkflowSpec('{ invalid json }')

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('Invalid JSON')
      expect(result.spec).toBeUndefined()
    })

    it('should reject empty string', () => {
      const result = parseWorkflowSpec('')

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('Invalid JSON')
    })

    it('should reject JSON array instead of object', () => {
      const result = parseWorkflowSpec('[]')

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('must be a JSON object')
      expect(result.error?.field).toBe('root')
    })

    it('should reject JSON string instead of object', () => {
      const result = parseWorkflowSpec('"string"')

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('must be a JSON object')
    })

    it('should reject JSON number instead of object', () => {
      const result = parseWorkflowSpec('123')

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('must be a JSON object')
    })
  })

  describe('missing required fields', () => {
    it('should reject spec missing name field', () => {
      const json = JSON.stringify({
        description: 'Test',
        source: 'console',
        intent: 'Test',
        steps: []
      })

      const result = parseWorkflowSpec(json)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('missing required field: name')
      expect(result.error?.field).toBe('name')
    })

    it('should reject spec missing description field', () => {
      const json = JSON.stringify({
        name: 'Test',
        source: 'console',
        intent: 'Test',
        steps: []
      })

      const result = parseWorkflowSpec(json)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('missing required field: description')
    })

    it('should reject spec missing source field', () => {
      const json = JSON.stringify({
        name: 'Test',
        description: 'Test',
        intent: 'Test',
        steps: []
      })

      const result = parseWorkflowSpec(json)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('missing required field: source')
    })

    it('should reject spec missing intent field', () => {
      const json = JSON.stringify({
        name: 'Test',
        description: 'Test',
        source: 'console',
        steps: []
      })

      const result = parseWorkflowSpec(json)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('missing required field: intent')
    })

    it('should reject spec missing steps field', () => {
      const json = JSON.stringify({
        name: 'Test',
        description: 'Test',
        source: 'console',
        intent: 'Test'
      })

      const result = parseWorkflowSpec(json)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('missing required field: steps')
    })
  })

  describe('invalid field types', () => {
    it('should reject non-string name', () => {
      const json = JSON.stringify({
        name: 123,
        description: 'Test',
        source: 'console',
        intent: 'Test',
        steps: []
      })

      const result = parseWorkflowSpec(json)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('name must be a string')
    })

    it('should reject non-string description', () => {
      const json = JSON.stringify({
        name: 'Test',
        description: null,
        source: 'console',
        intent: 'Test',
        steps: []
      })

      const result = parseWorkflowSpec(json)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('description must be a string')
    })

    it('should reject non-array steps', () => {
      const json = JSON.stringify({
        name: 'Test',
        description: 'Test',
        source: 'console',
        intent: 'Test',
        steps: 'not an array'
      })

      const result = parseWorkflowSpec(json)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('steps must be an array')
    })
  })

  describe('invalid step structure', () => {
    it('should reject step missing id field', () => {
      const json = JSON.stringify({
        name: 'Test',
        description: 'Test',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            type: 'trigger',
            appId: 'slack',
            actionId: 'message_received',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 }
          }
        ]
      })

      const result = parseWorkflowSpec(json)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('missing required field: id')
      expect(result.error?.field).toContain('steps[0]')
    })

    it('should reject step with invalid type', () => {
      const json = JSON.stringify({
        name: 'Test',
        description: 'Test',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'invalid_type',
            appId: 'slack',
            actionId: 'message_received',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 }
          }
        ]
      })

      const result = parseWorkflowSpec(json)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('must be one of: trigger, action, ai, filter')
    })

    it('should reject step with non-string appId', () => {
      const json = JSON.stringify({
        name: 'Test',
        description: 'Test',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 123,
            actionId: 'message_received',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: 300 }
          }
        ]
      })

      const result = parseWorkflowSpec(json)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('appId must be a string')
    })

    it('should reject step with non-object inputs', () => {
      const json = JSON.stringify({
        name: 'Test',
        description: 'Test',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'slack',
            actionId: 'message_received',
            connectionId: 'conn_1',
            inputs: 'not an object',
            position: { x: 400, y: 300 }
          }
        ]
      })

      const result = parseWorkflowSpec(json)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('inputs must be an object')
    })

    it('should reject step with array inputs', () => {
      const json = JSON.stringify({
        name: 'Test',
        description: 'Test',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'slack',
            actionId: 'message_received',
            connectionId: 'conn_1',
            inputs: [],
            position: { x: 400, y: 300 }
          }
        ]
      })

      const result = parseWorkflowSpec(json)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('inputs must be an object')
    })

    it('should reject step with non-object position', () => {
      const json = JSON.stringify({
        name: 'Test',
        description: 'Test',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'slack',
            actionId: 'message_received',
            connectionId: 'conn_1',
            inputs: {},
            position: 'not an object'
          }
        ]
      })

      const result = parseWorkflowSpec(json)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('position must be an object')
    })

    it('should reject step with non-number position.x', () => {
      const json = JSON.stringify({
        name: 'Test',
        description: 'Test',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'slack',
            actionId: 'message_received',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 'not a number', y: 300 }
          }
        ]
      })

      const result = parseWorkflowSpec(json)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('position.x must be a number')
    })

    it('should reject step with non-number position.y', () => {
      const json = JSON.stringify({
        name: 'Test',
        description: 'Test',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'slack',
            actionId: 'message_received',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400, y: null }
          }
        ]
      })

      const result = parseWorkflowSpec(json)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('position.y must be a number')
    })
  })

  describe('error details', () => {
    it('should include field information in error', () => {
      const result = parseWorkflowSpec('{ invalid }')

      expect(result.error?.field).toBeDefined()
      expect(result.error?.details).toBeDefined()
    })

    it('should provide descriptive error messages', () => {
      const json = JSON.stringify({
        name: 'Test',
        description: 'Test',
        source: 'console',
        intent: 'Test',
        steps: [
          {
            id: 'step_1',
            type: 'trigger',
            appId: 'slack',
            actionId: 'message_received',
            connectionId: 'conn_1',
            inputs: {},
            position: { x: 400 }
          }
        ]
      })

      const result = parseWorkflowSpec(json)

      expect(result.error?.message).toContain('Step')
      expect(result.error?.message).toContain('validation failed')
    })
  })
})

describe('serializeWorkflowSpec', () => {
  it('should serialize valid workflow spec to JSON string', () => {
    const spec: AivoryWorkflowSpec = {
      name: 'Test Workflow',
      description: 'A test workflow',
      source: 'console',
      intent: 'Send a message',
      steps: [
        {
          id: 'step_1',
          type: 'trigger',
          appId: 'slack',
          actionId: 'message_received',
          connectionId: 'conn_1',
          inputs: { channel: '#general' },
          position: { x: 400, y: 300 }
        }
      ]
    }

    const json = serializeWorkflowSpec(spec)

    expect(typeof json).toBe('string')
    expect(json).toContain('Test Workflow')
    expect(json).toContain('trigger')
  })

  it('should produce valid JSON that can be parsed', () => {
    const spec: AivoryWorkflowSpec = {
      name: 'Test',
      description: 'Test',
      source: 'console',
      intent: 'Test',
      steps: [
        {
          id: 'step_1',
          type: 'trigger',
          appId: 'slack',
          actionId: 'message_received',
          connectionId: 'conn_1',
          inputs: {},
          position: { x: 400, y: 300 }
        }
      ]
    }

    const json = serializeWorkflowSpec(spec)
    const parsed = JSON.parse(json)

    expect(parsed.name).toBe('Test')
    expect(parsed.steps).toHaveLength(1)
  })

  it('should preserve all properties including position coordinates', () => {
    const spec: AivoryWorkflowSpec = {
      name: 'Position Test',
      description: 'Test',
      source: 'console',
      intent: 'Test',
      steps: [
        {
          id: 'step_1',
          type: 'trigger',
          appId: 'slack',
          actionId: 'message_received',
          connectionId: 'conn_1',
          inputs: { channel: '#general', timeout: 5000 },
          position: { x: 123, y: 456 }
        }
      ]
    }

    const json = serializeWorkflowSpec(spec)
    const parsed = JSON.parse(json)

    expect(parsed.steps[0].position.x).toBe(123)
    expect(parsed.steps[0].position.y).toBe(456)
    expect(parsed.steps[0].inputs.channel).toBe('#general')
    expect(parsed.steps[0].inputs.timeout).toBe(5000)
  })

  it('should handle multiple steps', () => {
    const spec: AivoryWorkflowSpec = {
      name: 'Multi-step',
      description: 'Test',
      source: 'console',
      intent: 'Test',
      steps: [
        {
          id: 'step_1',
          type: 'trigger',
          appId: 'slack',
          actionId: 'message_received',
          connectionId: 'conn_1',
          inputs: {},
          position: { x: 400, y: 300 }
        },
        {
          id: 'step_2',
          type: 'action',
          appId: 'gmail',
          actionId: 'send_email',
          connectionId: 'conn_2',
          inputs: {},
          position: { x: 400, y: 480 }
        }
      ]
    }

    const json = serializeWorkflowSpec(spec)
    const parsed = JSON.parse(json)

    expect(parsed.steps).toHaveLength(2)
    expect(parsed.steps[0].type).toBe('trigger')
    expect(parsed.steps[1].type).toBe('action')
  })

  it('should handle complex nested inputs', () => {
    const spec: AivoryWorkflowSpec = {
      name: 'Complex',
      description: 'Test',
      source: 'console',
      intent: 'Test',
      steps: [
        {
          id: 'step_1',
          type: 'action',
          appId: 'api',
          actionId: 'call',
          connectionId: 'conn_1',
          inputs: {
            url: 'https://api.example.com',
            headers: { 'Content-Type': 'application/json' },
            body: { nested: { deep: 'value' } }
          },
          position: { x: 400, y: 300 }
        }
      ]
    }

    const json = serializeWorkflowSpec(spec)
    const parsed = JSON.parse(json)

    expect(parsed.steps[0].inputs.body.nested.deep).toBe('value')
  })
})

describe('validateRoundTrip', () => {
  it('should validate round-trip for valid spec', () => {
    const spec: AivoryWorkflowSpec = {
      name: 'Test',
      description: 'Test',
      source: 'console',
      intent: 'Test',
      steps: [
        {
          id: 'step_1',
          type: 'trigger',
          appId: 'slack',
          actionId: 'message_received',
          connectionId: 'conn_1',
          inputs: {},
          position: { x: 400, y: 300 }
        }
      ]
    }

    const result = validateRoundTrip(spec)

    expect(result.roundTripValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should validate round-trip with complex spec', () => {
    const spec: AivoryWorkflowSpec = {
      name: 'Complex Workflow',
      description: 'A complex workflow with multiple steps',
      source: 'workflow-tab',
      intent: 'Send message and log',
      steps: [
        {
          id: 'step_1',
          type: 'trigger',
          appId: 'slack',
          actionId: 'message_received',
          connectionId: 'conn_1',
          inputs: { channel: '#general' },
          position: { x: 400, y: 300 }
        },
        {
          id: 'step_2',
          type: 'action',
          appId: 'gmail',
          actionId: 'send_email',
          connectionId: 'conn_2',
          inputs: { to: 'user@example.com', subject: 'Test' },
          position: { x: 400, y: 480 }
        },
        {
          id: 'step_3',
          type: 'ai',
          appId: 'openai',
          actionId: 'generate_text',
          connectionId: 'conn_3',
          inputs: { prompt: 'Summarize', model: 'gpt-4' },
          position: { x: 400, y: 660 }
        }
      ]
    }

    const result = validateRoundTrip(spec)

    expect(result.roundTripValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should validate round-trip preserves all properties', () => {
    const spec: AivoryWorkflowSpec = {
      name: 'Property Test',
      description: 'Test property preservation',
      source: 'console',
      intent: 'Test',
      steps: [
        {
          id: 'step_1',
          type: 'trigger',
          appId: 'slack',
          actionId: 'message_received',
          connectionId: 'conn_1',
          inputs: { channel: '#general', timeout: 5000, nested: { key: 'value' } },
          position: { x: 123, y: 456 }
        }
      ]
    }

    const serialized = serializeWorkflowSpec(spec)
    const parseResult = parseWorkflowSpec(serialized)

    expect(parseResult.spec?.steps[0].position.x).toBe(123)
    expect(parseResult.spec?.steps[0].position.y).toBe(456)
    expect(parseResult.spec?.steps[0].inputs.timeout).toBe(5000)
    expect(parseResult.spec?.steps[0].inputs.nested.key).toBe('value')
  })
})
