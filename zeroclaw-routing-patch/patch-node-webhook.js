// ============================================================================
// ZEROCLAW WEBHOOK HANDLER — AGENT ROUTING PATCH (Node.js version)
// ============================================================================
//
// If Zeroclaw is a Node.js/Express server, apply this patch to the file
// that handles POST /webhook on port 3100.
//
// WHAT CHANGED:
// 1. Read mode, channel, entrypoint from request body
// 2. resolveUseCase() determines which agent to use
// 3. System prompt is selected based on useCase before calling LLM/n8n
//
// WHAT DID NOT CHANGE:
// - Response format (same JSON structure)
// - How Zeroclaw calls OpenRouter or n8n internally
// - Logging, error handling
// - Other endpoints
// ============================================================================

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// 1. System prompts — load console prompt from file or inline
// ---------------------------------------------------------------------------

// Option A: Load from file
// const CONSOLE_SYSTEM_PROMPT = fs.readFileSync(
//   path.join(__dirname, '../prompts/console_prompt.txt'), 'utf-8'
// );

// Option B: Inline (abbreviated — see console_prompt.txt for full version)
const CONSOLE_SYSTEM_PROMPT = `You are AIRA (Aivory Intelligence & Readiness Assistant).
You are a senior AI systems consultant embedded inside Aivory — the AI readiness and automation platform.

YOUR CORE IDENTITY:
- You think like a seasoned consultant, but execute like an engineer
- You never just describe. You diagnose, prescribe, and build.
- You always have a clear perspective. You challenge bad assumptions — respectfully.
- You adapt your depth and style based on what the user needs right now.
- Your formula: Truth + Efficiency + Clarity + Simplicity

LANGUAGE & TONE:
- Detect the user's language automatically and respond in the same language
- Supported languages: English, Indonesian, Arabic, Mandarin, Japanese, German, French
- If unsure of language, default to English
- Tone: Warm, professional, human — never robotic or stiff
- Short sentences. Active voice. Plain language.
- Never start with: "Great question", "Certainly", "Of course"
- Lead every response with the most important thing

FORMATTING RULES:
- Never use emoji numbers or any emoji/emoticons
- Use plain numbers: 1. 2. 3.
- Keep formatting clean and human

GREETING BEHAVIOR:
When a user sends a greeting (hi, hello, halo, etc.):
Respond warmly, introduce yourself briefly, and check their stage:
1. Already have Diagnostic + Blueprint?
2. Have Diagnostic but no Blueprint?
3. Starting from scratch?

WHEN A USER ASKS A QUESTION:
- Answer directly — lead with the most important insight
- Keep responses tight — no padding, no repetition
- Suggest the most efficient path forward

WORKFLOW GENERATION:
When the user asks to create/design/build a workflow:
1. Write a clear explanation of the workflow steps
2. ALSO output a structured workflow spec in a fenced code block tagged \`\`\`workflow_spec with valid JSON
3. First step MUST be type "trigger", use "action"/"ai"/"filter" for others
4. 3-8 steps total`;

// ---------------------------------------------------------------------------
// 2. Agent routing function
// ---------------------------------------------------------------------------

/**
 * Determine which agent persona to use based on incoming routing metadata.
 *
 * The VPS Bridge sends these fields from the Aivory Console:
 *   mode: "console", channel: "console_ui", entrypoint: "console"
 *
 * Routing rules:
 *   - "console": mode=="console" OR channel=="console_ui" OR entrypoint=="console"
 *   - "dev":     mode=="dev"
 *   - "default": everything else (existing behavior)
 *
 * @param {object} body - The parsed request body
 * @returns {"console" | "dev" | "default"}
 */
function resolveUseCase(body) {
  const mode = body.mode || '';
  const channel = body.channel || '';
  const entrypoint = body.entrypoint || '';

  if (mode === 'console' || channel === 'console_ui' || entrypoint === 'console') {
    return 'console';
  } else if (mode === 'dev') {
    return 'dev';
  } else {
    return 'default';
  }
}

/**
 * Get the system prompt for a given use case.
 *
 * @param {"console" | "dev" | "default"} useCase
 * @param {string|undefined} requestSystemPrompt - system_prompt from the request body
 * @returns {string}
 */
function getSystemPrompt(useCase, requestSystemPrompt) {
  switch (useCase) {
    case 'console':
      return CONSOLE_SYSTEM_PROMPT;
    case 'dev':
      // Dev/identity agent — use whatever was sent in the request
      return requestSystemPrompt || '';
    default:
      // Preserve existing default behavior
      return requestSystemPrompt || '';
  }
}

// ---------------------------------------------------------------------------
// 3. Updated webhook handler
// ---------------------------------------------------------------------------

/**
 * POST /webhook handler with agent routing.
 *
 * Apply this to your existing Express/Fastify/Koa handler.
 * The key change: read mode/channel/entrypoint → pick system prompt → forward.
 */
async function handleWebhook(req, res) {
  const body = req.body || {};
  const { message, history, system_prompt, mode, channel, entrypoint, context } = body;

  if (!message) {
    return res.status(400).json({ error: 'Missing required field: message' });
  }

  // ── Resolve agent based on mode/channel/entrypoint ──────────────
  const useCase = resolveUseCase(body);
  const resolvedPrompt = getSystemPrompt(useCase, system_prompt);

  console.log(`[webhook] useCase=${useCase} mode=${mode || '-'} channel=${channel || '-'} entrypoint=${entrypoint || '-'}`);

  // ── Build downstream request ────────────────────────────────────
  // OPTION A: Forward to n8n with system_prompt included
  const downstreamPayload = {
    mode: useCase,
    message,
    history: history || [],
    system_prompt: resolvedPrompt,
    meta: {
      source: 'aivory-console',
      origin: 'zeroclaw-gateway',
    },
  };

  // OPTION B: If calling OpenRouter directly, build messages array:
  //
  //   const messages = [];
  //   if (resolvedPrompt) {
  //     messages.push({ role: 'system', content: resolvedPrompt });
  //   }
  //   if (history && history.length > 0) {
  //     messages.push(...history);
  //   }
  //   messages.push({ role: 'user', content: message });
  //
  //   // Then POST to OpenRouter /chat/completions with { model, messages }

  try {
    // Forward to n8n (or OpenRouter) — keep your existing HTTP call logic
    const axios = require('axios');
    const response = await axios.post(
      'http://43.156.108.96:5678/webhook/755fcac8',
      downstreamPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic YWRtaW46c3Ryb25ncGFzc3dvcmQ=',
        },
        timeout: 120000,
      }
    );

    console.log(`[webhook] useCase=${useCase} status=${response.status}`);
    return res.json(response.data);
  } catch (err) {
    console.error(`[webhook] useCase=${useCase} error=${err.message}`);
    return res.status(502).json({
      reply: 'Unable to connect to AI service. Please try again.',
      model_used: null,
      intent: null,
    });
  }
}

module.exports = { handleWebhook, resolveUseCase, getSystemPrompt, CONSOLE_SYSTEM_PROMPT };
