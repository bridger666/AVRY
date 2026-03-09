/**
 * API Endpoint Handlers
 * Individual endpoint implementations for console, diagnostics, and blueprints
 */

console.log('[endpoints.js] Loading module');
const { sendRequest, sendStreamingRequest, healthCheck } = require('./openrouterClient');
const { sendToGateway } = require('./gatewayClient');
const { callN8N } = require('./n8nClient');
console.log('[endpoints.js] sendStreamingRequest type:', typeof sendStreamingRequest);
const { MODEL_ROUTING, config } = require('./config');
const https = require('https');
const http = require('http');
const { logger } = require('./logger');

// ============================================================================
// CONSOLE CHAT STREAMING ENDPOINT
// ============================================================================

/**
 * POST /console/stream
 * Streams AI console responses using Server-Sent Events
 */
async function handleConsoleStream(req, res, next) {
  console.log('[console/stream] handler hit');
  console.log('[console/stream] req.body:', JSON.stringify(req.body));
  console.log('[console/stream] messages received:', JSON.stringify(req.body.messages, null, 2));
  
  try {
    const { session_id, messages } = req.body;
    
    // Validate required fields
    if (!session_id) {
      const error = new Error('Missing required field: session_id');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      error.details = { field: 'session_id', expected: 'string' };
      return next(error);
    }
    
    if (!messages || !Array.isArray(messages)) {
      const error = new Error('Missing or invalid field: messages (expected array)');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      error.details = { field: 'messages', expected: 'array' };
      return next(error);
    }
    
    const routing = MODEL_ROUTING['/console/stream'];
    console.log('[console/stream] routing:', routing);
    console.log('[console/stream] sendStreamingRequest type:', typeof sendStreamingRequest);
    
    console.log('[console/stream] calling sendStreamingRequest with params:', {
      model: routing.model,
      useCase: routing.useCase,
      messagesLength: messages.length,
      requestId: req.requestId
    });
    
    // Set SSE headers BEFORE calling sendStreamingRequest
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Forward to OpenRouter with streaming
    await sendStreamingRequest(
      routing.model,
      routing.useCase,
      messages,
      res,
      req.requestId
    );
    
    console.log('[console/stream] sendStreamingRequest completed');
    
  } catch (error) {
    console.error('[console/stream] unhandled error:', error);
    // Only call next(error) if headers haven't been sent yet
    // (SSE headers are set before streaming starts, so errors mid-stream can't use next())
    if (!res.headersSent) {
      next(error);
    } else {
      // Headers already sent — write error event and end the stream
      try {
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message || 'Stream failed' })}\n\n`);
        res.end();
      } catch (writeErr) {
        console.error('[console/stream] failed to write error to stream:', writeErr);
      }
    }
  }
}

// ============================================================================
// FLOATING AIRA STREAMING ENDPOINT (Zeroclaw-orchestrated)
// ============================================================================

/**
 * POST /aria/stream
 * Streams AIRA responses for the floating assistant tab.
 * Primary path: Zeroclaw /webhook → streams back to client.
 * Fallback path: OpenRouter direct (if Zeroclaw unreachable).
 *
 * Immediately sends a "thinking" chunk so the client never hits idle timeout.
 */
async function handleAiraStream(req, res, next) {
  console.log('[aria/stream] handler hit');

  const { session_id, organization_id, messages, context } = req.body;

  if (!session_id || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: true, code: 'BAD_REQUEST', message: 'session_id and messages are required' });
  }

  // Set SSE headers immediately so the client knows the connection is alive
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // FIXED: STREAM HEARTBEAT — send an immediate acknowledgement chunk within ~100ms
  // This prevents the client-side idle timer from firing before the LLM responds
  res.write(`data: ${JSON.stringify({ type: 'chunk', content: '' })}\n\n`);

  // Start a heartbeat interval — sends SSE comment pings every 8s
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { /* stream closed */ }
  }, 8000);

  const cleanup = () => clearInterval(heartbeat);

  // ── Try Zeroclaw first ──────────────────────────────────────────────────
  const zeroclawUrl = config.zeroclawUrl;
  const zeroclawToken = config.zeroclawToken;
  const lastUserMessage = messages[messages.length - 1]?.content || '';

  const zeroclawPayload = {
    message: lastUserMessage,
    tenantId: organization_id || 'demo_org',
    userId: session_id,
    source: 'ai_roadmap_floating_aira',
    intent: 'aivory_assistant',
    specVersion: '1.0.0',
    assistant: {
      entryPoint: 'floating_tab',
      context: context || { page: 'unknown' }
    },
    options: { mode: 'interactive', stream: true },
    // Pass conversation history so Zeroclaw has context
    history: messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
  };

  // Attempt Zeroclaw streaming
  const zeroclawReachable = zeroclawUrl && zeroclawToken;
  if (zeroclawReachable) {
    try {
      const axios = require('axios');
      const zeroclawRes = await axios.post(
        `${zeroclawUrl}/webhook`,
        zeroclawPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${zeroclawToken}`
          },
          responseType: 'stream',
          timeout: config.zeroclawTimeout
        }
      );

      let buffer = '';
      zeroclawRes.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed === 'data: [DONE]') {
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              // Zeroclaw may send OpenAI-style delta or our own chunk format
              const content =
                parsed?.choices?.[0]?.delta?.content ||
                parsed?.content ||
                parsed?.text ||
                null;
              if (content) {
                res.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`);
              } else if (parsed?.type === 'done') {
                res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
              } else if (parsed?.type === 'error') {
                res.write(`data: ${JSON.stringify({ type: 'error', error: parsed.error || 'Zeroclaw error' })}\n\n`);
              }
            } catch {
              // Plain text token
              const text = trimmed.slice(6).trim();
              if (text) res.write(`data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`);
            }
          }
        }
      });

      zeroclawRes.data.on('end', () => {
        cleanup();
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
      });

      zeroclawRes.data.on('error', (err) => {
        console.error('[aria/stream] Zeroclaw stream error:', err.message);
        cleanup();
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Zeroclaw stream error' })}\n\n`);
        res.end();
      });

      return; // Zeroclaw is handling it — don't fall through to OpenRouter
    } catch (err) {
      console.warn('[aria/stream] Zeroclaw unreachable, falling back to OpenRouter:', err.message);
      // Fall through to OpenRouter fallback below
    }
  }

  // ── Fallback: OpenRouter direct (same as /console/stream) ───────────────
  console.log('[aria/stream] using OpenRouter fallback');
  try {
    const routing = MODEL_ROUTING['/console/stream'];
    // sendStreamingRequest writes directly to res — pass res as the stream
    await sendStreamingRequest(routing.model, routing.useCase, messages, res, req.requestId || 'aira-fallback');
  } catch (err) {
    console.error('[aria/stream] OpenRouter fallback error:', err.message);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'AI engine error' })}\n\n`);
      res.end();
    }
  } finally {
    cleanup();
  }
}

// ============================================================================
// DEEP DIAGNOSTIC ENDPOINT
// ============================================================================

/**
 * POST /diagnostics/run
 * Processes deep diagnostic requests and returns DiagnosticResult
 */
async function handleDeepDiagnostic(req, res, next) {
  try {
    const { mode, phases, diagnostic_payload } = req.body;
    
    // Validate required fields
    if (mode !== 'deep') {
      const error = new Error('Invalid mode: expected "deep"');
      error.statusCode = 422;
      error.errorCode = 'VALIDATION_ERROR';
      error.details = { field: 'mode', expected: 'deep', received: mode };
      return next(error);
    }
    
    // Accept either `phases` (new shape) or `diagnostic_payload` (legacy shape)
    const payload = phases || diagnostic_payload;
    
    if (!payload) {
      const error = new Error('Missing required field: phases');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      error.details = { field: 'phases', expected: 'object' };
      return next(error);
    }

    const routing = MODEL_ROUTING['/diagnostics/run'];

    // Call OpenRouter directly (bypasses n8n which returns empty responses)
    const result = await sendRequest(
      routing.model,
      routing.useCase,
      JSON.stringify(payload, null, 2),
      req.requestId,
      true // validate + repair JSON
    );

    console.log('[deep_diag result raw]', JSON.stringify(result));

    // Helper to ensure arrays
    function ensureArray(value) {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    }

    // Generate a guaranteed-unique diagnostic_id server-side
    const { v4: uuidv4 } = require('uuid');
    const diagnosticId = `DIAG_${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;

    // Normalize to the shape the frontend expects
    const normalizedResult = {
      ...result,
      diagnostic_id: diagnosticId,
      ai_readiness_score: result.ai_readiness_score || result.score || 0,
      score: result.ai_readiness_score || result.score || 0,
      maturity_level: result.maturity_level || 'Emerging',
      strengths: ensureArray(result.strengths),
      primary_constraints: ensureArray(result.primary_constraints),
      automation_opportunities: ensureArray(result.automation_opportunities),
      blockers: ensureArray(result.primary_constraints || result.blockers),
      opportunities: ensureArray(result.automation_opportunities || result.opportunities),
      narrative_summary: result.narrative_summary || result.narrative || '',
      recommended_next_step: result.recommended_next_step || '',
    };

    console.log('[deep_diag result normalized]', JSON.stringify(normalizedResult));

    res.json(normalizedResult);
    
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// FREE DIAGNOSTIC ENDPOINT
// ============================================================================

/**
 * POST /diagnostics/free/run
 * Processes free diagnostic (12 questions) and returns DiagnosticResult
 */
async function handleFreeDiagnostic(req, res, next) {
  try {
    const { mode, answers, language } = req.body;
    
    // Validate required fields
    if (mode !== 'free') {
      const error = new Error('Invalid mode: expected "free"');
      error.statusCode = 422;
      error.errorCode = 'VALIDATION_ERROR';
      error.details = { field: 'mode', expected: 'free', received: mode };
      return next(error);
    }
    
    if (!answers || typeof answers !== 'object') {
      const error = new Error('Missing or invalid field: answers (expected object)');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      error.details = { field: 'answers', expected: 'object' };
      return next(error);
    }
    
    // Validate answers structure (should have 12 questions)
    const answerKeys = Object.keys(answers);
    if (answerKeys.length !== 12) {
      const error = new Error(`Invalid answers: expected 12 questions, got ${answerKeys.length}`);
      error.statusCode = 422;
      error.errorCode = 'VALIDATION_ERROR';
      error.details = { field: 'answers', expected: 12, received: answerKeys.length };
      return next(error);
    }
    
    // Validate each answer value (should be 0-3)
    for (const questionId in answers) {
      const value = answers[questionId];
      if (typeof value !== 'number' || value < 0 || value > 3) {
        const error = new Error(`Invalid answer for ${questionId}: must be 0-3`);
        error.statusCode = 422;
        error.errorCode = 'VALIDATION_ERROR';
        error.details = { field: questionId, expected: '0-3', received: value };
        return next(error);
      }
    }
    
    const routing = MODEL_ROUTING['/diagnostics/free/run'];
    
    // Convert answers to diagnostic payload for LLM
    const userContent = JSON.stringify({
      mode: 'free',
      answers,
      language: language || 'en'
    }, null, 2);
    
    // Forward to n8n free diagnostic webhook
    const n8nResult = await callN8N('free_diag', userContent);
    if (!n8nResult.success) return res.status(503).json({ error: 'Gateway unavailable' });
    const result = n8nResult.data;
    
    // Log raw result from LLM
    console.log('[diagnostic result raw]', JSON.stringify(result));
    
    // Helper function to ensure field is always an array
    function ensureArray(value) {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    }
    
    // Generate a guaranteed-unique diagnostic_id server-side
    const { v4: uuidv4 } = require('uuid');
    const diagnosticId = `DIAG_${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;
    
    // Normalize array fields to prevent frontend crashes
    const normalizedResult = {
      ...result,
      diagnostic_id: diagnosticId,
      strengths: ensureArray(result.strengths),
      primary_constraints: ensureArray(result.primary_constraints),
      automation_opportunities: ensureArray(result.automation_opportunities),
      // Map to frontend field names if needed
      blockers: ensureArray(result.primary_constraints),
      opportunities: ensureArray(result.automation_opportunities),
      score: result.ai_readiness_score || 0
    };
    
    console.log('[diagnostic result normalized]', JSON.stringify(normalizedResult));
    
    res.json(normalizedResult);
    
  } catch (error) {
    next(error);
  }
}


// ============================================================================
// BLUEPRINT GENERATION ENDPOINT
// ============================================================================

// Blueprint uses a minimal system prompt — the full schema + instructions are in the user message (megaPrompt)
const BLUEPRINT_SYSTEM_PROMPT = `You are an AI transformation consultant. You MUST respond with valid JSON only — no markdown, no code blocks, no commentary. Fill every field with specific, actionable content based on the diagnostic data provided.`;

/**
 * Builds the blueprint generation prompt.
 * Returns a BlueprintV1 JSON object matching the exact schema the frontend expects.
 */
function buildBlueprintPrompt(diagnosticData, companyProfile) {
  const companyName = companyProfile?.company_name || 'SME';
  const industry = companyProfile?.industry || 'General';
  const size = companyProfile?.company_size || 'sme';

  return `You are an AI transformation consultant. Analyze the diagnostic data below and generate a comprehensive AI system blueprint.

COMPANY:
- Name: ${companyName}
- Industry: ${industry}
- Size: ${size}

DIAGNOSTIC RESULTS:
- AI Readiness Score: ${diagnosticData?.ai_readiness_score || diagnosticData?.score || 0}/100
- Maturity Level: ${diagnosticData?.maturity_level || 'Unknown'}
- Strengths: ${JSON.stringify(diagnosticData?.strengths || [])}
- Primary Constraints: ${JSON.stringify(diagnosticData?.primary_constraints || [])}
- Automation Opportunities: ${JSON.stringify(diagnosticData?.automation_opportunities || [])}
- Narrative: ${diagnosticData?.narrative_summary || ''}
- Recommended Next Step: ${diagnosticData?.recommended_next_step || ''}

You MUST respond with ONLY a valid JSON object — no markdown, no code blocks, no commentary.

Return this EXACT JSON structure (fill all fields with real, specific content based on the diagnostic data above):

{
  "blueprint_id": "BP-${Date.now()}",
  "version": "1",
  "status": "draft",
  "organization": {
    "name": "${companyName}",
    "industry": "${industry}",
    "size": "sme"
  },
  "diagnostic_summary": {
    "ai_readiness_score": ${diagnosticData?.ai_readiness_score || diagnosticData?.score || 0},
    "maturity_level": "${diagnosticData?.maturity_level || 'Emerging'}",
    "primary_constraints": ${JSON.stringify(diagnosticData?.primary_constraints || [])}
  },
  "strategic_objective": {
    "primary_goal": "FILL: 1-2 sentence primary AI transformation goal based on the diagnostic",
    "kpi_targets": [
      {"metric": "FILL: key metric 1", "target": "FILL: specific target"},
      {"metric": "FILL: key metric 2", "target": "FILL: specific target"},
      {"metric": "FILL: key metric 3", "target": "FILL: specific target"}
    ]
  },
  "system_architecture": {
    "data_sources": ["FILL: data source 1", "FILL: data source 2", "FILL: data source 3"],
    "processing_layers": ["FILL: processing layer 1", "FILL: processing layer 2"],
    "decision_engine": "FILL: describe the AI decision engine (e.g. LLM-based classifier, rule engine, etc.)",
    "memory_layer": "FILL: describe the memory/storage layer (e.g. vector DB, relational DB, etc.)",
    "execution_layer": ["FILL: execution component 1", "FILL: execution component 2"]
  },
  "workflow_modules": [
    {
      "workflow_id": "wf-001",
      "name": "FILL: workflow name based on top automation opportunity",
      "trigger": "FILL: what triggers this workflow",
      "steps": [
        {"type": "ingestion", "action": "FILL: data ingestion step"},
        {"type": "ai_processing", "action": "FILL: AI processing step"},
        {"type": "decision", "action": "FILL: decision step"},
        {"type": "execution", "action": "FILL: execution step"},
        {"type": "notification", "action": "FILL: notification step"}
      ],
      "integrations_required": ["FILL: integration 1", "FILL: integration 2"]
    },
    {
      "workflow_id": "wf-002",
      "name": "FILL: second workflow name",
      "trigger": "FILL: trigger for second workflow",
      "steps": [
        {"type": "ingestion", "action": "FILL: step"},
        {"type": "ai_processing", "action": "FILL: step"},
        {"type": "execution", "action": "FILL: step"}
      ],
      "integrations_required": ["FILL: integration"]
    }
  ],
  "risk_assessment": {
    "data_risks": ["FILL: data risk 1", "FILL: data risk 2"],
    "operational_risks": ["FILL: operational risk 1", "FILL: operational risk 2"],
    "mitigation_strategies": ["FILL: mitigation 1", "FILL: mitigation 2", "FILL: mitigation 3"]
  },
  "deployment_plan": {
    "phase": "FILL: phased|immediate|enterprise",
    "estimated_impact": "FILL: specific impact statement (e.g. 60% reduction in manual processing time)",
    "estimated_roi_months": 6,
    "waves": [
      {
        "name": "Wave 1: Foundation",
        "included_workflows": ["wf-001"],
        "notes": "FILL: what happens in wave 1"
      },
      {
        "name": "Wave 2: Expansion",
        "included_workflows": ["wf-002"],
        "notes": "FILL: what happens in wave 2"
      }
    ]
  }
}

Replace every "FILL:" placeholder with specific, actionable content tailored to ${companyName} in the ${industry} industry based on the diagnostic results. Do not return any FILL placeholders in your response.`;
}

/**
 * POST /blueprints/generate
 * Generates AI System Blueprint using multi-agent mega-prompt via OpenRouter directly
 */
async function handleBlueprintGeneration(req, res, next) {
  try {
    const { diagnostic_data, answers, company_profile, organization_id } = req.body;

    // Accept diagnostic_data or fallback to answers
    const diagnosticData = diagnostic_data || answers;

    if (!diagnosticData) {
      const error = new Error('Missing required field: diagnostic_data');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      error.details = { field: 'diagnostic_data', expected: 'object' };
      return next(error);
    }

    // Build company profile — use provided or derive from organization_id
    const resolvedProfile = company_profile || {
      company_name: organization_id || 'SME',
      industry: 'General',
      company_size: 'SME',
      role: 'Unknown'
    };

    // Build mega-prompt
    const megaPrompt = buildBlueprintPrompt(diagnosticData, resolvedProfile);

    console.log('[blueprint] diagnosticData received:', JSON.stringify(diagnosticData, null, 2));
    console.log('[blueprint] resolvedProfile:', JSON.stringify(resolvedProfile));

    const routing = MODEL_ROUTING['/blueprints/generate'];

    // Call OpenRouter directly with blueprint system prompt (bypasses n8n)
    const result = await sendRequest(
      routing.model,
      routing.useCase,
      megaPrompt,
      req.requestId,
      true // validate + repair JSON
    );

    console.log('[blueprint] result keys:', Object.keys(result || {}));
    console.log('[blueprint] strategic_objective:', JSON.stringify(result?.strategic_objective));

    res.json(result);

  } catch (error) {
    next(error);
  }
}

// ============================================================================
// WORKFLOW GENERATION ENDPOINT
// ============================================================================

/**
 * POST /blueprints/generate-workflow
 * Generates a detailed executable workflow definition from a blueprint module
 */
async function handleWorkflowGeneration(req, res, next) {
  try {
    const { workflow_id, workflow_title, workflow_steps, diagnostic_context, company_name } = req.body;

    if (!workflow_id || !workflow_title) {
      const error = new Error('Missing required fields: workflow_id, workflow_title');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      return next(error);
    }

    const routing = MODEL_ROUTING['/blueprints/generate'];

    const prompt = `You are an AI automation architect. Generate a detailed, executable workflow definition for the following automation.

COMPANY: ${company_name || 'SME'}
WORKFLOW ID: ${workflow_id}
WORKFLOW TITLE: ${workflow_title}
HIGH-LEVEL STEPS: ${JSON.stringify(workflow_steps || [])}
DIAGNOSTIC CONTEXT: ${JSON.stringify(diagnostic_context || {})}

You MUST respond with ONLY a valid JSON object — no markdown, no code blocks, no commentary.

Return this EXACT JSON structure:
{
  "workflow_id": "${workflow_id}",
  "title": "${workflow_title}",
  "trigger": "FILL: specific event or condition that starts this workflow",
  "steps": [
    {"step": 1, "action": "FILL: specific action", "tool": "FILL: tool/service used (e.g. n8n HTTP node, OpenAI, Slack)", "output": "FILL: what this step produces"},
    {"step": 2, "action": "FILL: specific action", "tool": "FILL: tool/service", "output": "FILL: output"},
    {"step": 3, "action": "FILL: specific action", "tool": "FILL: tool/service", "output": "FILL: output"},
    {"step": 4, "action": "FILL: specific action", "tool": "FILL: tool/service", "output": "FILL: output"},
    {"step": 5, "action": "FILL: specific action", "tool": "FILL: tool/service", "output": "FILL: output"}
  ],
  "integrations": ["FILL: integration 1", "FILL: integration 2", "FILL: integration 3"],
  "estimated_time": "FILL: e.g. 2-5 minutes per execution",
  "automation_percentage": "FILL: e.g. 85%",
  "error_handling": "FILL: describe fallback/error strategy",
  "notes": "FILL: any important implementation notes"
}

Replace every FILL placeholder with specific, actionable content for ${company_name || 'this company'} based on the workflow title and diagnostic context. Do not return any FILL placeholders.`;

    const result = await sendRequest(
      routing.model,
      routing.useCase,
      prompt,
      req.requestId,
      true
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// MOBILE CONSOLE ENDPOINT
// ============================================================================

/**
 * POST /console/mobile
 * Non-streaming console for mobile (WhatsApp, Telegram, Zenclaw)
 * Routes through internal n8n gateway instead of OpenRouter
 */
async function handleMobileConsole(req, res, next) {
  try {
    const { session_id, message } = req.body;
    
    // Validate required fields
    if (!session_id) {
      const error = new Error('Missing required field: session_id');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      error.details = { field: 'session_id', expected: 'string' };
      return next(error);
    }
    
    if (!message || typeof message !== 'string') {
      const error = new Error('Missing or invalid field: message (expected string)');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      error.details = { field: 'message', expected: 'string' };
      return next(error);
    }
    
    // Forward to n8n console webhook
    const n8nResult = await callN8N('console', message);
    if (!n8nResult.success) return res.status(503).json({ error: 'Gateway unavailable' });
    
    res.json({ model: 'zeroclaw', response: n8nResult.data.response });
    
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// ARIA CHAT ENDPOINT
// ============================================================================

/**
 * POST /aria
 * Plain chat endpoint for ARIA (routes through internal gateway)
 * 
 * Request body:
 * {
 *   message: string
 * }
 * 
 * Returns: { response: string }
 */
async function handleAriaChat(req, res, next) {
  try {
    const { message } = req.body;
    
    // Validate required fields
    if (!message || typeof message !== 'string') {
      const error = new Error('Missing or invalid field: message (expected string)');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      error.details = { field: 'message', expected: 'string' };
      return next(error);
    }
    
    // Forward to internal gateway
    const response = await sendToGateway(message, req.requestId);
    
    res.json({ response });
    
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// WORKFLOW SYNTHESIS ENDPOINT
// ============================================================================

/**
 * POST /workflows/synthesize
 * Triggers Aivory workflow generation via n8n executions API
 */
async function handleWorkflowSynthesis(req, res, next) {
  try {
    const { workflow_module, prompt, tenantId, userId, source, context } = req.body;

    if (!workflow_module && !prompt) {
      const error = new Error('Missing required field: workflow_module or prompt');
      error.statusCode = 400;
      error.errorCode = 'BAD_REQUEST';
      error.details = { field: 'workflow_module', expected: 'object' };
      return next(error);
    }

    const executionUrl = config.n8nWorkflowExecutionUrl;
    const payload = JSON.stringify({
      prompt: prompt || JSON.stringify(workflow_module),
      workflow_module,
      tenantId: tenantId || req.body.organization_id || null,
      userId: userId || null,
      source: source || 'dashboard',
      context: context || {}
    });

    logger.info('[workflow/synthesize] triggering n8n execution', { url: executionUrl });

    // POST to n8n executions endpoint
    const n8nResponse = await new Promise((resolve, reject) => {
      const url = new URL(executionUrl);
      const transport = url.protocol === 'https:' ? https : http;
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const request = transport.request(options, (response) => {
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
          try {
            resolve({ status: response.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: response.statusCode, body: data });
          }
        });
      });

      request.on('error', reject);
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('n8n execution request timed out'));
      });
      request.write(payload);
      request.end();
    });

    if (n8nResponse.status < 200 || n8nResponse.status >= 300) {
      logger.error('[workflow/synthesize] n8n returned error', { status: n8nResponse.status, body: n8nResponse.body });
      return res.status(502).json({
        status: 'error',
        reason: 'n8n_execution_failed',
        details: typeof n8nResponse.body === 'string' ? n8nResponse.body : JSON.stringify(n8nResponse.body)
      });
    }

    const executionId = n8nResponse.body?.id || n8nResponse.body?.executionId || null;
    logger.info('[workflow/synthesize] n8n execution accepted', { executionId });

    res.json({
      status: 'accepted',
      executionId,
      n8nWorkflowId: 'Tu5VrBcDwUtRChdh'
    });

  } catch (error) {
    logger.error('[workflow/synthesize] unexpected error', { error: error.message });
    return res.status(502).json({
      status: 'error',
      reason: 'n8n_execution_failed',
      details: error.message
    });
  }
}

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

/**
 * GET /health
 * Returns system health status
 */
async function handleHealthCheck(req, res) {
  try {
    // Check if API key is configured
    const openrouterApiKeySet = await healthCheck();
    
    // Determine overall status
    const status = openrouterApiKeySet ? 'ok' : 'down';
    
    const response = {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        openrouter_api_key_set: openrouterApiKeySet
      }
    };
    
    // Return 503 if down, 200 otherwise
    const httpStatus = status === 'down' ? 503 : 200;
    res.status(httpStatus).json(response);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      checks: {
        openrouter_api_key_set: false
      }
    });
  }
}

module.exports = {
  handleConsoleStream,
  handleAiraStream,
  handleMobileConsole,
  handleAriaChat,
  handleDeepDiagnostic,
  handleFreeDiagnostic,
  handleBlueprintGeneration,
  handleWorkflowGeneration,
  handleWorkflowSynthesis,
  handleHealthCheck
};
