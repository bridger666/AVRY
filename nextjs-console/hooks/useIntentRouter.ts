"use client"

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { classifyIntent, ClassifiedIntent } from '@/lib/intentClassifier'
import { useRouterContext } from '@/contexts/RouterContext'

const TAB_PATHS: Record<string, string> = {
  diagnostic: '/diagnostics',
  blueprint: '/blueprint',
  workflow: '/workflows',
  integration: '/integrations',
  roadmap: '/roadmap',
  settings: '/settings',
  dashboard: '/dashboard',
  console: '/console',
}

interface UseIntentRouterReturn {
  pendingRoute: ClassifiedIntent | null
  isClassifying: boolean
  triggerClassification: (userMsg: string, aiReply: string) => void
  dismissRoute: () => void
  acceptRoute: () => void
}

export function useIntentRouter(): UseIntentRouterReturn {
  const [pendingRoute, setPendingRoute] = useState<ClassifiedIntent | null>(null)
  const [isClassifying, setIsClassifying] = useState(false)
  const lastKeyRef = useRef<string>('')
  const cancelledRef = useRef<boolean>(false)
  const router = useRouter()
  const { setPendingContext } = useRouterContext()

  const triggerClassification = useCallback((userMsg: string, aiReply: string): void => {
    // Deduplicate — skip if same message as last classification
    const key = userMsg.trim().slice(0, 100)
    if (key === lastKeyRef.current) return
    lastKeyRef.current = key

    // Cancel any in-flight classification
    cancelledRef.current = true
    setPendingRoute(null)

    // Reset cancel flag for this new run
    cancelledRef.current = false
    setIsClassifying(true)

    // Fire and forget — NEVER awaited, NEVER blocks the chat stream
    classifyIntent(userMsg, aiReply)
      .then((result) => {
        if (cancelledRef.current) return
        setIsClassifying(false)
        // Only show banner for non-console routes with sufficient confidence
        if (result.route !== 'console' && result.confidence >= 0.75) {
          setPendingRoute(result)
        }
      })
      .catch(() => {
        // Silent fail — intent classification is best-effort
        if (!cancelledRef.current) setIsClassifying(false)
      })
  }, [])

  const dismissRoute = useCallback((): void => {
    cancelledRef.current = true
    setPendingRoute(null)
    setIsClassifying(false)
  }, [])

  const acceptRoute = useCallback((): void => {
    if (!pendingRoute) return
    const path = TAB_PATHS[pendingRoute.route] ?? '/console'
    setPendingContext({
      triggerMessage: lastKeyRef.current,
      aiReplySummary: '',
      targetRoute: pendingRoute.route,
      timestamp: Date.now(),
    })
    setPendingRoute(null)
    cancelledRef.current = true
    router.push(path)
  }, [pendingRoute, router, setPendingContext])

  return { pendingRoute, isClassifying, triggerClassification, dismissRoute, acceptRoute }
}
