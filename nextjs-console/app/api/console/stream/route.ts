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
    const body = await request.json() as ConsoleStreamRequest
    const { session_id, organization_id, messages } = body

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

    const config = getConfig()
    const vpsBridgeUrl = `${config.VPS_BRIDGE_URL}/bridge/aira`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 115_000)

    let vpsBridgeResponse: Response
    try {
      vpsBridgeResponse = await fetch(vpsBridgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': config.VPS_BRIDGE_API_KEY,
        },
        body: JSON.stringify({
          message: messages.filter((m) => m.role === 'user').at(-1)?.content ?? '',
          mode: 'console',
          channel: 'console_ui',
          entrypoint: 'console',
          context: {
            session_id,
            organization_id,
            history: messages,
          },
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!vpsBridgeResponse.ok) {
      let errorMessage = 'Failed to connect to VPS bridge'
      let errorDetails: any = undefined

      try {
        const errorData = await vpsBridgeResponse.json() as any
        errorMessage = errorData.message || errorData.detail || errorMessage
        errorDetails = errorData.details
      } catch {
        errorMessage = vpsBridgeResponse.statusText || errorMessage
      }

      return Response.json(
        createErrorResponse('VPSBridgeError', errorMessage, errorDetails),
        { status: vpsBridgeResponse.status }
      )
    }

    const bridgeData = await vpsBridgeResponse.json() as {
      raw_agent_response?: string
      rawagentresponse?: string
    }

    const text = bridgeData.raw_agent_response ?? bridgeData.rawagentresponse ?? ''
    const enc = new TextEncoder()

    let workflowSpec: Record<string, unknown> | null = null
    let displayText = text

    const specMatch = text.match(/```workflowspec[\s\S]*?```/)
    if (specMatch) {
      try {
        workflowSpec = JSON.parse(specMatch[1])
        displayText = text.replace(/```workflowspec[\s\S]*?```/,'').trim()
      } catch {
        // ignore invalid JSON in workflowspec
      }
    }

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    ;(async () => {
      try {
        const step = 20

        for (let i = 0; i < displayText.length; i += step) {
          const piece = displayText.slice(i, i + step)

          await writer.write(
            enc.encode(
              `data: ${JSON.stringify({ type: 'chunk', content: piece })}\n\n`
            )
          )
        }

        if (workflowSpec) {
          await writer.write(
            enc.encode(
              `data: ${JSON.stringify({
                type: 'workflowspec',
                workflow: workflowSpec,
              })}\n\n`
            )
          )
        }

        await writer.write(
          enc.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        )
      } finally {
        try {
          await writer.close()
        } catch {
          // ignore
        }
      }
    })()

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('Console stream error:', error)

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

    return Response.json(
      createErrorResponse(
        'InternalError',
        'An unexpected error occurred. Please try again.',
        {
          originalError:
            error instanceof Error ? error.message : String(error),
        }
      ),
      { status: 500 }
    )
  }
}
