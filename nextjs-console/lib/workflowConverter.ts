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
  typeVersion: number | string
  position: [number, number]
  parameters: Record<string, any>
  id?: string
}

interface N8nWorkflow {
  name: string
  nodes: N8nNode[]
  connections: Record<string, any>
  settings: Record<string, any>
  description?: string
}

/**
 * Generate a UUID-like ID for n8n nodes
 */
function generateNodeId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Detect step type based on action and tool strings
 */
function detectStepType(action: string, tool: string): StepType {
  const text = `${action} ${tool}`.toLowerCase()

  if (text.includes('salesforce') || text.includes('crm')) return 'http_request'
  if (text.includes('sharepoint') || text.includes('document')) return 'http_request'
  if (text.includes('email') || text.includes('send') || text.includes('notification')) return 'email'
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
        typeVersion: 4.2,
        parameters: {
          method: 'POST',
          url: '', // User fills this
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
      return {
        ...baseNode,
        type: 'n8n-nodes-base.emailSend',
        typeVersion: 2.1,
        parameters: {
          fromEmail: '',
          toEmail: '',
          subject: `[Aivory] ${step.action}`,
          emailType: 'text',
          message: step.output || step.action,
          options: {},
        },
      }

    case 'slack':
      return {
        ...baseNode,
        type: 'n8n-nodes-base.slack',
        typeVersion: 2.3,
        parameters: {
          operation: 'message',
          channel: '',
          text: step.action,
          otherOptions: {},
        },
      }

    case 'openrouter':
      return {
        ...baseNode,
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        parameters: {
          method: 'POST',
          url: 'https://openrouter.ai/api/v1/chat/completions',
          authentication: 'genericCredentialType',
          genericAuthType: 'httpHeaderAuth',
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
        typeVersion: 1.1,
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
        typeVersion: 1.2,
        parameters: {
          rule: {
            interval: [{ field: 'hours', triggerAtHour: 9 }],
          },
        },
      }

    case 'postgres':
      return {
        ...baseNode,
        type: 'n8n-nodes-base.postgres',
        typeVersion: 2.4,
        parameters: {
          operation: 'executeQuery',
          query: '', // User fills this
          options: {},
        },
      }

    case 'webhook':
      return {
        ...baseNode,
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1.1,
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
        typeVersion: 3.4,
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
 * Build trigger node based on workflow trigger type
 */
function buildTriggerNode(trigger?: string): N8nNode {
  const text = (trigger || '').toLowerCase()

  if (text.includes('webhook') || text.includes('api call') || text.includes('request')) {
    return {
      name: 'Webhook Trigger',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 1.1,
      position: [250, 300],
      parameters: {
        path: 'aivory-workflow',
        responseMode: 'responseNode',
        method: 'POST',
      },
    }
  }

  if (text.includes('schedule') || text.includes('daily') || text.includes('cron')) {
    return {
      name: 'Schedule Trigger',
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1.2,
      position: [250, 300],
      parameters: {
        rule: {
          interval: [{ field: 'hours', triggerAtHour: 9 }],
        },
      },
    }
  }

  if (text.includes('email') || text.includes('inbox')) {
    return {
      name: 'Email Trigger',
      type: 'n8n-nodes-base.emailReadImap',
      typeVersion: 2.1,
      position: [250, 300],
      parameters: {
        operation: 'getEmails',
        mailbox: 'INBOX',
        options: {},
      },
    }
  }

  // Default: manual trigger
  return {
    name: 'Trigger',
    type: 'n8n-nodes-base.manualTrigger',
    typeVersion: 1,
    position: [250, 300],
    parameters: {},
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

  // 3. Build description with metadata
  const stepsNeedingAuth = nodes
    .filter((n) => ['http_request', 'email', 'slack', 'postgres'].includes(n.type.split('.')[1]))
    .map((n) => n.name)

  const description = [
    `Generated by Aivory`,
    workflow.company_name ? `Company: ${workflow.company_name}` : null,
    workflow.diagnostic_score ? `Diagnostic Score: ${workflow.diagnostic_score}` : null,
    workflow.created_at ? `Generated: ${new Date(workflow.created_at).toLocaleDateString()}` : null,
    stepsNeedingAuth.length > 0 ? `Steps requiring credential setup: ${stepsNeedingAuth.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join(' | ')

  return {
    name: workflow.title,
    nodes,
    connections,
    settings: { executionOrder: 'v1' },
    description,
  }
}
