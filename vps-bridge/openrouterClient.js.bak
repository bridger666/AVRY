const axios = require('axios')
const { config, SYSTEM_PROMPTS } = require('./config')
const { logger } = require('./logger')

console.log('[OPENROUTER CLIENT] Module loaded')

const openrouterClient = axios.create({
  baseURL: config.openrouterBaseUrl,
  timeout: config.openrouterTimeout,
  headers: {
    'Authorization': `Bearer ${config.openrouterApiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://aivory.app',
    'X-Title': 'Aivory'
  }
})

function mapError(error) {
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ENETUNREACH') {
    return { statusCode: 503, errorCode: 'AI_BACKEND_UNAVAILABLE', message: 'AI engine temporarily unavailable. Please try again.' }
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return { statusCode: 504, errorCode: 'AI_BACKEND_TIMEOUT', message: 'The AI request took too long to process. Please try again.' }
  }
  if (error.response) {
    const status = error.response.status
    if (status >= 400 && status < 500) {
      return { statusCode: status, errorCode: 'AI_BACKEND_CLIENT_ERROR', message: error.response.data?.error?.message || 'Invalid request to AI engine.' }
    }
    if (status >= 500) {
      return { statusCode: 502, errorCode: 'AI_BACKEND_ERROR', message: 'AI engine temporarily unavailable. Please try again.' }
    }
  }
  return { statusCode: 500, errorCode: 'INTERNAL_SERVER_ERROR', message: 'Unexpected error. Please try again.' }
}

function extractJSON(text) {
  try {
    return JSON.parse(text)
  } catch (e) {
    const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[1]) } catch (e2) {}
    }
    const objectMatch = text.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      try { return JSON.parse(objectMatch[0]) } catch (e3) {}
    }
    return null
  }
}

async function repairJSON(model, originalMessages, invalidResponse, requestId) {
  try {
    logger.warn('Attempting JSON repair', { request_id: requestId })
    const repairMessages = [
      ...originalMessages,
      { role: 'assistant', content: invalidResponse },
      { role: 'user', content: 'Fix and return valid JSON only. No markdown, no explanation.' }
    ]
    const response = await openrouterClient.post('/chat/completions', { model, messages: repairMessages, stream: false })
    const repairedText = response.data.choices[0].message.content
    return extractJSON(repairedText)
  } catch (error) {
    logger.error('JSON repair failed', { request_id: requestId, error: error.message })
    return null
  }
}

async function sendRequest(model, useCase, userContent, requestId, validateJSON) {
  try {
    const systemPrompt = SYSTEM_PROMPTS[useCase]
    if (!systemPrompt) throw new Error('No system prompt found for use case: ' + useCase)
    
    logger.debug('Sending request to OpenRouter', { request_id: requestId, model, use_case: useCase })
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]
    
    const response = await openrouterClient.post('/chat/completions', { model, messages, stream: false })
    logger.debug('Received response from OpenRouter', { request_id: requestId, status: response.status })
    
    const content = response.data.choices[0].message.content
    
    if (validateJSON) {
      let jsonData = extractJSON(content)
      if (!jsonData) {
        logger.warn('Initial JSON extraction failed, attempting repair', { request_id: requestId })
        jsonData = await repairJSON(model, messages, content, requestId)
      }
      if (!jsonData) {
        const err = new Error('AI returned invalid response. Please try again.')
        err.statusCode = 502
        err.errorCode = 'LLM_INVALID_RESPONSE'
        throw err
      }
      return jsonData
    }
    
    return content
  } catch (error) {
    logger.error('OpenRouter request failed', { request_id: requestId, error: error.message, code: error.code, status: error.response?.status })
    if (error.statusCode && error.errorCode) throw error
    const mappedError = mapError(error)
    const err = new Error(mappedError.message)
    err.statusCode = mappedError.statusCode
    err.errorCode = mappedError.errorCode
    throw err
  }
}

async function sendStreamingRequest(model, useCase, messages, responseStream, requestId) {
  console.log('[sendStreamingRequest] ENTRY POINT called at', Date.now())
  console.log('[sendStreamingRequest] params:', { model, useCase, messagesLength: messages?.length, requestId })
  
  try {
    const systemPrompt = SYSTEM_PROMPTS[useCase]
    console.log('[SSE] SYSTEM PROMPT CONTENT (first 300 chars):', systemPrompt ? systemPrompt.substring(0, 300) : 'NULL')
    if (!systemPrompt) throw new Error('No system prompt found for use case: ' + useCase)
    
    logger.debug('Sending streaming request to OpenRouter', { request_id: requestId, model, use_case: useCase })
    
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ]
    
    const response = await openrouterClient.post('/chat/completions', {
      model,
      messages: fullMessages,
      stream: true
    }, {
      responseType: 'stream'
    })
    
    console.log('[sendStreamingRequest] OpenRouter responded, starting transformation')
    
    responseStream.setHeader('Content-Type', 'text/event-stream')
    responseStream.setHeader('Cache-Control', 'no-cache')
    responseStream.setHeader('Connection', 'keep-alive')
    
    let buffer = ''
    
    response.data.on('data', (chunk) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        
        if (trimmed === 'data: [DONE]') {
          console.log('[sendStreamingRequest] received [DONE]')
          responseStream.write('data: {"type":"done"}\n\n')
          continue
        }
        
        if (!trimmed.startsWith('data: ')) continue
        
        try {
          const json = JSON.parse(trimmed.slice(6))
          const content = json?.choices?.[0]?.delta?.content
          if (content) {
            console.log('[sendStreamingRequest] sending chunk, length:', content.length)
            responseStream.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`)
          }
        } catch (e) {
          logger.warn('Failed to parse SSE chunk', { request_id: requestId, error: e.message })
        }
      }
    })
    
    response.data.on('end', () => {
      console.log('[sendStreamingRequest] stream ended')
      responseStream.end()
    })
    
    response.data.on('error', (err) => {
      console.error('[sendStreamingRequest] stream error:', err)
      logger.error('Streaming error from OpenRouter', { request_id: requestId, error: err.message })
      responseStream.write('data: {"type":"error","content":"Stream error"}\n\n')
      responseStream.end()
    })
    
  } catch (err) {
    console.error('[sendStreamingRequest] ERROR:', err.response?.data || err.message)
    logger.error('OpenRouter streaming request failed', { request_id: requestId, error: err.message, code: err.code, status: err.response?.status })
    
    if (!responseStream.headersSent) {
      responseStream.write('data: {"type":"error","content":"Failed to connect to AI engine"}\n\n')
    }
    responseStream.end()
    
    const mappedError = mapError(err)
    const error = new Error(mappedError.message)
    error.statusCode = mappedError.statusCode
    error.errorCode = mappedError.errorCode
    throw error
  }
}

async function healthCheck() {
  return !!config.openrouterApiKey
}

module.exports = { sendRequest, sendStreamingRequest, healthCheck, mapError }
