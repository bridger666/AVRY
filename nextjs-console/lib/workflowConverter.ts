/**
 * Smart workflow conversion library
 * Maps Aivory workflow steps to correct n8n native nodes with pre-filled parameters.
 *
 * Uses nodeMapper engine for universal intent detection:
 *   detectNodeIntent() → identifies step intent (email, http, ai, respond, etc.)
 *   mapIntentToN8nNode() → builds the correct n8n node with proper parameters
 *
 * Trigger node always uses Webhook with auto-generated path.
 */

import { detectNodeIntent, mapIntentToN8nNode } from '@/lib/workflows/nodeMapper'
import type { NodeIntent, MapContext } from '@/lib/workflows/nodeMapper'

interface WorkflowStep {
  step: number
  action: string
  tool: string
  output: string
  inputs?: { url?: string; [key: string]: any }
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
  typeVersion: number
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
 * Convert Aivory workflow to n8n format using the nodeMapper engine.
 *
 * Each step is classified via detectNodeIntent() then mapped to a fully
 * configured n8n node via mapIntentToN8nNode().
 */
export function convertToN8nWorkflow(workflow: AivoryWorkflow): N8nWorkflow {
  const nodes: N8nNode[] = []
  const connections: Record<string, any> = {}

  // 1. Trigger node — always Webhook with auto-generated path
  const uniquePath = workflow.workflow_id
    ? `aivory-${workflow.workflow_id}-${Date.now()}`
    : `aivory-${Date.now()}`

  const triggerNode: N8nNode = {
    id: generateNodeId(),
    name: 'Webhook Trigger',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 1,
    position: [250, 300],
    parameters: {
      httpMethod: 'POST',
      path: uniquePath,
      responseMode: 'responseNode',
    },
  }
  nodes.push(triggerNode)

  // 2. Step nodes — classified via nodeMapper engine
  let aiNodeCount = 0
  const stepCount = workflow.steps.length

  workflow.steps.forEach((step, i) => {
    const isLast = i === stepCount - 1

    // Detect intent — last step defaults to 'respond' unless it has a specific channel intent
    let intent: NodeIntent = detectNodeIntent(step.action, step.tool)
    console.log(`[workflowConverter] Step ${i}: action="${step.action}" tool="${step.tool}" → intent="${intent}" isLast=${isLast}`)
    if (isLast && intent !== 'respond' && intent !== 'filter' && intent !== 'email' && intent !== 'messaging') {
      console.log(`[workflowConverter] Step ${i}: overriding intent from "${intent}" to "respond" (last step)`)
      intent = 'respond'
    }

    const ctx: MapContext = { stepIndex: i, aiNodeCount, isLast }
    const stepNode = mapIntentToN8nNode(intent, step, ctx)
    console.log(`[workflowConverter] Step ${i}: mapped to n8n type="${stepNode.type}" typeVersion=${stepNode.typeVersion}`)

    // Track AI nodes for input expression selection
    if (intent === 'ai') aiNodeCount++

    nodes.push(stepNode)

    // Connect previous node → this node
    const prevName = i === 0
      ? triggerNode.name
      : `Step ${i}: ${workflow.steps[i - 1].action.substring(0, 40)}`
    connections[prevName] = {
      main: [[{ node: stepNode.name, type: 'main', index: 0 }]],
    }
  })

  return {
    name: workflow.title,
    nodes,
    connections,
    settings: { executionOrder: 'v1' },
  }
}
