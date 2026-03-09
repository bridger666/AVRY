import { NextRequest, NextResponse } from 'next/server'
import { VPS_BRIDGE_CONFIG } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, answers } = body

    // Validate request
    if (!organization_id || !answers) {
      return NextResponse.json(
        { message: 'Missing required fields: organization_id and answers' },
        { status: 400 }
      )
    }

    // Validate answers structure
    if (typeof answers !== 'object' || Object.keys(answers).length !== 12) {
      return NextResponse.json(
        { message: 'Invalid answers format. Expected 12 question answers.' },
        { status: 400 }
      )
    }

    // Call VPS Bridge
    const response = await fetch(`${VPS_BRIDGE_CONFIG.baseUrl}/diagnostics/free/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': VPS_BRIDGE_CONFIG.apiKey
      },
      body: JSON.stringify({
        organization_id,
        mode: 'free',
        answers,
        language: 'en'
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: true,
        code: 'VPS_BRIDGE_ERROR',
        message: 'VPS Bridge request failed' 
      }))
      return NextResponse.json(
        { 
          message: errorData.message || 'Failed to process diagnostic',
          error: errorData.error,
          code: errorData.code
        },
        { status: response.status }
      )
    }

    const result = await response.json()

    // Normalize field names from VPS Bridge to frontend expectations
    const normalized = {
      ...result,
      // Normalize score field
      score: result.score ?? result.ai_readiness_score ?? 0,
      // Normalize narrative field
      narrative: result.narrative ?? result.narrative_summary ?? '',
    }

    return NextResponse.json({
      status: 'success',
      type: 'free_diagnostic',
      version: 'v2',
      data: normalized,
      timestamp: new Date().toISOString(),
      // Also spread top-level for backward compat with service validation
      ...normalized
    })
  } catch (error) {
    console.error('[API] Free diagnostic error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
