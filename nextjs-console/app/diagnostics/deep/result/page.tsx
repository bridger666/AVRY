'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DeepDiagnosticService } from '@/services/deepDiagnostic'
import { FreeDiagnosticService } from '@/services/freeDiagnostic'
import DeepVsFreeComparison from '@/components/diagnostics/DeepVsFreeComparison'
import { saveRoadmap } from '@/hooks/useRoadmap'
import styles from './result.module.css'

// Actual VPS Bridge response shape
interface DiagnosticResultV1 {
  diagnostic_id: string
  ai_readiness_score: number
  score?: number
  maturity_level: string
  strengths: string[]
  primary_constraints: string[]
  automation_opportunities: string[]
  narrative_summary: string
  recommended_next_step: string
}

export default function DeepDiagnosticResultPage() {
  const router = useRouter()
  const [result, setResult] = useState<DiagnosticResultV1 | null>(null)
  const [hasFreeResult, setHasFreeResult] = useState(false)
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false)
  const [blueprintError, setBlueprintError] = useState<string | null>(null)
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false)
  const [roadmapError, setRoadmapError] = useState<string | null>(null)

  useEffect(() => {
    const loaded = DeepDiagnosticService.loadResult()
    if (!loaded) {
      router.push('/diagnostics/deep')
      return
    }
    setResult(loaded as unknown as DiagnosticResultV1)
    setHasFreeResult(FreeDiagnosticService.isCompleted())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenerateBlueprint = async () => {
    if (!result) return
    setIsGeneratingBlueprint(true)
    setBlueprintError(null)

    try {
      // Pull companyName from stored progress, fall back to demo_org
      const progress = DeepDiagnosticService.loadProgress()
      const organizationId = (progress as any)?.companyName || 'demo_org'
      // Derive objective from the result
      const objective = result.recommended_next_step || result.narrative_summary || 'AI readiness improvement'

      const response = await DeepDiagnosticService.generateBlueprint(
        result.diagnostic_id,
        organizationId,
        objective,
        result as unknown as Record<string, any>
      )
      localStorage.setItem('aivory_blueprint', JSON.stringify(response))
      router.push('/blueprint')
    } catch (err) {
      setBlueprintError(
        err instanceof Error ? err.message : 'Failed to generate blueprint. Please try again.'
      )
      setIsGeneratingBlueprint(false)
    }
  }

  const handleGenerateRoadmap = async () => {
    if (!result) return
    setIsGeneratingRoadmap(true)
    setRoadmapError(null)
    try {
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'diagnostic',
          diagnosticContext: result,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to generate roadmap')
      saveRoadmap(data.roadmap)
      router.push('/roadmap')
    } catch (err) {
      setRoadmapError(err instanceof Error ? err.message : 'Failed to generate roadmap')
      setIsGeneratingRoadmap(false)
    }
  }

  if (!result) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} aria-label="Loading results..." />
      </div>
    )
  }

  const score = result.ai_readiness_score ?? result.score ?? 0
  const strengths = Array.isArray(result.strengths) ? result.strengths : []
  const constraints = Array.isArray(result.primary_constraints) ? result.primary_constraints : []
  const opportunities = Array.isArray(result.automation_opportunities) ? result.automation_opportunities : []

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>

        {/* Header */}
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Your AI Readiness Report</h1>
          <p className={styles.pageSubtitle}>
            A comprehensive analysis of your organization's AI readiness.
          </p>
        </header>

        {/* Score + Maturity */}
        <section className={styles.section}>
          <div className={styles.scoreCard}>
            <div className={styles.scoreBlock}>
              <span className={styles.scoreNumber}>{Math.round(score)}</span>
              <span className={styles.scoreMax}>/100</span>
            </div>
            <div className={styles.maturityBlock}>
              <span className={styles.maturityLabel}>Maturity Level</span>
              <span className={styles.maturityBadge}>{result.maturity_level}</span>
            </div>
          </div>
        </section>

        {/* Strengths */}
        {strengths.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Strengths</h2>
            <div className={styles.listCard}>
              <ul className={styles.bulletList}>
                {strengths.map((item, i) => (
                  <li key={i} className={styles.bulletItem}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Primary Constraints */}
        {constraints.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Primary Constraints</h2>
            <div className={styles.listCard}>
              <ul className={styles.bulletList}>
                {constraints.map((item, i) => (
                  <li key={i} className={styles.bulletItem}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Automation Opportunities */}
        {opportunities.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Automation Opportunities</h2>
            <div className={styles.listCard}>
              <ul className={styles.bulletList}>
                {opportunities.map((item, i) => (
                  <li key={i} className={styles.bulletItem}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Narrative Summary */}
        {result.narrative_summary && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Analysis</h2>
            <div className={styles.narrativeCard}>
              <p className={styles.narrativeText}>{result.narrative_summary}</p>
            </div>
          </section>
        )}

        {/* Recommended Next Step */}
        {result.recommended_next_step && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Recommended Next Step</h2>
            <div className={styles.nextStepCard}>
              <p className={styles.nextStepText}>{result.recommended_next_step}</p>
            </div>
          </section>
        )}

        {/* Deep vs Free Comparison */}
        {hasFreeResult && (
          <section className={styles.section}>
            <DeepVsFreeComparison />
          </section>
        )}

        {/* Blueprint CTA */}
        <section className={styles.blueprintCta}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to build your AI roadmap?</h2>
            <p className={styles.ctaDescription}>
              Generate a personalized blueprint based on your diagnostic results.
            </p>
            {blueprintError && (
              <p className={styles.blueprintError} role="alert">{blueprintError}</p>
            )}
            <button
              className={styles.blueprintButton}
              onClick={handleGenerateBlueprint}
              disabled={isGeneratingBlueprint}
              aria-busy={isGeneratingBlueprint}
            >
              {isGeneratingBlueprint ? (
                <>
                  <span className={styles.buttonSpinner} aria-hidden="true" />
                  Generating Blueprint…
                </>
              ) : (
                'Generate AI System Blueprint'
              )}
            </button>
          </div>
        </section>

        {/* Roadmap CTA */}
        <section className={styles.blueprintCta}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Generate your AI Roadmap</h2>
            <p className={styles.ctaDescription}>
              Turn your diagnostic results into a phased, actionable AI implementation plan with milestones and KPIs.
            </p>
            {roadmapError && (
              <p className={styles.blueprintError} role="alert">{roadmapError}</p>
            )}
            <button
              className={styles.blueprintButton}
              onClick={handleGenerateRoadmap}
              disabled={isGeneratingRoadmap}
              aria-busy={isGeneratingRoadmap}
            >
              {isGeneratingRoadmap ? (
                <>
                  <span className={styles.buttonSpinner} aria-hidden="true" />
                  Generating Roadmap…
                </>
              ) : (
                'Generate AI Roadmap'
              )}
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}
