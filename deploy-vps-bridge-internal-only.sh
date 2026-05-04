#!/bin/bash
# Deploy VPS Bridge as Internal-Only Service
# This script updates the VPS bridge to remove auth middleware and ensure 127.0.0.1 binding

set -e

echo "=========================================="
echo "VPS Bridge Internal-Only Deployment"
echo "=========================================="

# VPS Connection Details
VPS_HOST="ubuntu@43.156.108.96"
VPS_PASS="mT4-wye-9Dn-hYK"
BRIDGE_DIR="~/AVRY/vps-bridge"

echo ""
echo "Step 1: Updating middleware.js to neutralize auth..."
echo ""

# Create the updated middleware.js content
cat > /tmp/middleware.js << 'MIDDLEWARE_EOF'
/**
 * Express Middleware
 * Request enrichment, error handling, and logging
 */

const { v4: uuidv4 } = require('uuid');
const { logger, logRequestStart, logRequestComplete, logRequestError } = require('./logger');

// ============================================================================
// REQUEST ENRICHMENT MIDDLEWARE
// ============================================================================

/**
 * Enriches incoming requests with metadata
 * Attaches request_id and startTime to req object
 */
function enrichRequest(req, res, next) {
  const startTime = Date.now();
  
  // Generate unique request ID
  const requestId = uuidv4();
  req.requestId = requestId;
  req.startTime = startTime;
  
  // Extract metadata from request body
  const organizationId = req.body?.organization_id;
  
  if (!organizationId) {
    const error = new Error('Missing required field: organization_id');
    error.statusCode = 400;
    error.errorCode = 'BAD_REQUEST';
    error.details = { field: 'organization_id', expected: 'string' };
    return next(error);
  }
  
  // Log request start
  logRequestStart(requestId, req.path, organizationId, 'openrouter', req.path);
  
  next();
}

// ============================================================================
// REQUEST LOGGING MIDDLEWARE
// ============================================================================

/**
 * Logs request completion with latency and status
 */
function logRequest(req, res, next) {
  // Capture original res.json to intercept response
  const originalJson = res.json.bind(res);
  
  res.json = function(body) {
    const latencyMs = Date.now() - req.startTime;
    const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'error';
    
    logRequestComplete(
      req.requestId,
      req.path,
      req.body?.organization_id,
      latencyMs,
      status
    );
    
    return originalJson(body);
  };
  
  next();
}

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * Centralized error handling middleware
 * Converts all errors to standardized Error_Envelope format
 */
function errorHandler(err, req, res, next) {
  const requestId = req.requestId || 'unknown';
  const endpoint = req.path || 'unknown';
  const organizationId = req.body?.organization_id || 'unknown';
  
  // Determine error category and construct error envelope
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Unexpected error. Please try again.';
  let details = err.details || null;
  
  // Log full error with stack trace
  logRequestError(requestId, endpoint, organizationId, err, errorCode);
  
  // Construct Error_Envelope
  const errorEnvelope = {
    error: true,
    code: errorCode,
    message: message,
    details: details
  };
  
  // Never include stack traces in client response
  res.status(statusCode).json(errorEnvelope);
}

// ============================================================================
// INTERNAL TOKEN AUTHENTICATION MIDDLEWARE (NEUTRALIZED)
// ============================================================================

/**
 * Validates internal token from x-internal-token header.
 * Public endpoints listed in PUBLIC_PATHS bypass the check.
 * 
 * NOTE: This middleware has been neutralized for internal-only service.
 * Security is now enforced via network isolation (127.0.0.1 binding).
 */
const PUBLIC_PATHS = new Set(['/health', '/deep-health']);

function requireInternalToken(internalToken) {
  return (req, res, next) => {
    // Neutralized - always allow access for internal-only service
    // Security is now enforced via network isolation (127.0.0.1 binding)
    return next();
  };
}

module.exports = {
  enrichRequest,
  logRequest,
  errorHandler,
  requireInternalToken
};
MIDDLEWARE_EOF

echo "✅ Updated middleware.js created locally"

echo ""
echo "Step 2: Copying updated middleware.js to VPS..."
echo ""

# Use sshpass to copy the file
sshpass -p "$VPS_PASS" scp /tmp/middleware.js "$VPS_HOST:$BRIDGE_DIR/middleware.js"

echo "✅ middleware.js copied to VPS"

echo ""
echo "Step 3: Verifying server.js has 127.0.0.1 binding..."
echo ""

sshpass -p "$VPS_PASS" ssh "$VPS_HOST" "grep -n 'app.listen' $BRIDGE_DIR/server.js"

echo ""
echo "Step 4: Restarting vps-bridge service..."
echo ""

sshpass -p "$VPS_PASS" ssh "$VPS_HOST" "cd $BRIDGE_DIR && pm2 restart vps-bridge"

echo "✅ vps-bridge restarted"

echo ""
echo "Step 5: Checking service status..."
echo ""

sshpass -p "$VPS_PASS" ssh "$VPS_HOST" "pm2 status vps-bridge"

echo ""
echo "Step 6: Verifying port 3003 is bound to 127.0.0.1..."
echo ""

sshpass -p "$VPS_PASS" ssh "$VPS_HOST" "ss -ltnp | grep 3003"

echo ""
echo "Step 7: Testing /diagnostics/run endpoint (should work without auth)..."
echo ""

sshpass -p "$VPS_PASS" ssh "$VPS_HOST" "curl -X POST 'http://127.0.0.1:3003/diagnostics/run' -H 'Content-Type: application/json' -d '{\"organization_id\": \"org-test-001\", \"company_name\": \"Aivory Demo Inc\"}'"

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - middleware.js: Auth neutralized (always calls next())"
echo "  - server.js: Should be bound to 127.0.0.1:3003"
echo "  - Service: Restarted via PM2"
echo "  - Port 3003: Only accessible from localhost"
echo ""
echo "Next steps:"
echo "  1. Update n8n workflow to remove x-api-key and x-internal-token headers"
echo "  2. Test the webhook endpoint"
echo ""