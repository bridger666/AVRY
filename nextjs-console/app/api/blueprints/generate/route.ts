/**
 * API Route: POST /api/blueprints/generate
 * 
 * Generates a new blueprint version based on diagnostic results.
 * This route acts as a secure proxy to the VPS bridge, ensuring API keys
 * are not exposed to the frontend.
 * 
 * Requirements: 1.1, 1.2, 4.1, 4.2, 5.3, 5.6, 5.8
 */

import { NextRequest } from 'next/server'
import { getConfig } from '@/lib/config'
import { createErrorResponse } from '@/types/errors'
import type { BlueprintGenerateRequest, BlueprintGenerateResponse } from '@/types/blueprint'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json() as BlueprintGenerateRequest
    const { organization_id, diagnostic_id, objective } = body
    // diagnostic_data: full result object passed from the result page
    const diagnostic_data = (body as any).diagnostic_data

    // Validate required fields — diagnostic_data OR diagnostic_id must be present
    if (!organization_id || (!diagnostic_id && !diagnostic_data) || !objective) {
      return Response.json(
        createErrorResponse(
          'ValidationError',
          'Missing required fields',
          {
            required: ['organization_id', 'diagnostic_id or diagnostic_data', 'objective'],
            received: { organization_id, diagnostic_id, objective }
          }
        ),
        { status: 400 }
      )
    }

    // Get VPS bridge configuration
    const config = getConfig()

    // Forward request to VPS bridge with 120s timeout (blueprint generation is slow)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120_000)

    let response: Response
    try {
      response = await fetch(`${config.VPS_BRIDGE_URL}/blueprints/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': config.VPS_BRIDGE_API_KEY
        },
        body: JSON.stringify({
          organization_id,
          diagnostic_id,
          // Pass full diagnostic_data so VPS Bridge can build the blueprint prompt
          diagnostic_data: diagnostic_data || { diagnostic_id },
          objective
        }),
        signal: controller.signal
      })
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return Response.json(
          createErrorResponse('TimeoutError', 'Blueprint generation timed out. Please try again.'),
          { status: 504 }
        )
      }
      throw err
    } finally {
      clearTimeout(timeout)
    }

    // Handle VPS bridge errors
    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = { error: 'Unknown error', message: 'Failed to parse error response' }
      }

      return Response.json(
        createErrorResponse(
          errorData.error || 'ServiceError',
          errorData.message || 'VPS bridge request failed',
          errorData.details
        ),
        { status: response.status }
      )
    }

    // Parse and return successful response
    const data = await response.json() as BlueprintGenerateResponse

    return Response.json(data)

  } catch (error) {
    // Handle configuration errors
    if (error instanceof Error && error.message.includes('Missing required environment variables')) {
      return Response.json(
        createErrorResponse(
          'ConfigurationError',
          'Server configuration error',
          { message: error.message }
        ),
        { status: 500 }
      )
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return Response.json(
        createErrorResponse(
          'NetworkError',
          'Service temporarily unavailable. Please try again.',
          { message: error.message }
        ),
        { status: 503 }
      )
    }

    // Handle unexpected errors
    console.error('Blueprint generation error:', error)
    return Response.json(
      createErrorResponse(
        'InternalError',
        'An unexpected error occurred',
        { message: error instanceof Error ? error.message : 'Unknown error' }
      ),
      { status: 500 }
    )
  }
}
