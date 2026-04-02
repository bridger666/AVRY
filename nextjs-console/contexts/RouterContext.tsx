"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface RoutingContext {
  triggerMessage: string
  aiReplySummary: string
  targetRoute: string
  timestamp: number
}

interface RouterContextValue {
  pendingContext: RoutingContext | null
  setPendingContext: (ctx: RoutingContext) => void
  clearPendingContext: () => void
}

const RouterContext = createContext<RouterContextValue | null>(null)

const SESSION_KEY = 'aivory:routing:ctx'

export function RouterProvider({ children }: { children: ReactNode }) {
  const [pendingContext, setPendingContextState] = useState<RoutingContext | null>(null)

  const setPendingContext = useCallback((ctx: RoutingContext) => {
    setPendingContextState(ctx)
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(ctx))
    } catch {}
  }, [])

  const clearPendingContext = useCallback(() => {
    setPendingContextState(null)
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {}
  }, [])

  return (
    <RouterContext.Provider value={{ pendingContext, setPendingContext, clearPendingContext }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouterContext(): RouterContextValue {
  const ctx = useContext(RouterContext)
  if (!ctx) throw new Error('useRouterContext must be used within RouterProvider')
  return ctx
}
