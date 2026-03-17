/**
 * Smart workflow conversion library
 * Maps Aivory workflow steps to correct n8n native nodes with pre-filled parameters
 */

type StepType = 
  | 'http_request' 
  | 'email' 
  | 'slack' 
  | 'openrouter' 
  | 'if' 
  | 'wait' 
  | 'schedule' 
  | 'postgres'
  | 'webhook'
  | 'set'

interface WorkflowStep {
  step: number
  action: string
  tool: string
  output: string
}

interface AivoryWorkflow {
  workflow_id: string
  title: string
  trigger?: string
  trigger_description?: string
  steps: WorkflowStep[]
  company_name?: string
  diagnostic_score?: number
  created_at?: string
}

interface N8nNode {
  name: string
  type: string
  typeVersion: number   // must be an integer — n8n rejects floats
  position: [number, number]
  parameters: Record<string, any>
  id?: string
}

interface N8nWorkflow {
  name: string
  nodes: N8nNode[]
  connections: Record<string, any>
  settings: Record<string, any>
}

/**
 * Generate a UUID v4-like ID for n8n nodes (n8n requires UUID format)
 */
function generateNodeId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/**
 * Detect step type based on action and tool strings
 */
function detectStepType(action: string, tool: string): StepType {
  const text = `${action} ${tool}`.toLowerCase()

  if (text.includes('salesforce') || text.includes('crm')) return 'http_request'
  if (text.includes('sharepoint') || text.includes('document')) return 'http_request'
  // Email/notification/send → use generic httpRequest to avoid n8n SMTP credential errors.
  // Will be upgraded to emailSend once SMTP credentials are configured in n8n.
  if (text.includes('email') || text.includes('send') || text.includes('notification')) return 'http_request'
  if (text.includes('sap') || text.includes('erp')) return 'http_request'
  if (text.includes('slack')) return 'slack'
  if (text.includes('webhook') || text.includes('trigger')) return 'webhook'
  if (text.includes('ai') || text.includes('nlp') || text.includes('llm') || text.includes('openrouter') || text.includes('analyze')) return 'openrouter'
  if (text.includes('database') || text.includes('query') || text.includes('sql')) return 'postgres'
  if (text.includes('schedule') || text.includes('cron') || text.includes('daily')) return 'schedule'
  if (text.includes('condition') || text.includes('if') || text.includes('decision') || text.includes('flag') || text.includes('check')) return 'if'
  if (text.includes('wait') || text.includes('delay')) return 'wait'

  return 'set' // fallback
}

/**
 * Build n8n node based on step type with pre-filled parameters
 */
function buildN8nNode(step: WorkflowStep, index: number, type: StepType): N8nNode {
  const basePosition: [number, number] = [250 + (index * 220), 300]
  const nodeName = `Step ${index}: ${step.action.substring(0, 40)}`

  const baseNode = {
    name: nodeName,
    position: basePosition,
    id: generateNodeId(),
  }

  switch (type) {
    case 'http_request':
      return {
        ...baseNode,
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4,
        parameters: {
          method: 'POST',
          url: 'https://example.com/aivory-placeholder',
          authentication: 'none',
          sendBody: true,
          specifyBody: 'json',
          jsonBody: JSON.stringify(
            {
              action: step.action,
              tool: step.tool,
              output: step.output,
            },
            null,
            2
          ),
          options: {},
        },
      }

    case 'email':
      // Use generic httpRequest instead of emailSend to avoid SMTP credential errors.
      // Placeholder URL — replace with actual email API when ready.
      return {
        ...baseNode,
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4,
        parameters: {
          method: 'POST',
          url: 'https://example.com/api/send-email',
          authentication: 'none',
          sendBody: true,
          specifyBody: 'json',
          jsonBody: JSON.stringify(
            {
              to: '={{$json["email"] || "test@example.com"}}',
              subject: `[Aivory] ${step.action}`,
              body: step.output || step.action,
            },
            null,
            2
          ),
          options: {},
        },
      }

    case 'slack':
      // Use generic httpRequest instead of native Slack node to avoid OAuth credential errors.
      return {
        ...baseNode,
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4,
        parameters: {
          method: 'POST',
          url: 'https://example.com/api/slack-message',
          authentication: 'none',
          sendBody: true,
          specifyBody: 'json',
          jsonBody: JSON.stringify(
            {
              channel: '',
              text: step.action,
            },
            null,
            2
          ),
          options: {},
        },
      }

    case 'openrouter':
      return {
        ...baseNode,
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4,
        parameters: {
          method: 'POST',
          url: 'https://openrouter.ai/api/v1/chat/completions',
          authentication: 'none',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: 'Authorization', value: 'Bearer {{$env.OPENROUTER_API_KEY}}' },
              { name: 'Content-Type', value: 'application/json' },
            ],
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: JSON.stringify(
            {
              model: 'qwen/qwen-2.5-72b-instruct',
              messages: [
                { role: 'system', content: 'You are an AI assistant.' },
                { role: 'user', content: '={{ $json.input }}' },
              ],
            },
            null,
            2
          ),
          options: {},
        },
      }

    case 'if':
      return {
        ...baseNode,
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
            conditions: [
              {
                leftValue: '={{ $json.status }}',
                rightValue: 'complete',
                operator: { type: 'string', operation: 'equals' },
              },
            ],
            combinator: 'and',
          },
        },
      }

    case 'wait':
      return {
        ...baseNode,
        type: 'n8n-nodes-base.wait',
        typeVersion: 1,
        parameters: {
          resume: 'timeInterval',
          unit: 'hours',
          amount: 1,
        },
      }

    case 'schedule':
      return {
        ...baseNode,
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1,
        parameters: {
          rule: {
            interval: [{ field: 'hours', triggerAtHour: 9 }],
          },
        },
      }

    case 'postgres':
      // Use generic httpRequest instead of native Postgres node to avoid credential errors.
      return {
        ...baseNode,
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4,
        parameters: {
          method: 'POST',
          url: 'https://example.com/api/database-query',
          authentication: 'none',
          sendBody: true,
          specifyBody: 'json',
          jsonBody: JSON.stringify(
            {
              query: step.action,
              tool: step.tool || 'database',
            },
            null,
            2
          ),
          options: {},
        },
      }

    case 'webhook':
      return {
        ...baseNode,
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        parameters: {
          path: step.tool.toLowerCase().replace(/\s+/g, '-'),
          responseMode: 'responseNode',
          method: 'POST',
        },
      }

    case 'set':
    default:
      return {
        ...baseNode,
        type: 'n8n-nodes-base.set',
        typeVersion: 3,
        parameters: {
          assignments: {
            assignments: [
              { name: 'action', value: step.action, type: 'string' },
              { name: 'tool', value: step.tool || '', type: 'string' },
              { name: 'output', value: step.output || '', type: 'string' },
            ],
          },
          options: {},
        },
      }
  }
}

/**
 * Build trigger node based on workflow trigger type.
 * Always uses the Aivory webhook V2 trigger so workflows are accessible
 * via the shared webhook endpoint.
 */
function buildTriggerNode(trigger?: string): N8nNode {
  // Always use the Aivory webhook V2 trigger
  return {
    id: generateNodeId(),
    name: 'Webhook Trigger',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 1,
    position: [250, 300],
    parameters: {
      path: '0f137ee4-ef4a-43f1-96d9-e9ea3488805b',
      responseMode: 'lastNode',
      httpMethod: 'POST',
    },
  }
}

/**
 * Convert Aivory workflow to n8n format with smart node detection
 */
export function convertToN8nWorkflow(workflow: AivoryWorkflow): N8nWorkflow {
  const nodes: N8nNode[] = []
  const connections: Record<string, any> = {}

  // 1. Add trigger node
  const triggerNode = buildTriggerNode(workflow.trigger)
  nodes.push(triggerNode)

  // 2. Add step nodes with smart type detection
  workflow.steps.forEach((step, i) => {
    const stepType = detectStepType(step.action, step.tool)
    const stepNode = buildN8nNode(step, i + 1, stepType)
    nodes.push(stepNode)

    // Connect previous node → this node
    const prevNodeName = i === 0 ? triggerNode.name : `Step ${i}: ${workflow.steps[i - 1].action.substring(0, 40)}`
    connections[prevNodeName] = {
      main: [[{ node: stepNode.name, type: 'main', index: 0 }]],
    }
  })

  // 3. Return the workflow payload
  // NOTE: do NOT include `active` — n8n treats it as read-only on POST/PUT
  // and returns 400 "request/body/active is read-only".
  // Activation is done separately via POST /workflows/:id/activate.
  return {
    name: workflow.title,
    nodes,
    connections,
    settings: { executionOrder: 'v1' },
  }
}
