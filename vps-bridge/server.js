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