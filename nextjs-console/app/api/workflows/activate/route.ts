import { NextRequest, NextResponse } from 'next/server'
import { convertToN8nWorkflow } from '@/lib/workflowConverter'

export const maxDuration = 30

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

export async function POST(request: NextRequest) {
  try {
    const { workflow_id, workflow_data } = await request.json()

    if (!workflow_id || !workflow_data) {
      return NextResponse.json({ error: 'Missing workflow_id or workflow_data' }, { status: 400 })
    }

    const n8nUrl = process.env.N8N_URL || 'http://43.156.108.96:3003'
    const n8nApiKey = process.env.N8N_API_KEY

    if (!n8nApiKey) {
      return NextResponse.json({ error: 'N8N_API_KEY not configured' }, { status: 500 })
    }

    // Use smart workflow converter instead of manual conversion
    const n8nPayload = convertToN8nWorkflow(workflow_data as AivoryWorkflow)

    // Auto-generate unique webhook path for the trigger node
    const uniquePath = `aivory-${workflow_id}-${Date.now()}`
    const webhookNode = n8nPayload.nodes.find(
      (n: any) => n.type === 'n8n-nodes-base.webhook'
    )
    if (webhookNode) {
      webhookNode.parameters.path = uniquePath
      webhookNode.parameters.httpMethod = 'POST'
    }

    console.log('[activate] Converting workflow with smart node detection:', {
      title: n8nPayload.name,
      nodeCount: n8nPayload.nodes.length,
      nodeTypes: n8nPayload.nodes.map((n: any) => n.type).join(', '),
      triggerPath: n8nPayload.nodes[0]?.parameters?.path || 'none',
    })
    // Log each node's type + parameters for debugging email node issue
    n8nPayload.nodes.forEach((n: any, i: number) => {
      console.log(`[activate] Node ${i}: type=${n.type} typeVersion=${n.typeVersion} name="${n.name}"`)
      if (n.type === 'n8n-nodes-base.emailSend') {
        console.log(`[activate] EMAIL NODE PARAMS:`, JSON.stringify(n.parameters, null, 2))
      }
    })
    console.log('[activate] Full n8n payload:', JSON.stringify(n8nPayload, null, 2).slice(0, 3000))

    // 1. Create workflow in n8n
    const createRes = await fetch(`${n8nUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': n8nApiKey,
      },
      body: JSON.stringify(n8nPayload),
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      console.error('[activate] n8n create failed:', createRes.status, errText)
      return NextResponse.json(
        { error: `n8n rejected workflow: ${createRes.status}` },
        { status: 502 }
      )
    }

    const created = await createRes.json()
    const n8nWorkflowId = created.id

    // 2. Activate the workflow
    const activateRes = await fetch(`${n8nUrl}/api/v1/workflows/${n8nWorkflowId}/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': n8nApiKey,
      },
    })

    if (!activateRes.ok) {
      console.warn('[activate] n8n activate failed (workflow created but not activated):', activateRes.status)
    }

    const n8nWorkflowUrl = `${n8nUrl}/workflow/${n8nWorkflowId}`

    console.log('[activate] Workflow activated successfully:', {
      n8nWorkflowId,
      nodeCount: n8nPayload.nodes.length,
    })

    const n8nBaseUrl = process.env.N8N_URL || 'http://43.156.108.96:3003'
    const n8nWebhookUrl = webhookNode
      ? `${n8nBaseUrl}/webhook/${uniquePath}`
      : null

    return NextResponse.json({
      success: true,
      n8n_workflow_id: n8nWorkflowId,
      n8n_url: n8nWorkflowUrl,
      n8nWebhookUrl,
    })
  } catch (error) {
    console.error('[activate] unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    )
  }
}
