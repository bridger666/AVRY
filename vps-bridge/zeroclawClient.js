/**
 * Zeroclaw Client
 * HTTP client for the Zeroclaw orchestrator webhook.
 * Used by /bridge/aira (AIRA chat) and /bridge/kiro (Kiro-originated messages).
 *
 * Base URL: process.env.ZEROCLAW_BASE_URL || "http://43.156.108.96:3010"
 */

const https = require('https');
const http = require('http');
const { logger } = require('./logger');

const ZEROCLAW_BASE_URL =
  process.env.ZEROCLAW_BASE_URL ||
  process.env.ZEROCLAW_KIRO_URL ||
  'http://43.156.108.96:3010';

/**
 * Sends a message to the Zeroclaw /webhook endpoint.
 *
 * @param {string} message - The prompt/message to send
 * @returns {Promise<{ model: string, response: string }>}
 * @throws {Error} if the HTTP response is not 2xx
 */
function callZeroclaw(message) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${ZEROCLAW_BASE_URL}/webhook`);
    const payload = JSON.stringify({ message });

    logger.info('[zeroclawClient] POST', { url: url.href });

    const transport = url.protocol === 'https:' ? https : http;
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: parseInt(process.env.ZEROCLAW_TIMEOUT_MS || '115000', 10)
    };

    const req = transport.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const snippet = body.slice(0, 200);
          return reject(new Error(`Zeroclaw returned ${res.statusCode}: ${snippet}`));
        }
        try {
          const data = JSON.parse(body);
          const model = data?.model || data?.choices?.[0]?.model || 'zeroclaw';
          const response =
            data?.response ||
            data?.content ||
            data?.text ||
            data?.choices?.[0]?.message?.content ||
            (typeof data === 'string' ? data : JSON.stringify(data));
          resolve({ model, response });
        } catch {
          reject(new Error(`Zeroclaw returned non-JSON body: ${body.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Zeroclaw request timed out'));
    });

    req.write(payload);
    req.end();
  });
}

module.exports = { callZeroclaw, ZEROCLAW_BASE_URL };
