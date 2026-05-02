/**
 * OpenRouter Client — clean rewrite
 * Provides: sendRequest, sendStreamingRequest, callLLMWithFallback, healthCheck, mapError
 */

const axios = require('axios');
const { config, SYSTEM_PROMPTS } = require('./config');
const { logger } = require('./logger');

const openrouterClient = axios.create({
  baseURL: config.openrouterBaseUrl,
  timeout: config.openrouterTimeout,
  headers: {
    'Authorization': 'Bearer ' + config.openrouterApiKey,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://aivory.app',
    'X-Title': 'Aivory'
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

function mapError(error) {
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ENETUNREACH') {
    return { statusCode: 503, errorCode: 'AI_BACKEND_UNAVAILABLE', message: 'AI engine temporarily unavailable. Please try again.' };
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return { statusCode: 504, errorCode: 'AI_BACKEND_TIMEOUT', message: 'The AI request took too long to process. Please try again.' };
  }
  if (error.response) {
    const status = error.response.status;
    if (status >= 400 && status < 500) {
      return { statusCode: status, errorCode: 'AI_BACKEND_CLIENT_ERROR', message: error.response.data?.error?.message || 'Invalid request to AI engine.' };
    }
    if (status >= 500) {
      return { statusCode: 502, errorCode: 'AI_BACKEND_ERROR', message: 'AI engine temporarily unavailable. Please try again.' };
    }
  }
  return { statusCode: 500, errorCode: 'INTERNAL_SERVER_ERROR', message: 'Unexpected error. Please try again.' };
}

// ============================================================================
// JSON EXTRACTION & REPAIR
// ============================================================================

function extractJSON(text) {
  try {
    return JSON.parse(text);
  } catch (_e) {
    const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[1]); } catch (_e2) { /* ignore */ }
    }
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try { return JSON.parse(objectMatch[0]); } catch (_e3) { /* ignore */ }
    }
    return null;
  }
}

async function repairJSON(model, originalMessages, invalidResponse, requestId) {
  try {
    logger.warn('Attempting JSON repair', { request_id: requestId });
    const repairMessages = [
      ...originalMessages,
      { role: 'assistant', content: invalidResponse },
      { role: 'user', content: 'Fix and return valid JSON only. No markdown, no explanation.' }
    ];
    const response = await openrouterClient.post('/chat/completions', {
      model,
      messages: repairMessages,
      stream: false
    });
    const repairedText = response.data.choices[0].message.content;
    return extractJSON(repairedText);
  } catch (error) {
    logger.error('JSON repair failed', { request_id: requestId, error: error.message });
    return null;
  }
}

// ============================================================================
// LLM FALLBACK CHAIN
// ============================================================================

/**
 * Try each model in the chain until one succeeds.
 * Retries on 429, 5xx, and network errors.
 * @param {string[]} models - Ordered list of model IDs to try
 * @param {Array} messages - Chat messages array
 * @param {Object} opts - { stream: boolean, requestId: string }
 * @returns {{ model: string, data?: object, response?: object }}
 */
async function callLLMWithFallback(models, messages, opts = {}) {
  const { stream = false, requestId = 'unknown' } = opts;
  const RETRYABLE = [429, 500, 502, 503, 504];
  const RETRYABLE_CODES = ['ECONNREFUSED', 'ENOTFOUND', 'ENETUNREACH', 'ECONNABORTED', 'ETIMEDOUT'];

  let lastError = null;

  for (const model of models) {
    try {
      logger.debug(`[callLLMWithFallback] trying model=${model} stream=${stream}`, { request_id: requestId });

      if (stream) {
        const response = await openrouterClient.post('/chat/completions', {
          model,
          messages,
          stream: true
        }, {
          responseType: 'stream'
        });
        return { model, response };
      } else {
        const response = await openrouterClient.post('/chat/completions', {
          model,
          messages,
          stream: false
        });
        return { model, data: response.data };
      }
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const code = error.code;
      const isRetryable = (status && RETRYABLE.includes(status)) || (code && RETRYABLE_CODES.includes(code));

      logger.warn(`[callLLMWithFallback] model=${model} failed: status=${status} code=${code} retryable=${isRetryable}`, { request_id: requestId });

      if (!isRetryable) {
        throw error; // Non-retryable error, don't try next model
      }
      // Continue to next model in chain
    }
  }

  // All models failed
  throw lastError || new Error('All models in fallback chain failed');
}

// ============================================================================
// SEND REQUEST (non-streaming, JSON or text)
// ============================================================================

async function sendRequest(model, useCase, userContent, requestId, validateJSON, models) {
  try {
    const systemPrompt = SYSTEM_PROMPTS[useCase];
    if (!systemPrompt) throw new Error('No system prompt found for use case: ' + useCase);

    logger.debug('Sending request to OpenRouter', { request_id: requestId, model, use_case: useCase });

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ];

    // Use fallback chain if models array provided, otherwise single model
    const chain = models && models.length > 0 ? models : [model];
    const result = await callLLMWithFallback(chain, messages, { stream: false, requestId });
    const usedModel = result.model;

    logger.debug('Received response from OpenRouter', { request_id: requestId, model: usedModel });

    const content = result.data.choices[0].message.content;

    if (validateJSON) {
      let jsonData = extractJSON(content);
      if (!jsonData) {
        logger.warn('Initial JSON extraction failed, attempting repair', { request_id: requestId });
        jsonData = await repairJSON(usedModel, messages, content, requestId);
      }
      if (!jsonData) {
        const err = new Error('AI returned invalid response. Please try again.');
        err.statusCode = 502;
        err.errorCode = 'LLM_INVALID_RESPONSE';
        throw err;
      }
      return jsonData;
    }

    return content;
  } catch (error) {
    logger.error('OpenRouter request failed', { request_id: requestId, error: error.message, code: error.code, status: error.response?.status });
    if (error.statusCode && error.errorCode) throw error;
    const mappedError = mapError(error);
    const err = new Error(mappedError.message);
    err.statusCode = mappedError.statusCode;
    err.errorCode = mappedError.errorCode;
    throw err;
  }
}

// ============================================================================
// SEND STREAMING REQUEST (SSE)
// ============================================================================

async function sendStreamingRequest(model, useCase, messages, responseStream, requestId, models) {
  try {
    const systemPrompt = SYSTEM_PROMPTS[useCase];
    if (!systemPrompt) throw new Error('No system prompt found for use case: ' + useCase);

    logger.debug('Sending streaming request to OpenRouter', { request_id: requestId, model, use_case: useCase });

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // Use fallback chain if models array provided, otherwise single model
    const chain = models && models.length > 0 ? models : [model];
    const result = await callLLMWithFallback(chain, fullMessages, { stream: true, requestId });
    const response = result.response;

    // Set SSE headers
    responseStream.setHeader('Content-Type', 'text/event-stream');
    responseStream.setHeader('Cache-Control', 'no-cache');
    responseStream.setHeader('Connection', 'keep-alive');

    // Transform OpenRouter SSE format to simplified format expected by frontend
    let buffer = '';

    response.data.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim() || line.startsWith(':')) continue;

        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            responseStream.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              responseStream.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`);
            }
          } catch (_parseErr) {
            // Skip unparseable chunks
          }
        }
      }
    });

    response.data.on('error', (err) => {
      logger.error('Streaming error from OpenRouter', { request_id: requestId, error: err.message });
      responseStream.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'Stream error' })}\n\n`);
      responseStream.end();
    });

    response.data.on('end', () => {
      logger.debug('Streaming completed', { request_id: requestId });
      responseStream.end();
    });

  } catch (error) {
    logger.error('OpenRouter streaming request failed', { request_id: requestId, error: error.message, code: error.code, status: error.response?.status });

    // Try to send error to client if headers not sent
    if (!responseStream.headersSent) {
      responseStream.setHeader('Content-Type', 'text/event-stream');
      responseStream.setHeader('Cache-Control', 'no-cache');
      responseStream.setHeader('Connection', 'keep-alive');
    }
    responseStream.write(`data: ${JSON.stringify({ type: 'error', error: error.message || 'Failed to connect to AI engine' })}\n\n`);
    responseStream.end();
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

async function healthCheck() {
  return !!config.openrouterApiKey;
}

module.exports = { sendRequest, sendStreamingRequest, callLLMWithFallback, healthCheck, mapError };
