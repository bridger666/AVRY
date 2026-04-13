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
  const lastMessageRef = useRef<string>('')
  const abortRef = useRef<boolean>(false)
  const router = useRouter()
  const { setPendingContext } = useRouterContext()

  // FIX 1: Removed console.log that runs on every render

  const triggerClassification = useCallback((userMsg: string, aiReply: string): void => {
    const key = userMsg.trim().slice(0, 100)
    if (key === lastMessageRef.current) return

    lastMessageRef.current = key
    abortRef.current = true
    setPendingRoute(null)
    abortRef.current = false
    setIsClassifying(true)

    console.log('[IntentRouter] triggering classification for:', userMsg.slice(0, 50))
    classifyIntent(userMsg, aiReply).then((result) => {
      console.log('[IntentRouter] classify result:', result)
      console.log('[IntentRouter] intent value:', result?.route, '| confidence:', result?.confidence)
      if (abortRef.current) return
      setIsClassifying(false)
      if (result.route !== 'console' && result.confidence >= 0.75) {
        console.log('[IntentRouter] setting pendingRoute:', result)
        setPendingRoute(result)
      } else {
        console.log('[IntentRouter] ❌ confidence tidak cukup atau route adalah console')
      }
    }).catch((err) => {
      console.log('[IntentRouter] error during classification:', err)
      setIsClassifying(false)
    })
  }, [])

  const dismissRoute = useCallback((): void => {
    setPendingRoute(null)
    abortRef.current = true
  }, [])

  const acceptRoute = useCallback((): void => {
    if (!pendingRoute) return
    const path = TAB_PATHS[pendingRoute.route] ?? '/console'
    setPendingContext({
      triggerMessage: lastMessageRef.current,
      aiReplySummary: '',
      targetRoute: pendingRoute.route,
      timestamp: Date.now(),
    })
    setPendingRoute(null)
    abortRef.current = true
    router.push(path)
  }, [pendingRoute, router, setPendingContext])

  return { pendingRoute: pendingRoute ?? null, isClassifying, triggerClassification, dismissRoute, acceptRoute }
}