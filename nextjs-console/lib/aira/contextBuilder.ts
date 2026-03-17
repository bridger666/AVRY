/**
 * AIRA Context Builder
 * Builds the `context` field passed to POST /api/aira/stream.
 * All AIRA traffic — console and floating tabs — goes through the single
 * canonical path: /api/aira/stream → /bridge/aira → Zeroclaw → OpenRouter.
 */

export type AiraSourceTab = 'console' | 'roadmap' | 'diagnostic' | 'workflow' | 'blueprint'

export interface AiraStreamContext {
  source_tab?: AiraSourceTab
  page?: string
  pageContext?: Record<string, unknown>
}

/**
 * Build the context object to include in the /api/aira/stream request body.
 * Usage:
 *   const ctx = buildAiraContext({ sourceTab: 'roadmap', pageContext: { ... } })
 *   // then pass as: { session_id, messages, context: ctx }
 */
export function buildAiraContext(params: {
  sourceTab?: AiraSourceTab
  pageContext?: Record<string, unknown>
}): AiraStreamContext {
  return {
    source_tab: params.sourceTab,
    page: params.sourceTab ?? 'unknown',
    pageContext: params.pageContext ?? {},
  }
}
