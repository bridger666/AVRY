/**
 * VPS Bridge Production Server
 * Single entry point for all AI features in Aivory
 * Architecture: Next.js → VPS Bridge → Zenclaw → OpenRouter (Qwen)
 */

console.log('[server.js] starting, cwd:', process.cwd());
console.log('[server.js] __dirname:', __dirname);

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import configuration and modules
const { config, validateConfig } = require('./config');
const { logger } = require('./logger');
const { 
  enrichRequest, 
  logRequest, 
  errorHandler, 
  authenticateApiKey 
} = require('./middleware');
const {
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
} = require('./endpoints');

// ============================================================================
// STARTUP VALIDATION
// ============================================================================

logger.info('🚀 Starting VPS Bridge...');

// Validate configuration before starting
try {
  validateConfig();
  logger.info('✅ Configuration validated successfully');
} catch (error) {
  logger.error('❌ Configuration validation failed', { error: error.message });
  process.exit(1);
}

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window per IP
  message: {
    error: true,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
    details: null
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all API routes
app.use('/console/', limiter);
app.use('/diagnostics/', limiter);
app.use('/blueprints/', limiter);
app.use('/workflows/', limiter);
app.use('/aria/', limiter);

// ============================================================================
// HEALTH CHECK ENDPOINT (No authentication required)
// ============================================================================

app.get('/health', handleHealthCheck);

// ============================================================================
// AUTHENTICATED ENDPOINTS
// ============================================================================

// Apply API key authentication to all protected routes
app.use(authenticateApiKey(config.apiKey));

// Apply request enrichment and logging to all AI endpoints (except /aria which is simpler)
// /diagnostics/free/run is exempt from enrichRequest — it's a public free-tier endpoint
// that does not require organization_id
// /blueprints/generate-workflow is exempt from enrichRequest — organization_id is optional for workflow gen
app.use(['/console/stream', '/console/mobile', '/diagnostics/run', '/blueprints/generate', '/workflows/*'], enrichRequest);
app.use(['/console/*', '/diagnostics/*', '/blueprints/*', '/workflows/*'], logRequest);

// ============================================================================
// CONSOLE CHAT STREAMING
// ============================================================================

/**
 * POST /console/stream
 * Streams AI console responses using Server-Sent Events
 * 
 * Request body:
 * {
 *   organization_id: string,
 *   session_id: string,
 *   language: string,
 *   messages: Array<{ role: 'user' | 'assistant', content: string }>
 * }
 */
app.post('/console/stream', handleConsoleStream);

/**
 * POST /console/mobile
 * Non-streaming console for mobile (WhatsApp, Telegram, Zenclaw)
 * 
 * Request body:
 * {
 *   organization_id: string,
 *   session_id: string,
 *   message: string
 * }
 * 
 * Returns: { response: string }
 */
app.post('/console/mobile', handleMobileConsole);

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
app.post('/aria', (req, res, next) => {
  // Simple enrichment without organization_id requirement
  req.requestId = require('uuid').v4();
  req.startTime = Date.now();
  next();
}, handleAriaChat);

/**
 * POST /aria/stream
 * Streaming AIRA endpoint for the floating assistant tab.
 * Primary: Zeroclaw orchestrator. Fallback: OpenRouter direct.
 * Sends an immediate empty chunk to prevent client idle timeout.
 */
app.post('/aria/stream', (req, res, next) => {
  req.requestId = require('uuid').v4();
  req.startTime = Date.now();
  next();
}, handleAiraStream);

// ============================================================================
// DIAGNOSTIC ENDPOINTS
// ============================================================================

/**
 * POST /diagnostics/run
 * Processes deep diagnostic requests
 * 
 * Request body:
 * {
 *   organization_id: string,
 *   mode: 'deep',
 *   diagnostic_payload: object
 * }
 * 
 * Returns: DiagnosticResult
 */
app.post('/diagnostics/run', handleDeepDiagnostic);

/**
 * POST /diagnostics/free/run
 * Processes free diagnostic (12 questions)
 * Public endpoint — no organization_id required.
 * 
 * Request body:
 * {
 *   mode: 'free',
 *   answers: { [questionId: string]: number },
 *   language: string
 * }
 * 
 * Returns: DiagnosticResult
 */
app.post('/diagnostics/free/run', (req, res, next) => {
  req.requestId = require('uuid').v4();
  req.startTime = Date.now();
  next();
}, handleFreeDiagnostic);

// ============================================================================
// BLUEPRINT GENERATION
// ============================================================================

/**
 * POST /blueprints/generate
 * Generates AI System Blueprint
 * 
 * Request body:
 * {
 *   organization_id: string,
 *   diagnostic_id: string,
 *   objective: string,
 *   constraints: object,
 *   industry: string
 * }
 * 
 * Returns: Blueprint
 */
app.post('/blueprints/generate', handleBlueprintGeneration);
app.post('/blueprints/generate-workflow', (req, res, next) => {
  req.requestId = require('uuid').v4();
  req.startTime = Date.now();
  next();
}, handleWorkflowGeneration);

// ============================================================================
// WORKFLOW SYNTHESIS
// ============================================================================

/**
 * POST /workflows/synthesize
 * Generates n8n workflow JSON from workflow module spec
 * 
 * Request body:
 * {
 *   organization_id: string,
 *   workflow_module: object
 * }
 * 
 * Returns: n8n workflow JSON
 */
app.post('/workflows/synthesize', handleWorkflowSynthesis);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: true,
    code: 'ENDPOINT_NOT_FOUND',
    message: `Endpoint not found: ${req.method} ${req.path}`,
    details: null
  });
});

// Centralized error handler (must be last)
app.use(errorHandler);

// ============================================================================
// START SERVER
// ============================================================================

const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info('🎉 VPS Bridge is running', {
    port: config.port,
    openrouter_url: config.openrouterBaseUrl,
    cors_origin: config.corsOrigin,
    log_level: config.logLevel
  });
  logger.info('📡 Endpoints registered:');
  logger.info('  GET  /health');
  logger.info('  POST /console/stream');
  logger.info('  POST /console/mobile');
  logger.info('  POST /aria');
  logger.info('  POST /aria/stream');
  logger.info('  POST /diagnostics/run');
  logger.info('  POST /diagnostics/free/run');
  logger.info('  POST /blueprints/generate');
  logger.info('  POST /workflows/synthesize');
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

function gracefulShutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  server.close(() => {
    logger.info('✅ Server closed successfully');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled rejection', {
    reason,
    promise
  });
  process.exit(1);
});
