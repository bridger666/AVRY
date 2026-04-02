import { IntentRoute, INTENT_BOUNDARIES } from './intentBoundaries'

export type { IntentRoute }

export interface ClassifiedIntent {
  route: IntentRoute
  confidence: number
  reason: string
  tabLabel: string
}

const CONFIDENCE_THRESHOLD = 0.75

const FALLBACK: ClassifiedIntent = {
  route: 'console',
  confidence: 0,
  reason: 'Staying in Console',
  tabLabel: 'Console',
}

function buildClassifierPrompt(userMessage: string, aiReply: string): string {
  const boundaryDefs = Object.entries(INTENT_BOUNDARIES).map(([route, def]) =>
    `${route.toUpperCase()} (label: "${def.tabLabel}")\nPositive: ${def.positive.join(', ')}\nNegative: ${def.negative.join(', ')}`
  ).join('\n\n')

  return `You are an intent classifier for Aivory Console.
Analyze the user message and AI reply, then determine which Aivory tab is most relevant.

TAB DEFINITIONS:
${boundaryDefs}

USER MESSAGE: ${userMessage}
AI REPLY: ${aiReply.slice(0, 400)}

RULES:
- Respond ONLY with valid JSON. No markdown, no code fences.
- If confidence < ${CONFIDENCE_THRESHOLD} or intent unclear, route to "console".
- reason = max 8 words, banner copy style.

JSON SHAPE:
{
  "route": "<route>",
  "confidence": <0.0-1.0>,
  "reason": "<max 8 words>",
  "tabLabel": "<display name>"
}`
}

export async function classifyIntent(userMessage: string, aiReply: string): Promise<ClassifiedIntent> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_VPS_BRIDGE_API_KEY ?? process.env.VPS_BRIDGE_API_KEY ?? ''
    console.log('[IntentClassifier] LOG #2 — sebelum fetch ke /api/intent, body:', {
      message: buildClassifierPrompt(userMessage, aiReply).slice(0, 80),
      conversationId: 'intent-classifier',
    })
    
    const response = await fetch(`/api/intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        message: buildClassifierPrompt(userMessage, aiReply),
        context: { endpoint: 'intent-classifier' },
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.log('[IntentClassifier] response tidak ok:', response.status)
      return FALLBACK
    }

    const data = await response.json()
    console.log('[IntentClassifier] LOG #3 — setelah res.json():', JSON.stringify(data))
    
    const raw: string = data?.rawagentresponse ?? ''
    console.log('[IntentClassifier] extracted raw field:', raw.slice(0, 100))
    
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    const validRoutes: IntentRoute[] = ['diagnostic', 'blueprint', 'workflow', 'integration', 'roadmap', 'settings', 'dashboard', 'console']

    console.log('[IntentClassifier] LOG #4 — sebelum threshold check, intent:', parsed?.route, '| confidence:', parsed?.confidence, '| threshold:', CONFIDENCE_THRESHOLD)

    if (
      !validRoutes.includes(parsed?.route) ||
      typeof parsed?.confidence !== 'number' ||
      parsed.confidence < 0 ||
      parsed.confidence > 1 ||
      typeof parsed?.reason !== 'string'
    ) {
      console.log('[IntentClassifier] validation failed, returning FALLBACK')
      return FALLBACK
    }

    if (parsed.confidence < CONFIDENCE_THRESHOLD) {
      console.log('[IntentClassifier] ❌ confidence tidak cukup')
      return FALLBACK
    }

    console.log('[IntentClassifier] ✅ set pendingRoute →', parsed.route)
    return {
      route: parsed.route as IntentRoute,
      confidence: parsed.confidence,
      reason: parsed.reason.slice(0, 60),
      tabLabel: parsed.tabLabel ?? INTENT_BOUNDARIES[parsed.route as IntentRoute].tabLabel,
    }
  } catch (err) {
    console.log('[IntentClassifier] catch error:', err)
    return FALLBACK
  }
}

