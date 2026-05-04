"use client"

import { useState, useCallback } from 'react'
import type { ClassifiedIntent } from '@/lib/intentClassifier'

/**
 * Intent classification is disabled.
 * Zeroclaw handles routing internally via resolveUseCase().
 * This hook is a no-op stub that preserves the interface so callers don't break.
 */

interface UseIntentRouterReturn {
  pendingRoute: ClassifiedIntent | null
  isClassifying: boolean
  triggerClassification: (userMsg: string, aiReply: string) => void
  dismissRoute: () => void
  acceptRoute: () => void
}

export function useIntentRouter(): UseIntentRouterReturn {
  const [pendingRoute] = useState<ClassifiedIntent | null>(null)

  // No-op: Zeroclaw handles its own routing
  const triggerClassification = useCallback((_userMsg: string, _aiReply: string): void => {
    // Intentionally empty — intent classification removed.
    // All messages go directly to /api/console/stream → Zeroclaw.
  }, [])

  const dismissRoute = useCallback((): void => {}, [])
  const acceptRoute = useCallback((): void => {}, [])

  return { pendingRoute, isClassifying: false, triggerClassification, dismissRoute, acceptRoute }
}
