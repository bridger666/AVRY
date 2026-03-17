/**
 * CopilotPanel Component
 * 
 * AIRA Copilot panel for refining and explaining workflows.
 * Supports two modes: 'refine' for modifying workflows and 'explain' for understanding them.
 */

import React, { useState, useCallback } from 'react'
import styles from './CopilotPanel.module.css'
import { AivoryWorkflowSpec, AivoryWorkflowEdge, CopilotResult } from '@/types/workflows'

export interface CopilotPanelProps {
  currentWorkflow: AivoryWorkflowSpec
  edges: AivoryWorkflowEdge[]
  onApply?: (spec: AivoryWorkflowSpec, edges: AivoryWorkflowEdge[]) => void
  onClose?: () => void
}

type CopilotMode = 'refine' | 'explain'

interface ExplanationData {
  purpose: string
  steps: Array<{
    id: string
    title: string
    description: string
  }>
  dataFlow: string
  assumptions: string[]
  limitations: string[]
}

/**
 * CopilotPanel component
 * 
 * Provides refine and explain modes for workflow modification and understanding.
 */
export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  currentWorkflow,
  edges,
  onApply,
  onClose,
}) => {
  const [mode, setMode] = useState<CopilotMode>('refine')
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CopilotResult | ExplanationData | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) {
      setError('Please enter a request')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/workflows/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          currentWorkflow,
          intent: mode === 'refine' ? input : undefined,
          description: mode === 'explain' ? input : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${mode} workflow`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} workflow`)
    } finally {
      setIsLoading(false)
    }
  }, [input, mode, currentWorkflow])

  const handleApply = useCallback(() => {
    if (!result || mode !== 'refine') return

    const copilotResult = result as CopilotResult
    onApply?.(copilotResult.spec, copilotResult.edges)
    onClose?.()
  }, [result, mode, onApply, onClose])

  const handleDiscard = useCallback(() => {
    setResult(null)
    setInput('')
    onClose?.()
  }, [onClose])

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>AIRA Copilot</h2>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close copilot panel"
        >
          ✕
        </button>
      </div>

      {!result ? (
        // Input form
        <div className={styles.form}>
          {/* Mode selector */}
          <div className={styles.modeSelector}>
            <button
              className={`${styles.modeButton} ${mode === 'refine' ? styles.active : ''}`}
              onClick={() => {
                setMode('refine')
                setInput('')
                setError(null)
              }}
            >
              Refine
            </button>
            <button
              className={`${styles.modeButton} ${mode === 'explain' ? styles.active : ''}`}
              onClick={() => {
                setMode('explain')
                setInput('')
                setError(null)
              }}
            >
              Explain
            </button>
          </div>

          {/* Input field */}
          <div className={styles.inputGroup}>
            <label htmlFor="copilot-input" className={styles.label}>
              {mode === 'refine'
                ? 'How would you like to modify this workflow?'
                : 'What would you like to know about this workflow?'}
            </label>
            <textarea
              id="copilot-input"
              className={styles.textarea}
              placeholder={
                mode === 'refine'
                  ? 'e.g., Add a step to send an email notification'
                  : 'e.g., What does this workflow do?'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Error message */}
          {error && <div className={styles.error}>{error}</div>}

          {/* Submit button */}
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Processing...
              </>
            ) : (
              `${mode === 'refine' ? 'Refine' : 'Explain'}`
            )}
          </button>
        </div>
      ) : mode === 'refine' ? (
        // Refine result
        <div className={styles.result}>
          <h3 className={styles.resultTitle}>Changes Summary</h3>

          {(result as CopilotResult).changes && (
            <div className={styles.changesList}>
              {(result as CopilotResult).changes!.added.length > 0 && (
                <div className={styles.changeGroup}>
                  <h4 className={styles.changeGroupTitle}>Added Steps</h4>
                  <ul className={styles.list}>
                    {(result as CopilotResult).changes!.added.map((id) => (
                      <li key={id} className={styles.addedItem}>
                        ✓ {id}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(result as CopilotResult).changes!.modified.length > 0 && (
                <div className={styles.changeGroup}>
                  <h4 className={styles.changeGroupTitle}>Modified Steps</h4>
                  <ul className={styles.list}>
                    {(result as CopilotResult).changes!.modified.map((id) => (
                      <li key={id} className={styles.modifiedItem}>
                        ◆ {id}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(result as CopilotResult).changes!.removed.length > 0 && (
                <div className={styles.changeGroup}>
                  <h4 className={styles.changeGroupTitle}>Removed Steps</h4>
                  <ul className={styles.list}>
                    {(result as CopilotResult).changes!.removed.map((id) => (
                      <li key={id} className={styles.removedItem}>
                        ✕ {id}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className={styles.actionButtons}>
            <button className={styles.applyButton} onClick={handleApply}>
              Apply Changes
            </button>
            <button className={styles.discardButton} onClick={handleDiscard}>
              Discard
            </button>
          </div>
        </div>
      ) : (
        // Explain result
        <div className={styles.result}>
          {(result as ExplanationData).purpose && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Purpose</h3>
              <p className={styles.sectionContent}>{(result as ExplanationData).purpose}</p>
            </div>
          )}

          {(result as ExplanationData).steps && (result as ExplanationData).steps.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Steps</h3>
              <ol className={styles.stepsList}>
                {(result as ExplanationData).steps.map((step) => (
                  <li key={step.id} className={styles.stepItem}>
                    <div className={styles.stepTitle}>{step.title}</div>
                    <div className={styles.stepDescription}>{step.description}</div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {(result as ExplanationData).dataFlow && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Data Flow</h3>
              <p className={styles.sectionContent}>{(result as ExplanationData).dataFlow}</p>
            </div>
          )}

          {(result as ExplanationData).assumptions && (result as ExplanationData).assumptions.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Assumptions</h3>
              <ul className={styles.list}>
                {(result as ExplanationData).assumptions.map((assumption, index) => (
                  <li key={index}>{assumption}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Close button */}
          <button className={styles.closeResultButton} onClick={handleDiscard}>
            Close
          </button>
        </div>
      )}
    </div>
  )
}

export default CopilotPanel
