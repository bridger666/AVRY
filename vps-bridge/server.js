/**
 * VPS Bridge - Thin Proxy
 * Forwards requests from Next.js/Backend to internal services (Zeroclaw)
 * Adds CORS headers and injects auth headers
 * 
 * Architecture: Next.js → VPS Bridge (thin proxy) → Zeroclaw :3010
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
const crypto = require('crypto');

// Internal modules
const supabaseDb = require('./lib/supabase');

// Load environment variables
require('dotenv').config();

// Configuration
const PORT = process.env.PORT || 3003;
const ZEROCLAW_URL = process.env.ZEROCLAW_URL || 'http://127.0.0.1:3010';
const INTERNAL_KEY = process.env.INTERNAL_TOKEN || 'aivory-internal-2026';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();

// CORS middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'vps-bridge-thin-proxy',
    timestamp: new Date().toISOString(),
    zeroclaw_url: ZEROCLAW_URL
  });
});

// ============================================================================
// PROXY HANDLERS
// ============================================================================

/**
 * Generic request forwarder with auth header injection
 */
function proxyRequest(req, res, next) {
  const targetUrl = new URL(req.path, ZEROCLAW_URL);
  
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
    path: targetUrl.pathname + targetUrl.search,
    method: req.method,
    headers: {
      ...req.headers,
      'X-Internal-Key': INTERNAL_KEY,
      'Content-Type': 'application/json',
      'host': targetUrl.host
    }
  };

  const transport = targetUrl.protocol === 'https:' ? https : http;
  
  const proxyReq = transport.request(options, (proxyRes) => {
    // Copy headers from target response
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[proxy] error:', err.message);
    res.status(502).json({
      error: true,
      code: 'PROXY_ERROR',
      message: 'Failed to reach internal service',
      details: err.message
    });
  });

  // Forward request body
  if (req.body && Object.keys(req.body).length > 0) {
    proxyReq.write(JSON.stringify(req.body));
  }
  
  proxyReq.end();
}

/**
 * SSE stream proxy to Zeroclaw
 */
function proxyStream(req, res) {
  const targetUrl = new URL('/webhook', ZEROCLAW_URL);
  
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
    path: targetUrl.pathname,
    method: 'POST',
    headers: {
      ...req.headers,
      'X-Internal-Key': INTERNAL_KEY,
      'Content-Type': 'application/json',
      'host': targetUrl.host
    }
  };

  const transport = targetUrl.protocol === 'https:' ? https : http;
  
  const proxyReq = transport.request(options, (proxyRes) => {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('X-Accel-Buffering', 'no');
    
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[proxy stream] error:', err.message);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
    }
    res.write(`data: ${JSON.stringify({ type: 'error', error: 'Proxy error' })}\n\n`);
    res.end();
  });

  // Forward request body
  if (req.body && Object.keys(req.body).length > 0) {
    proxyReq.write(JSON.stringify(req.body));
  }
  
  proxyReq.end();
}

// ============================================================================
// ROUTES - Forward all requests to Zeroclaw
// ============================================================================

// Console streaming (SSE)
app.post('/console/stream', proxyStream);
app.post('/aria/stream', proxyStream);

// ============================================================================
// ENTITLEMENT & BILLING ENDPOINTS
// ============================================================================

/**
 * GET /api/entitlements/:userId — fetch user entitlements from Supabase
 */
app.get('/api/entitlements/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const entitlements = await supabaseDb.getUserEntitlements(userId);
    res.json({ userId, entitlements });
  } catch (err) {
    console.error('[entitlements] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch entitlements', details: err.message });
  }
});

/**
 * POST /api/entitlements — upsert entitlement
 * Body: { userId, tier, features?, expiresAt? }
 */
app.post('/api/entitlements', async (req, res) => {
  try {
    const { userId, tier, features, expiresAt } = req.body;
    if (!userId || !tier) return res.status(400).json({ error: 'Missing userId or tier' });
    const result = await supabaseDb.upsertEntitlement({ userId, tier, features, expiresAt });
    res.json({ success: true, entitlement: result });
  } catch (err) {
    console.error('[entitlements upsert] error:', err.message);
    res.status(500).json({ error: 'Failed to upsert entitlement', details: err.message });
  }
});

/**
 * POST /stripe/webhook — handle Stripe webhook events
 * Verifies signature using STRIPE_WEBHOOK_SECRET
 */
app.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('[stripe webhook] No STRIPE_WEBHOOK_SECRET configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    // Verify webhook signature
    const payload = req.body;
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    // Parse event
    const event = JSON.parse(payload);

    console.log(`[stripe webhook] Event: ${event.type}`);

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.user_id || session.client_reference_id;
      const tier = session.metadata?.tier || 'pro';

      if (userId) {
        await supabaseDb.upsertEntitlement({
          userId,
          tier,
          features: { source: 'stripe', sessionId: session.id },
          expiresAt: null
        });
        await supabaseDb.recordStripeEvent({
          eventId: event.id,
          eventType: event.type,
          userId,
          sessionId: session.id,
          amount: session.amount_total,
          currency: session.currency
        });
        console.log(`[stripe webhook] Activated ${tier} for user ${userId}`);
      }
    }

    // Handle customer.subscription.updated / deleted
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const userId = sub.metadata?.user_id;
      if (userId) {
        await supabaseDb.upsertEntitlement({
          userId,
          tier: 'free',
          features: { source: 'stripe', subscriptionId: sub.id },
          expiresAt: null
        });
        console.log(`[stripe webhook] Downgraded user ${userId} to free`);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[stripe webhook] error:', err.message);
    res.status(400).json({ error: 'Webhook processing failed', details: err.message });
  }
});

// ============================================================================
// DEEP DIAGNOSTIC ENDPOINT
// Handles POST /diagnostics/run directly via OpenRouter.
// NOTE: Zeroclaw is a binary daemon whose port 3010 serves a web dashboard,
// not an agent API. POST /diagnostics/run returns 405 from Zeroclaw because
// that path is its internal dashboard route. This handler intercepts the
// request before the catch-all proxy and calls OpenRouter directly.
// ============================================================================

const DIAGNOSTIC_SYSTEM_PROMPT = `You are an AI readiness diagnostic expert. Analyze the provided business diagnostic data and return a structured JSON assessment.

You MUST respond with ONLY a valid JSON object — no markdown, no code blocks, no commentary.

Return this EXACT JSON structure:
{
  "ai_readiness_score": <number 0-100>,
  "maturity_level": "<Foundational|Developing|Advancing|Leading>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "primary_constraints": ["<constraint 1>", "<constraint 2>", "<constraint 3>"],
  "automation_opportunities": ["<opportunity 1>", "<opportunity 2>", "<opportunity 3>"],
  "narrative_summary": "<2-3 sentence summary of AI readiness>",
  "recommended_next_step": "<single most important next action>"
}

Base your assessment on the four diagnostic phases provided: business objectives & KPIs, data & process readiness, risk & constraints, and AI opportunity mapping.`;

app.post('/diagnostics/run', async (req, res) => {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    console.error('[diagnostics/run] OPENROUTER_API_KEY not set');
    return res.status(500).json({ error: true, message: 'OpenRouter API key not configured' });
  }

  const { mode, phases, diagnostic_payload } = req.body;

  if (mode !== 'deep') {
    return res.status(422).json({ error: true, message: 'Invalid mode: expected "deep"' });
  }

  const payload = phases || diagnostic_payload;
  if (!payload) {
    return res.status(400).json({ error: true, message: 'Missing required field: phases' });
  }

  console.log('[diagnostics/run] Starting deep diagnostic via OpenRouter');

  try {
    const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aivory.app',
        'X-Title': 'Aivory'
      },
      body: JSON.stringify({
        model: process.env.DIAGNOSTIC_MODEL || 'qwen/qwen3-235b-a22b',
        messages: [
          { role: 'system', content: DIAGNOSTIC_SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(payload, null, 2) }
        ],
        stream: false
      }),
      signal: AbortSignal.timeout(115_000)
    });

    if (!openrouterRes.ok) {
      const errText = await openrouterRes.text().catch(() => 'unknown error');
      console.error('[diagnostics/run] OpenRouter error:', openrouterRes.status, errText);
      return res.status(502).json({ error: true, message: 'AI engine returned an error. Please try again.' });
    }

    const openrouterData = await openrouterRes.json();
    const content = openrouterData?.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[diagnostics/run] Empty content from OpenRouter');
      return res.status(502).json({ error: true, message: 'AI engine returned empty response. Please try again.' });
    }

    // Extract JSON from the response (handle markdown code blocks if present)
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : null;
      if (!jsonStr) {
        console.error('[diagnostics/run] Could not extract JSON from response:', content.substring(0, 200));
        return res.status(502).json({ error: true, message: 'AI engine returned invalid JSON. Please try again.' });
      }
      try {
        result = JSON.parse(jsonStr);
      } catch (e2) {
        console.error('[diagnostics/run] JSON parse failed after extraction:', e2.message);
        return res.status(502).json({ error: true, message: 'AI engine returned malformed response. Please try again.' });
      }
    }

    // Normalize and ensure all required fields are present
    function ensureArray(value) {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    }

    const { v4: uuidv4 } = require('uuid');
    const diagnosticId = `DIAG_${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;

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
      recommended_next_step: result.recommended_next_step || ''
    };

    console.log('[diagnostics/run] Success, score:', normalizedResult.ai_readiness_score);
    res.json(normalizedResult);

  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.error('[diagnostics/run] OpenRouter timeout');
      return res.status(504).json({ error: true, message: 'Diagnostic timed out. Please try again.' });
    }
    console.error('[diagnostics/run] Unexpected error:', err.message);
    res.status(500).json({ error: true, message: 'Internal server error. Please try again.' });
  }
});

// All other requests - generic proxy
app.all('*', proxyRequest);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(500).json({
    error: true,
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    details: err.message
  });
});

// ============================================================================
// START SERVER
// ============================================================================

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log('✅ VPS Bridge Thin Proxy is running');
  console.log(`   Port: ${PORT}`);
  console.log(`   Host: 127.0.0.1`);
  console.log(`   Zeroclaw URL: ${ZEROCLAW_URL}`);
  console.log(`   CORS Origin: ${CORS_ORIGIN}`);
  console.log('');
  console.log('📡 Endpoints:');
  console.log('   GET  /health');
  console.log('   POST /console/stream (SSE → Zeroclaw)');
  console.log('   POST /aria/stream (SSE → Zeroclaw)');
  console.log('   POST /diagnostics/run (OpenRouter direct)');
  console.log('   ALL  * (proxy → Zeroclaw)');
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

function gracefulShutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);
  
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection:', reason);
  process.exit(1);
});