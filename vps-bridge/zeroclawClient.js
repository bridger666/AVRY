/**
 * Zeroclaw Client
 * Direct HTTP client for the Zeroclaw orchestrator webhook.
 * Used by /bridge/kiro to route Kiro-originated messages through Zeroclaw.
 */

const axios = require('axios');
const { config } = require('./config');
const { logger } = require('./logger');

/**
 * Sends a message to the Zeroclaw /webhook endpoint and returns the response.
 *
 * @param {string} message - The prompt/message to send
 * @returns {Promise<{ model: string, raw_agent_response: string, tool_calls: [] }>}
 */
async function callZeroclaw(message) {
  const url = `${config.zeroclawKiroUrl}/webhook`;

  logger.info('[zeroclawClient] calling Zeroclaw', { url });

  const payload = {
    message,
    source: 'kiro_bridge',
    intent: 'kiro_assistant'
  };

  const response = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: config.zeroclawTimeout
  });

  const data = response.data;

  // Normalise to a consistent shape regardless of what Zeroclaw returns
  const raw_agent_response =
    data?.response ||
    data?.content ||
    data?.text ||
    data?.choices?.[0]?.message?.content ||
    (typeof data === 'string' ? data : JSON.stringify(data));

  const model =
    data?.model ||
    data?.choices?.[0]?.model ||
    'zeroclaw';

  return {
    model,
    raw_agent_response,
    tool_calls: data?.tool_calls || []
  };
}

module.exports = { callZeroclaw };
