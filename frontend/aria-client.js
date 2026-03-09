/**
 * ARIA n8n Webhook Client
 * Direct connection to ARIA n8n workflow on VPS
 * 
 * Replaces Zenclaw integration with direct n8n webhook calls
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const N8N_URL = "http://43.156.108.96:5678/webhook/755fcac8";
const N8N_AUTH_USER = "admin";
const N8N_AUTH_PASSWORD = "strongpassword";

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Generate HTTP Basic Auth headers for n8n
 * @returns {Object} Headers object with Authorization
 */
function getN8nHeaders() {
    const token = btoa(`${N8N_AUTH_USER}:${N8N_AUTH_PASSWORD}`);
    return {
        "Content-Type": "application/json",
        "Authorization": `Basic ${token}`,
    };
}

// ============================================================================
// CORE API CALL
// ============================================================================

/**
 * Call ARIA n8n webhook with payload
 * @param {Object} payload - Request payload with mode and data
 * @returns {Promise<Object>} Response data from n8n
 * @throws {Error} If request fails
 */
async function callAria(payload) {
    try {
        const res = await fetch(N8N_URL, {
            method: "POST",
            headers: getN8nHeaders(),
            body: JSON.stringify(payload),
        });
        
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`ARIA error ${res.status}: ${text || res.statusText}`);
        }
        
        return await res.json();
    } catch (error) {
        console.error('[ARIA Client] Request failed:', error);
        throw error;
    }
}

// ============================================================================
// MODE-SPECIFIC HELPERS
// ============================================================================

/**
 * Send console chat message to ARIA
 * @param {string} userMessage - User's message
 * @param {Array} history - Conversation history [{role, content}]
 * @param {Object} metaOverrides - Additional metadata
 * @returns {Promise<Object>} {reply, debug, steps}
 */
async function sendConsoleMessage(userMessage, history = [], metaOverrides = {}) {
    const payload = {
        mode: "console",
        messages: history || [],
        meta: {
            source: "aivory-console-local",
            timestamp: new Date().toISOString(),
            ...metaOverrides,
        },
    };
    
    const data = await callAria(payload);
    
    // Expected n8n response shape: { reply: string, debug?: any, steps?: any }
    return {
        reply: data.reply ?? data.response ?? "",
        debug: data.debug ?? null,
        steps: data.steps ?? null,
        model: data.model ?? data.model_used ?? "unknown",
        intent: data.intent ?? "general",
    };
}

/**
 * Run diagnostic analysis via ARIA
 * @param {string} userMessage - Diagnostic query or context
 * @param {Array} history - Conversation history
 * @param {Object} metaOverrides - Additional metadata
 * @returns {Promise<Object>} Diagnostic result object
 */
async function runDiagnostic(userMessage, history = [], metaOverrides = {}) {
    const payload = {
        mode: "diagnostic",
        messages: history || [],
        meta: {
            source: "diagnostic-panel",
            timestamp: new Date().toISOString(),
            ...metaOverrides,
        },
    };
    
    const data = await callAria(payload);
    
    // Expected: structured diagnostic JSON
    return data.diagnostic || data;
}

/**
 * Generate AI System Blueprint via ARIA
 * @param {string} userPrompt - Blueprint generation prompt
 * @param {Object} metaOverrides - Additional metadata
 * @returns {Promise<Object>} Blueprint/workflow object
 */
async function generateBlueprint(userPrompt, metaOverrides = {}) {
    const payload = {
        mode: "blueprint",
        prompt: userPrompt,
        meta: {
            source: "blueprint-panel",
            timestamp: new Date().toISOString(),
            ...metaOverrides,
        },
    };
    
    const data = await callAria(payload);
    
    // Typical shape: workflow/schema JSON
    return data.workflow || data.schema || data.blueprint || data;
}

// ============================================================================
// CONNECTION TEST
// ============================================================================

/**
 * Test connection to ARIA n8n webhook
 * @returns {Promise<boolean>} True if connection successful
 */
async function testAriaConnection() {
    try {
        const response = await fetch(N8N_URL, {
            method: 'POST',
            headers: getN8nHeaders(),
            body: JSON.stringify({
                mode: 'console',
                messages: [{ role: 'user', content: 'ping' }],
                meta: { source: 'connection-test' }
            })
        });
        
        if (response.ok) {
            console.log('✅ ARIA n8n connection successful');
            return true;
        } else {
            console.warn('⚠️ ARIA returned status:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ ARIA connection failed:', error.message);
        console.error('Endpoint:', N8N_URL);
        console.error('This could be due to:');
        console.error('  1. CORS policy blocking the request');
        console.error('  2. Network/firewall blocking the connection');
        console.error('  3. n8n server is temporarily unavailable');
        console.error('  4. Invalid Basic Auth credentials');
        return false;
    }
}

// Run connection test when page loads
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => testAriaConnection(), 1000);
    });
}

// ============================================================================
// EXPORTS (for module usage or global access)
// ============================================================================

// Make functions globally available
if (typeof window !== 'undefined') {
    window.AriaClient = {
        callAria,
        sendConsoleMessage,
        runDiagnostic,
        generateBlueprint,
        testAriaConnection,
        getN8nHeaders,
    };
}
