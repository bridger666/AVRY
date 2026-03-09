/**
 * Console Streaming API Route
 * 
 * This route acts as a secure proxy between the Next.js frontend and the VPS bridge.
 * It handles streaming AI responses for the console chat interface.
 * 
 * Requirements: 1.1, 1.2, 5.1, 5.6, 5.7, 5.8
 */

import { NextRequest } from 'next/server'
import { getConfig } from '@/lib/config'
import { createErrorResponse } from '@/types/errors'
import type { ConsoleStreamRequest } from '@/types/console'

// FIXED: TIMEOUT INCREASE — raised from 60s to 120s to support long AI responses
export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json() as ConsoleStreamRequest
    const { session_id, organization_id, messages } = body

    // Validate required fields (Requirement 5.1)
    if (!session_id || typeof session_id !== 'string') {
      return Response.json(
        createErrorResponse(
          'ValidationError',
          'session_id is required and must be a string'
        ),
        { status: 400 }
      )
    }

    if (!organization_id || typeof organization_id !== 'string') {
      return Response.json(
        createErrorResponse(
          'ValidationError',
          'organization_id is required and must be a string'
        ),
        { status: 400 }
      )
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        createErrorResponse(
          'ValidationError',
          'messages must be a non-empty array'
        ),
        { status: 400 }
      )
    }

    // Validate message structure
    for (const message of messages) {
      if (!message.role || !['user', 'assistant'].includes(message.role)) {
        return Response.json(
          createErrorResponse(
            'ValidationError',
            'Each message must have a role of "user" or "assistant"'
          ),
          { status: 400 }
        )
      }
      if (typeof message.content !== 'string') {
        return Response.json(
          createErrorResponse(
            'ValidationError',
            'Each message must have a content string'
          ),
          { status: 400 }
        )
      }
    }

    // Get VPS bridge configuration (Requirement 1.1, 1.2)
    const config = getConfig()

    // Forward request to VPS bridge with API key (Requirement 5.6)
    const vpsBridgeUrl = `${config.VPS_BRIDGE_URL}/console/stream`

    // FIXED: TIMEOUT INCREASE — abort after 115s (just under Vercel's 120s hard limit)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 115000)
    
    let vpsBridgeResponse: Response
    try {
      vpsBridgeResponse = await fetch(vpsBridgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': config.VPS_BRIDGE_API_KEY
        },
        body: JSON.stringify({
          session_id,
          organization_id,
          messages
        }),
        signal: controller.signal
      })
    } finally {
      clearTimeout(timeoutId)
    }

    // Handle VPS bridge errors (Requirement 5.8)
    if (!vpsBridgeResponse.ok) {
      let errorMessage = 'Failed to connect to VPS bridge'
      let errorDetails: any = undefined

      try {
        const errorData = await vpsBridgeResponse.json()
        errorMessage = errorData.message || errorMessage
        errorDetails = errorData.details
      } catch {
        // If error response is not JSON, use status text
        errorMessage = vpsBridgeResponse.statusText || errorMessage
      }

      return Response.json(
        createErrorResponse(
          'VPSBridgeError',
          errorMessage,
          errorDetails
        ),
        { status: vpsBridgeResponse.status }
      )
    }

    // Stream response back to client (Requirement 5.7)
    // FIXED: STREAM HEARTBEAT — wrap the VPS bridge body in a TransformStream
    // that injects ": ping\n\n" every 10s to prevent idle timeout on long AI responses
    const sourceBody = vpsBridgeResponse.body!
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    ;(async () => {
      const reader = sourceBody.getReader()
      // FIXED: STREAM HEARTBEAT — send a ping comment every 10s while waiting for data
      let heartbeatTimer: ReturnType<typeof setInterval> | null = setInterval(async () => {
        try { await writer.write(new TextEncoder().encode(': ping\n\n')) } catch { /* stream closed */ }
      }, 10000)

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          await writer.write(value)
        }
      } catch { /* upstream closed */ } finally {
        if (heartbeatTimer) clearInterval(heartbeatTimer)
        try { await writer.close() } catch { /* already closed */ }
      }
    })()

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      }
    })

  } catch (error) {
    // Handle unexpected errors (Requirement 5.8)
    console.error('Console stream error:', error)

    // Check for configuration errors
    if (error instanceof Error && error.message.includes('Missing required environment variables')) {
      return Response.json(
        createErrorResponse(
          'ConfigurationError',
          'Server configuration error. Please contact support.',
          { originalError: error.message }
        ),
        { status: 500 }
      )
    }

    // Check for network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return Response.json(
        createErrorResponse(
          'NetworkError',
          'Service temporarily unavailable. Please try again.',
          { originalError: error.message }
        ),
        { status: 503 }
      )
    }

    // Check for timeout (AbortError)
    if (error instanceof Error && error.name === 'AbortError') {
      return Response.json(
        createErrorResponse(
          'TimeoutError',
          'Request timed out. Try sending a shorter message or smaller file.',
          { originalError: 'AbortError: request exceeded 115s' }
        ),
        { status: 504 }
      )
    }

    // Generic error response
    return Response.json(
      createErrorResponse(
        'InternalError',
        'An unexpected error occurred. Please try again.',
        { originalError: error instanceof Error ? error.message : String(error) }
      ),
      { status: 500 }
    )
  }
}
