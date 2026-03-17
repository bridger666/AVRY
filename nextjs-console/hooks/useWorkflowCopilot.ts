'use client'

/**
 * useWorkflowCopilot
 * Two-mode AIRA copilot hook:
 *   sendChat()    → chat mode (natural language answer, no canvas change)
 *   buildWorkflow() → workflow mode (generates steps, shows "Apply to canvas")
 */

import { useState, useCallback } from 'react'
import { askAiraChat, generateWorkflow, GeneratedWorkflowStep } from '@/lib/workflows/copilotClient'
import type { SavedWorkflow } from '@/hooks/useWorkflows'

export interface CopilotMessage {
  role: 'user' | 'assistant'
  content: string
  /** Only present on assistant messages that produced a workflow spec */
  suggestion?: CopilotSuggestion
}

export interface CopilotSuggestion {
  trigger: string
  steps: SavedWorkflow['steps']
  estimate_hours?: number | null
  automation_score?: number | null
}

interface UseWorkflowCopilotOptions {
  currentSpec: SavedWorkflow | null
}

export function useWorkflowCopilot({ currentSpec }: UseWorkflowCopilotOptions) {
  const [messages, setMessages] = useState<CopilotMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSuggestion, setLastSuggestion] = useState<CopilotSuggestion | null>(null)

  // Build workflow context to pass along when a spec is loaded
  const workflowContext = currentSpec
    ? {
        title: currentSpec.title,
        trigger: currentSpec.trigger,
        steps: currentSpec.steps.map((s, i) => ({ step: i + 1, action: s.action })),
      }
    : undefined

  /** Chat mode — natural language answer, no canvas change */
  const sendChat = useCallback(async (message: string) => {
    if (!message.trim()) return
    setError(null)
    setMessages(prev => [...prev, { role: 'user', content: message }])
    setLoading(true)

    try {
      const result = await askAiraChat({ message, workflowContext })
      setMessages(prev => [...prev, { role: 'assistant', content: result.content }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(msg)
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${msg}` }])
    } finally {
      setLoading(false)
    }
  }, [workflowContext])

  /** Workflow builder mode — generates steps, attaches suggestion to message */
  const buildWorkflow = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return
    setError(null)
    setMessages(prev => [...prev, { role: 'user', content: prompt }])
    setLoading(true)

    try {
      let description = prompt
      if (currentSpec) {
        const stepSummary = currentSpec.steps
          .map((s, i) => `Step ${i + 1}: ${s.action}`)
          .join('\n')
        description = `Current workflow "${currentSpec.title}":\nTrigger: ${currentSpec.trigger}\n${stepSummary}\n\nUser request: ${prompt}`
      }

      const result = await generateWorkflow({ description, workflowContext })

      const newSteps: SavedWorkflow['steps'] = result.steps.map((s: GeneratedWorkflowStep, i: number) => ({
        step: i + 1,
        action: s.title + (s.description ? ` — ${s.description}` : ''),
        tool: '',
        output: '',
        type: s.type,
      }))

      const triggerStep = result.steps[0]
      const trigger = triggerStep
        ? triggerStep.title + (triggerStep.description ? ` — ${triggerStep.description}` : '')
        : (currentSpec?.trigger ?? '')

      const suggestion: CopilotSuggestion = {
        trigger,
        steps: newSteps.slice(1),
        estimate_hours: result.estimate_hours ?? null,
        automation_score: result.automation_score ?? null,
      }

      setLastSuggestion(suggestion)

      const stepLines = result.steps
        .map((s: GeneratedWorkflowStep, i: number) =>
          `${i + 1}. [${s.type}] ${s.title}${s.description ? ` — ${s.description}` : ''}`
        )
        .join('\n')

      const content =
        `Here's your workflow (${result.steps.length} steps):\n\n${stepLines}` +
        (result.estimate_hours ? `\n\nEstimated time: ~${result.estimate_hours}h` : '') +
        (result.automation_score ? `\nAutomation score: ${Math.round((result.automation_score ?? 0) * 100)}%` : '')

      setMessages(prev => [...prev, { role: 'assistant', content, suggestion }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed. Please try again.'
      setError(msg)
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${msg}` }])
    } finally {
      setLoading(false)
    }
  }, [currentSpec, workflowContext])

  const clearMessages = useCallback(() => {
    setMessages([])
    setLastSuggestion(null)
    setError(null)
  }, [])

  return { messages, loading, error, lastSuggestion, sendChat, buildWorkflow, clearMessages }
}
