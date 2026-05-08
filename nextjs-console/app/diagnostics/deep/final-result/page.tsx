'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { DiagnosticContext } from '@/types/diagnostic'
import HeaderBar from '@/components/result/HeaderBar'
import ScoreRing from '@/components/result/ScoreRing'
import RadarChart from '@/components/result/RadarChart'
import ROIMetricTile from '@/components/result/ROIMetricTile'
import OpportunityMatrix from '@/components/result/OpportunityMatrix'
import OpportunityCard from '@/components/result/OpportunityCard'
import RiskCard from '@/components/result/RiskCard'
import LoadingState from '@/components/result/LoadingState'
import ErrorCard from '@/components/result/ErrorCard'
import {
  formatIDR,
  formatPercent,
  formatMonths,
  humanizeDimensionKey,
} from '@/lib/resultFormatters'
import styles from './final-result.module.css'

// TODO: add schema version field to DiagnosticContext for forward compatibility
function validateContext(raw: unknown): DiagnosticContext | null {
  if (raw === null || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const requiredKeys = ['company', 'calculations', 'scores', 'opportunities', 'risks', 'qualitative']
  for (const key of requiredKeys) {
    if (!(key in obj)) return null
  }

  if (!Array.isArray(obj.opportunities)) return null
  if (!Array.isArray(obj.risks)) return null
  if (typeof obj.scores !== 'object' || obj.scores === null) return null
  if (typeof obj.calculations !== 'object' || obj.calculations === null) return null
  if (typeof obj.qualitative !== 'object' || obj.qualitative === null) return null
  if (typeof obj.company !== 'string') return null

  return raw as DiagnosticContext
}

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; context: DiagnosticContext }

export default function FinalResultPage() {
  const router = useRouter()
  const [state, setState] = useState<PageState>({ status: 'loading' })
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('aivory_diagnostic_context')
    if (!raw) {
      router.push('/diagnostics/deep')
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      setState({ status: 'error', message: 'Failed to parse diagnostic data. Please run the diagnostic again.' })
      return
    }
    const context = validateContext(parsed)
    if (!context) {
      setState({ status: 'error', message: 'Diagnostic data is malformed or incomplete. Please run the diagnostic again.' })
      return
    }
    setState({ status: 'loaded', context })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') return <ErrorCard message={state.message} />

  const { context } = state
  const { scores, calculations, opportunities, risks, qualitative } = context

  const highRiskCount = risks.filter(r => r.severity === 'HIGH').length
  const quickWinCount = opportunities.filter(o => o.quadrant === 'quick_win').length

  const assessmentText = `${context.company} scores ${scores.composite}/100, placing it at ${scores.maturityLevel} maturity. Strongest dimension: ${humanizeDimensionKey(scores.strongestDimension)}. Greatest gap: ${humanizeDimensionKey(scores.weakestDimension)}. ${highRiskCount} high-severity risk${highRiskCount !== 1 ? 's' : ''} identified. ${quickWinCount} quick-win opportunit${quickWinCount !== 1 ? 'ies' : 'y'} available.`

  const sortedRisks = [...risks].sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    return order[a.severity] - order[b.severity]
  })

  function qualVal(v: string | string[] | undefined): string {
    if (!v) return 'Not provided'
    if (Array.isArray(v)) return v.length > 0 ? v.join(', ') : 'Not provided'
    return v.trim() || 'Not provided'
  }

  return (
    <div className={styles.page}>
      <HeaderBar company={context.company} submittedAt={context.submittedAt} />

      <div className={styles.content}>

        {/* Executive Scorecard */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Executive Scorecard</h2>
          <div className={styles.scorecardGrid}>
            <div>
              <ScoreRing score={scores.composite} maturityLevel={scores.maturityLevel} />
            </div>
            <div className={styles.scorecardSummary}>
              <RadarChart scores={scores} />
              <div className={styles.summaryRow}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Strongest</span>
                  <span className={styles.summaryValue}>{humanizeDimensionKey(scores.strongestDimension)}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Weakest</span>
                  <span className={styles.summaryValue}>{humanizeDimensionKey(scores.weakestDimension)}</span>
                </div>
              </div>
              <p className={styles.assessmentText}>{assessmentText}</p>
            </div>
          </div>
        </section>

        {/* ROI Projection */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>ROI Projection</h2>

          {!calculations.hasEnoughDataForProjection && (
            <div className={styles.confidenceBanner}>
              <p className={styles.confidenceHeadline}>{calculations.confidenceLevel} confidence projection</p>
              <p className={styles.confidenceBody}>
                These projections are based on limited input data and may not reflect actual outcomes.
              </p>
              {calculations.missingInputs.length > 0 && (
                <p className={styles.missingInputs}>
                  Missing inputs: {calculations.missingInputs.join(', ')}
                </p>
              )}
            </div>
          )}

          <div className={styles.roiGrid}>
            <ROIMetricTile label="Total Annual Savings" value={calculations.totalAnnualSavingsIDR} formatter={formatIDR} />
            <ROIMetricTile label="Annual Labor Savings" value={calculations.annualLaborSavingsIDR} formatter={formatIDR} />
            <ROIMetricTile label="Annual Process Savings" value={calculations.annualProcessSavingsIDR} formatter={formatIDR} />
            <ROIMetricTile
              label="Hours Reclaimed / Year"
              value={calculations.hoursReclaimedPerYear}
              formatter={(v) => `${Math.round(v).toLocaleString()} hours`}
            />
            <ROIMetricTile label="Payback Period" value={calculations.paybackMonths} formatter={formatMonths} />
            <ROIMetricTile label="3-Year ROI" value={calculations.threeYearROIPercent} formatter={formatPercent} />
            <ROIMetricTile label="Cost of Inaction (90 days)" value={calculations.costOfInaction90DaysIDR} formatter={formatIDR} />
          </div>
        </section>

        {/* Opportunity Priority Matrix */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Opportunity Priority Matrix</h2>
          {opportunities.length === 0 ? (
            <p className={styles.emptyMessage}>No opportunities identified.</p>
          ) : (
            <div className={styles.matrixLayout}>
              <OpportunityMatrix
                opportunities={opportunities}
                highlightedId={highlightedId}
                onDotClick={(id) => setHighlightedId(prev => prev === id ? null : id)}
              />
              <div className={styles.opportunityList}>
                {opportunities.map(opp => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    isHighlighted={opp.id === highlightedId}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Risk Register */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Risk Register</h2>
          {sortedRisks.length === 0 ? (
            <p className={styles.emptyMessage}>No risks detected.</p>
          ) : (
            <div className={styles.riskList}>
              {sortedRisks.map(risk => (
                <RiskCard key={risk.id} risk={risk} />
              ))}
            </div>
          )}
        </section>

        {/* Diagnostic Context Snapshot */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Diagnostic Context</h2>
          <div className={styles.contextGrid}>
            <div className={styles.contextItem}>
              <span className={styles.contextLabel}>Primary Objective</span>
              <span className={`${styles.contextValue} ${!qualitative.primaryObjective ? styles.notProvided : ''}`}>
                {qualVal(qualitative.primaryObjective)}
              </span>
            </div>
            <div className={styles.contextItem}>
              <span className={styles.contextLabel}>Top Pain Points</span>
              <span className={`${styles.contextValue} ${!qualitative.topPainPoints ? styles.notProvided : ''}`}>
                {qualVal(qualitative.topPainPoints)}
              </span>
            </div>
            <div className={styles.contextItem}>
              <span className={styles.contextLabel}>Compliance</span>
              <span className={styles.contextValue}>{qualVal(qualitative.compliance)}</span>
            </div>
            <div className={styles.contextItem}>
              <span className={styles.contextLabel}>Implementation Approach</span>
              <span className={styles.contextValue}>{qualVal(qualitative.implementApproach)}</span>
            </div>
            <div className={styles.contextItem}>
              <span className={styles.contextLabel}>AI Capability</span>
              <span className={styles.contextValue}>{qualVal(qualitative.aiCapability)}</span>
            </div>
            <div className={styles.contextItem}>
              <span className={styles.contextLabel}>Leadership Alignment</span>
              <span className={styles.contextValue}>{qualVal(qualitative.leadershipAlignment)}</span>
            </div>
            <div className={styles.contextItem}>
              <span className={styles.contextLabel}>Prior AI Attempts</span>
              <span className={`${styles.contextValue} ${!qualitative.priorAIAttempts ? styles.notProvided : ''}`}>
                {qualVal(qualitative.priorAIAttempts)}
              </span>
            </div>
            <div className={styles.contextItem}>
              <span className={styles.contextLabel}>Resistance Sources</span>
              <span className={styles.contextValue}>{qualVal(qualitative.resistanceSources)}</span>
            </div>
            <div className={styles.contextItem}>
              <span className={styles.contextLabel}>Delay Consequence</span>
              <span className={`${styles.contextValue} ${!qualitative.delayConsequence ? styles.notProvided : ''}`}>
                {qualVal(qualitative.delayConsequence)}
              </span>
            </div>
            <div className={styles.contextItem}>
              <span className={styles.contextLabel}>Error Tolerance</span>
              <span className={styles.contextValue}>{qualVal(qualitative.errorTolerance)}</span>
            </div>
            <div className={styles.contextItem}>
              <span className={styles.contextLabel}>Data Residency</span>
              <span className={`${styles.contextValue} ${!qualitative.dataResidency ? styles.notProvided : ''}`}>
                {qualVal(qualitative.dataResidency)}
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
