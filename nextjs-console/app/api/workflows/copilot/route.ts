/**
 * POST /api/workflows/copilot
 * Multi-mode AIRA copilot for the Workflows tab.
 *
 * mode: 'chat'     → natural language answer (no JSON parsing)
 * mode: 'workflow' → structured AivoryWorkflowSpec JSON
 * mode: 'refine'   → modify existing workflow spec
 * mode: 'explain'  → explain what a workflow does
 *
 * All modes call /bridge/aira → Zeroclaw → OpenRouter.
 * The mode is passed in the request body and controls how the response is handled.
 */

import { NextRequest } from 'next/server'
import { getConfig } from '@/lib/config'
import {
  AivoryWorkflowSpec,
  AivoryWorkflowEdge,
  CopilotResult,
  WorkflowStep,
} from '@/types/workflows'
import {
  validateTriggerExists,
  validateAppConnections,
  validateConnectionStatus,
  detectCycles,
  ValidationError,
} from '@/lib/workflowValidation'

export const maxDuration = 120

// ── System prompts ────────────────────────────────────────────────────────────

const CHAT_SYSTEM_PROMPT = `You are AIRA, the automation and AI copilot inside Aivory.
Your job is to help users design, understand, and operate business automations and workflows.

You are in CHAT / EXPERT mode.
Answer in natural language only — paragraphs, bullet points, examples.
Do NOT output raw JSON workflow specs or code blocks that Aivory is expected to parse.
Be concise, practical, and specific to the user's question.
You may reference the current workflow context if provided.`

const WORKFLOW_SYSTEM_PROMPT = `You are AIRA, the automation and AI copilot inside Aivory.
Your job is to generate structured workflow specs that Aivory can deploy to n8n.

You are in WORKFLOW BUILDER mode.
Respond ONLY with strict JSON matching this schema — no markdown, no code fences, no commentary:
{
  "steps": [
    { "id": "step_1", "type": "trigger", "title": "...", "description": "..." },
    { "id": "step_2", "type": "action",  "title": "...", "description": "..." }
  ],
  "estimate_hours": 2,
  "automation_score": 0.75
}
Rules:
- First step MUST be type "trigger".
- Use "action" for data processing, API calls, AI analysis, task creation.
- Use "condition" for branching logic, validation, flagging.
- Use "channel" for notifications, emails, messages.
- Keep titles concise (max 8 words). Descriptions: 1 sentence.
- Return 3–8 steps total.
- Output ONLY the JSON object. Nothing else.`

const REFINE_SYSTEM_PROMPT = `You are AIRA, the automation and AI copilot inside Aivory.
Your job is to refine and modify existing workflow specs.

You are in REFINE mode.
Given a current workflow and a user's refinement request, generate a modified workflow spec.
Respond ONLY with strict JSON matching this schema — no markdown, no code fences, no commentary:
{
  "name": "Updated Workflow Title",
  "description": "Updated description",
  "steps": [
    {
      "id": "step_1",
      "type": "trigger",
      "appId": "app_name",
      "actionId": "action_name",
      "connectionId": "conn_id",
      "inputs": {},
      "position": { "x": 400, "y": 300 }
    }
  ],
  "edges": [
    { "from": "step_1", "to": "step_2" }
  ],
  "changes": {
    "added": ["step_3"],
    "modified": ["step_1"],
    "removed": []
  }
}

Rules:
- Preserve existing step IDs when possible.
- Use new IDs (step_N) for added steps.
- Include all steps in the output (added, modified, and unchanged).
- Update positions to maintain layout (trigger at 400,300, then y+=180).
- Output ONLY the JSON object. Nothing else.`

const EXPLAIN_SYSTEM_PROMPT = `You are AIRA, the automation and AI copilot inside Aivory.
Your job is to explain what workflows do in clear, human-readable language.

You are in EXPLAIN mode.
Analyze the provided workflow and explain what it does.
Respond ONLY with strict JSON matching this schema — no markdown, no code fences, no commentary:
{
  "purpose": "One sentence describing the overall workflow purpose",
  "steps": [
    {
      "id": "step_1",
      "title": "Step title",
      "description": "What this step does"
    }
  ],
  "dataFlow": "How data moves between steps",
  "assumptions": ["Assumption 1", "Assumption 2"],
  "limitations": ["Limitation 1"]
}

Rules:
- Be concise and practical.
- Explain each step in 1-2 sentences.
- Describe data flow between steps.
- List any assumptions or limitations.
- Output ONLY the JSON object. Nothing else.`

// ── JSON extraction helper ────────────────────────────────────────────────────

function extractJsonObject(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch) {
    const candidate = fenceMatch[1].trim()
    if (candidate.startsWith('{')) return candidate
  }
  const start = text.indexOf('{')
  if (start === -1) return text.trim()
  let depth = 0
  let end = -1
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}') {
      depth--
      if (depth === 0) { end = i; break }
    }
  }
  if (end !== -1) return text.slice(start, end + 1)
  return text.trim()
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, mode = 'chat', workflowContext, currentWorkflow, intent } = body

    if (!description || typeof description !== 'string' || !description.trim()) {
      return Response.json({ error: true, message: 'description is required' }, { status: 400 })
    }

    if (!['chat', 'workflow', 'refine', 'explain'].includes(mode)) {
      return Response.json(
        { error: true, message: 'mode must be "chat", "workflow", "refine", or "explain"' },
        { status: 400 }
      )
    }

    // Refine mode requires currentWorkflow and intent
    if (mode === 'refine') {
      if (!currentWorkflow) {
        return Response.json(
          { error: true, message: 'currentWorkflow is required for refine mode' },
          { status: 400 }
        )
      }
      if (!intent || typeof intent !== 'string' || !intent.trim()) {
        return Response.json(
          { error: true, message: 'intent is required for refine mode' },
          { status: 400 }
        )
      }
    }

    // Explain mode requires currentWorkflow
    if (mode === 'explain') {
      if (!currentWorkflow) {
        return Response.json(
          { error: true, message: 'currentWorkflow is required for explain mode' },
          { status: 400 }
        )
      }
    }

    let config: ReturnType<typeof getConfig>
    try {
      config = getConfig()
    } catch (e) {
      console.error('[copilot] Config error:', e)
      return Response.json({ error: true, message: 'Server misconfiguration: missing env vars' }, { status: 500 })
    }

    let systemPrompt: string
    let userMessage: string

    // Build system prompt and user message based on mode
    if (mode === 'chat') {
      systemPrompt = CHAT_SYSTEM_PROMPT
      userMessage = description.trim()
      if (workflowContext) {
        userMessage = `Current workflow context:\n${JSON.stringify(workflowContext, null, 2)}\n\nUser request:\n${userMessage}`
      }
    } else if (mode === 'workflow') {
      systemPrompt = WORKFLOW_SYSTEM_PROMPT
      userMessage = description.trim()
      if (workflowContext) {
        userMessage = `Current workflow context:\n${JSON.stringify(workflowContext, null, 2)}\n\nUser request:\n${userMessage}`
      }
    } else if (mode === 'refine') {
      systemPrompt = REFINE_SYSTEM_PROMPT
      userMessage = `Current workflow:\n${JSON.stringify(currentWorkflow, null, 2)}\n\nRefinement request:\n${intent.trim()}`
    } else {
      // explain mode
      systemPrompt = EXPLAIN_SYSTEM_PROMPT
      userMessage = `Workflow to explain:\n${JSON.stringify(currentWorkflow, null, 2)}`
    }

    const bridgeUrl = `${config.VPS_BRIDGE_URL}/bridge/aira`
    console.log(`[copilot] mode=${mode} calling bridge:`, bridgeUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 115000)

    let bridgeResponse: Response
    try {
      bridgeResponse = await fetch(bridgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': config.VPS_BRIDGE_API_KEY,
        },
        body: JSON.stringify({
          message: `${systemPrompt}\n\n${userMessage}`,
          context: { source: 'workflow_copilot', mode, page: 'workflows' },
        }),
        signal: controller.signal,
      })
    } catch (fetchErr) {
      clearTimeout(timeoutId)
      if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
        return Response.json({ error: true, message: 'Request timed out' }, { status: 504 })
      }
      console.error('[copilot] Bridge unreachable:', fetchErr)
      return Response.json(
        { error: true, message: 'Could not reach AI bridge — is the VPS bridge running?' },
        { status: 502 }
      )
    } finally {
      clearTimeout(timeoutId)
    }

    if (!bridgeResponse.ok) {
      const rawErr = await bridgeResponse.text()
      console.error('[copilot] Bridge error body:', rawErr.slice(0, 500))
      let msg = 'Bridge error'
      try {
        const e = JSON.parse(rawErr)
        msg = e.message || e.detail || msg
      } catch {
        /* not JSON */
      }
      return Response.json({ error: true, message: msg }, { status: bridgeResponse.status })
    }

    const rawBody = await bridgeResponse.text()
    console.log('[copilot] Bridge raw body (first 500):', rawBody.slice(0, 500))

    let bridgeData: { raw_agent_response?: string }
    try {
      bridgeData = JSON.parse(rawBody)
    } catch {
      console.error('[copilot] Bridge returned non-JSON body')
      return Response.json(
        { error: true, message: 'Bridge returned unexpected response format' },
        { status: 502 }
      )
    }

    const rawText = bridgeData.raw_agent_response ?? ''
    if (!rawText.trim()) {
      console.error('[copilot] raw_agent_response is empty')
      return Response.json({ error: true, message: 'AI returned empty response' }, { status: 500 })
    }

    // ── Chat mode: return plain text ──────────────────────────────────────────
    if (mode === 'chat') {
      return Response.json({ mode: 'chat', content: rawText.trim() })
    }

    // ── Workflow mode: parse and validate JSON ────────────────────────────────
    if (mode === 'workflow') {
      const cleaned = extractJsonObject(rawText)
      console.log('[copilot] Extracted JSON (first 300):', cleaned.slice(0, 300))

      let parsed: { steps?: unknown[]; estimate_hours?: number; automation_score?: number }
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        console.error('[copilot] Failed to parse AI response as workflow JSON:', rawText.slice(0, 500))
        return Response.json(
          { error: true, message: 'AI did not return a valid workflow. Try rephrasing your request.' },
          { status: 500 }
        )
      }

      if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
        return Response.json(
          { error: true, message: 'AI returned no workflow steps. Try being more specific.' },
          { status: 500 }
        )
      }

      return Response.json({
        mode: 'workflow',
        steps: parsed.steps,
        estimate_hours: parsed.estimate_hours ?? null,
        automation_score: parsed.automation_score ?? null,
      })
    }

    // ── Refine mode: parse and validate modified spec ────────────────────────
    if (mode === 'refine') {
      const cleaned = extractJsonObject(rawText)
      console.log('[copilot] Extracted JSON (first 300):', cleaned.slice(0, 300))

      let parsed: any
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        console.error('[copilot] Failed to parse AI response as refined spec:', rawText.slice(0, 500))
        return Response.json(
          { error: true, message: 'AI did not return a valid workflow. Try rephrasing your request.' },
          { status: 500 }
        )
      }

      // Validate parsed response structure
      if (!parsed.name || typeof parsed.name !== 'string') {
        return Response.json(
          { error: true, message: 'Generated workflow missing name' },
          { status: 500 }
        )
      }

      if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
        return Response.json(
          { error: true, message: 'AI returned no workflow steps' },
          { status: 500 }
        )
      }

      // Build spec and edges
      const spec: AivoryWorkflowSpec = {
        name: parsed.name,
        description: parsed.description || currentWorkflow.description,
        source: 'copilot',
        intent: intent.trim(),
        steps: parsed.steps as WorkflowStep[],
      }

      const edges: AivoryWorkflowEdge[] = parsed.edges || []

      // Validate refined spec
      const availableAppIds: string[] = [...new Set(
        currentWorkflow.steps.map((s: WorkflowStep) => s.appId).filter(Boolean) as string[]
      )]
      const connectionStatus: Record<string, boolean> = {}
      currentWorkflow.steps.forEach((s: WorkflowStep) => {
        if (s.connectionId) connectionStatus[s.connectionId] = true
      })

      const triggerError = validateTriggerExists(spec)
      if (triggerError) {
        return Response.json(
          { error: true, message: triggerError.reason },
          { status: 400 }
        )
      }

      const appError = validateAppConnections(spec, availableAppIds)
      if (appError) {
        return Response.json(
          { error: true, message: appError.reason },
          { status: 400 }
        )
      }

      const stepIds = spec.steps.map((step) => step.id)
      const cycleError = detectCycles(edges, stepIds)
      if (cycleError) {
        return Response.json(
          { error: true, message: cycleError.reason },
          { status: 400 }
        )
      }

      const result: CopilotResult = {
        spec,
        edges,
        changes: parsed.changes || { added: [], modified: [], removed: [] },
      }

      return Response.json({ mode: 'refine', ...result })
    }

    // ── Explain mode: parse and return explanation ─────────────────────────────
    if (mode === 'explain') {
      const cleaned = extractJsonObject(rawText)
      console.log('[copilot] Extracted JSON (first 300):', cleaned.slice(0, 300))

      let parsed: any
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        console.error('[copilot] Failed to parse AI response as explanation:', rawText.slice(0, 500))
        return Response.json(
          { error: true, message: 'AI did not return a valid explanation. Try again.' },
          { status: 500 }
        )
      }

      if (!parsed.purpose || typeof parsed.purpose !== 'string') {
        return Response.json(
          { error: true, message: 'AI did not provide a workflow purpose' },
          { status: 500 }
        )
      }

      return Response.json({
        mode: 'explain',
        purpose: parsed.purpose,
        steps: parsed.steps || [],
        dataFlow: parsed.dataFlow || '',
        assumptions: parsed.assumptions || [],
        limitations: parsed.limitations || [],
      })
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return Response.json({ error: true, message: 'Request timed out' }, { status: 504 })
    }
    console.error('[copilot] error:', error)
    return Response.json({ error: true, message: 'Internal error' }, { status: 500 })
  }
}
