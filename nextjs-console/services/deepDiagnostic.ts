import {
  PhaseId,
  PhaseConfig,
  DeepDiagnosticProgress,
  DeepDiagnosticResponse,
  DeepDiagnosticResult
} from '@/types/deepDiagnostic'
import type { BlueprintV1 } from '@/types/blueprint'

// In-memory fallback when localStorage is unavailable
let _memoryProgress: DeepDiagnosticProgress | null = null

/**
 * Service for managing Deep Diagnostic operations
 * Handles localStorage persistence, API calls, and validation
 */
export class DeepDiagnosticService {
  private static readonly STORAGE_KEY = 'aivory_deep_diagnostic'
  private static readonly RESULT_KEY = 'aivory_deep_result'

  /**
   * Save progress to localStorage with debouncing
   */
  static saveProgress(progress: DeepDiagnosticProgress): void {
    try {
      const data = {
        ...progress,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('[DeepDiagnostic] Failed to save progress:', error)
      _memoryProgress = { ...progress, lastUpdated: new Date().toISOString() }
    }
  }

  /**
   * Load progress from localStorage
   */
  static loadProgress(): DeepDiagnosticProgress | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return _memoryProgress
      
      const progress = JSON.parse(stored) as DeepDiagnosticProgress
      
      // Validate structure
      if (!progress.phases || !progress.currentPhase) {
        console.warn('[DeepDiagnostic] Invalid stored data, clearing')
        this.clearProgress()
        return null
      }
      
      return progress
    } catch (error) {
      console.error('[DeepDiagnostic] Failed to load progress:', error)
      return _memoryProgress
    }
  }

  /**
   * Clear all progress
   */
  static clearProgress(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('[DeepDiagnostic] Failed to clear progress:', error)
      _memoryProgress = null
    }
    _memoryProgress = null
  }

  /**
   * Submit diagnostic to VPS Bridge
   */
  static async submitDiagnostic(
    organizationId: string,
    phases: Record<PhaseId, Record<string, any>>
  ): Promise<DeepDiagnosticResponse> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120_000) // 120s — deep diag via OpenRouter

    let response: Response
    try {
      response = await fetch('/api/diagnostics/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: organizationId, mode: 'deep', phases }),
        signal: controller.signal
      })
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new Error('Request timed out. Please try again.')
      throw err
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: 'Failed to submit diagnostic' 
      }))
      throw new Error(error.message || 'Failed to submit diagnostic')
    }

    const result: DeepDiagnosticResponse = await response.json()
    
    // Validate response — VPS Bridge returns ai_readiness_score; normalize to score
    if (!result.diagnostic_id) {
      throw new Error('Invalid response format from server')
    }

    // Normalize score field: VPS Bridge may return ai_readiness_score
    if (typeof (result as any).ai_readiness_score === 'number' && typeof result.score !== 'number') {
      (result as any).score = (result as any).ai_readiness_score
    }

    if (typeof result.score !== 'number') {
      throw new Error('Invalid response format from server')
    }

    return result
  }

  /**
   * Save result to localStorage
   */
  static saveResult(result: DeepDiagnosticResult): void {
    try {
      localStorage.setItem(this.RESULT_KEY, JSON.stringify(result))
    } catch (error) {
      console.error('[DeepDiagnostic] Failed to save result:', error)
    }
  }

  /**
   * Load result from localStorage
   */
  static loadResult(): DeepDiagnosticResult | null {
    try {
      const stored = localStorage.getItem(this.RESULT_KEY)
      if (!stored) return null
      
      const result = JSON.parse(stored) as DeepDiagnosticResult
      
      // Validate structure — VPS Bridge may return ai_readiness_score instead of score
      const hasScore =
        typeof result.score === 'number' ||
        typeof (result as any).ai_readiness_score === 'number'

      if (!result.diagnostic_id || !hasScore) {
        console.warn('[DeepDiagnostic] Invalid result data, clearing')
        this.clearResult()
        return null
      }

      // Normalize: ensure score is always set
      if (typeof result.score !== 'number' && typeof (result as any).ai_readiness_score === 'number') {
        (result as any).score = (result as any).ai_readiness_score
      }
      
      return result
    } catch (error) {
      console.error('[DeepDiagnostic] Failed to load result:', error)
      return null
    }
  }

  /**
   * Clear result
   */
  static clearResult(): void {
    try {
      localStorage.removeItem(this.RESULT_KEY)
    } catch (error) {
      console.error('[DeepDiagnostic] Failed to clear result:', error)
    }
  }

  /**
   * Generate blueprint from diagnostic
   * VPS Bridge returns the full BlueprintV1 object directly.
   */
  static async generateBlueprint(
    diagnosticId: string,
    organizationId: string = 'demo_org',
    objective: string = 'AI readiness improvement',
    diagnosticData?: Record<string, any>
  ): Promise<BlueprintV1> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120_000)

    let response: Response
    try {
      response = await fetch('/api/blueprints/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnostic_id: diagnosticId,
          organization_id: organizationId,
          objective,
          ...(diagnosticData ? { diagnostic_data: diagnosticData } : {})
        }),
        signal: controller.signal
      })
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new Error('Blueprint generation timed out. Please try again.')
      throw err
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: 'Failed to generate blueprint' 
      }))
      throw new Error(error.message || 'Failed to generate blueprint')
    }

    return response.json()
  }

  /**
   * Validate phase completion
   */
  static validatePhase(
    phase: PhaseConfig,
    responses: Record<string, any>
  ): Record<string, string> {
    const errors: Record<string, string> = {}

    for (const question of phase.questions) {
      if (!question.required) continue

      const value = responses[question.id]

      // Check if answered
      if (value === undefined || value === null || value === '') {
        errors[question.id] = 'This field is required'
        continue
      }

      // Type-specific validation
      if (question.type === 'multiselect' && Array.isArray(value) && value.length === 0) {
        errors[question.id] = 'Please select at least one option'
      }

      // Custom validation rules
      if (question.validation) {
        const { minLength, maxLength, min, max, pattern } = question.validation

        if (typeof value === 'string') {
          if (minLength && value.length < minLength) {
            errors[question.id] = `Minimum ${minLength} characters required`
          }
          if (maxLength && value.length > maxLength) {
            errors[question.id] = `Maximum ${maxLength} characters allowed`
          }
          if (pattern && !new RegExp(pattern).test(value)) {
            errors[question.id] = 'Invalid format'
          }
        }

        if (typeof value === 'number') {
          if (min !== undefined && value < min) {
            errors[question.id] = `Minimum value is ${min}`
          }
          if (max !== undefined && value > max) {
            errors[question.id] = `Maximum value is ${max}`
          }
        }
      }
    }

    return errors
  }
}

// ============================================================================
// buildDiagnosticContext — computes DiagnosticContext from flat answers
// ============================================================================

import type {
  DiagnosticAnswers,
  DiagnosticContext,
  ROIProjection,
  DimensionScores,
  DimensionKey,
  MaturityLevel,
  RankedOpportunity,
  RiskFlag,
  OpportunityQuadrant,
} from '@/types/diagnostic'

// ---- Numeric extraction helpers ----

function parsePct(val: string | undefined): number | null {
  if (!val) return null
  const m = val.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

function parseBudgetMidpointUSD(val: string | undefined): number | null {
  if (!val) return null
  const map: Record<string, number> = {
    'Under $10k': 5000,
    '$10k - $50k': 30000,
    '$50k - $100k': 75000,
    '$100k - $500k': 300000,
    'Over $500k': 750000,
  }
  return map[val] ?? null
}

function parseTimelineMonths(val: string | undefined): number | null {
  if (!val) return null
  const m = val.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

// ---- ROI calculation ----

const IDR_PER_USD = 15_600

function calculateROI(q: DiagnosticContext['quantitative']): ROIProjection {
  const missing: string[] = []

  if (q.totalManualHoursWeekly === null) missing.push('manual hours/week')
  if (q.budgetMidpointUSD === null) missing.push('budget')
  if (q.fteCountInScope === null) missing.push('FTE count')

  const hasEnough = missing.length === 0
  const confidence: ROIProjection['confidenceLevel'] = missing.length === 0 ? 'high' : missing.length === 1 ? 'medium' : 'low'

  // Estimate hourly cost: assume $25/hr average
  const hourlyRateUSD = 25
  const hoursPerYear = (q.totalManualHoursWeekly ?? 0) * 52
  const targetAutoPct = (q.targetAutomationPct ?? 70) / 100
  const currentAutoPct = (q.currentAutomationPct ?? 20) / 100
  const incrementalAutoPct = Math.max(0, targetAutoPct - currentAutoPct)

  const hoursReclaimedPerYear = hoursPerYear * incrementalAutoPct || null
  const annualLaborSavingsUSD = hoursReclaimedPerYear ? hoursReclaimedPerYear * hourlyRateUSD : null
  const annualProcessSavingsUSD = annualLaborSavingsUSD ? annualLaborSavingsUSD * 0.3 : null
  const totalAnnualSavingsUSD = annualLaborSavingsUSD && annualProcessSavingsUSD
    ? annualLaborSavingsUSD + annualProcessSavingsUSD
    : null

  const budgetUSD = q.budgetMidpointUSD
  const paybackMonths = totalAnnualSavingsUSD && budgetUSD
    ? (budgetUSD / totalAnnualSavingsUSD) * 12
    : null

  const threeYearROIPercent = totalAnnualSavingsUSD && budgetUSD && budgetUSD > 0
    ? ((totalAnnualSavingsUSD * 3 - budgetUSD) / budgetUSD) * 100
    : null

  const costOfInaction90DaysUSD = totalAnnualSavingsUSD ? totalAnnualSavingsUSD * (90 / 365) : null

  return {
    annualLaborSavingsIDR: annualLaborSavingsUSD ? annualLaborSavingsUSD * IDR_PER_USD : null,
    annualProcessSavingsIDR: annualProcessSavingsUSD ? annualProcessSavingsUSD * IDR_PER_USD : null,
    totalAnnualSavingsIDR: totalAnnualSavingsUSD ? totalAnnualSavingsUSD * IDR_PER_USD : null,
    hoursReclaimedPerYear,
    paybackMonths,
    threeYearROIPercent,
    costOfInaction90DaysIDR: costOfInaction90DaysUSD ? costOfInaction90DaysUSD * IDR_PER_USD : null,
    hasEnoughDataForProjection: hasEnough,
    confidenceLevel: confidence,
    missingInputs: missing,
  }
}

// ---- Dimension scoring ----

function scoreStrategy(a: DiagnosticAnswers): number {
  let s = 50
  if (a.quantified_goal?.includes('specific metrics')) s += 20
  else if (a.quantified_goal?.includes('not quantified')) s += 5
  if (a.kpi_tracking === 'Automated dashboards') s += 15
  else if (a.kpi_tracking === 'Manual reports') s += 5
  if (a.success_timeline === '1-3 months' || a.success_timeline === '3-6 months') s += 10
  return Math.min(100, s)
}

function scoreData(a: DiagnosticAnswers): number {
  let s = 30
  if (a.data_centralization?.includes('Fully centralized')) s += 30
  else if (a.data_centralization?.includes('Partially')) s += 15
  if (a.data_quality?.includes('High quality')) s += 25
  else if (a.data_quality?.includes('Good quality')) s += 15
  else if (a.data_quality?.includes('Moderate')) s += 5
  if (a.system_integration?.includes('Fully integrated')) s += 15
  else if (a.system_integration?.includes('Some integration')) s += 7
  return Math.min(100, s)
}

function scoreProcess(a: DiagnosticAnswers): number {
  let s = 30
  if (a.process_documentation === '75-100%') s += 25
  else if (a.process_documentation === '50-75%') s += 15
  else if (a.process_documentation === '25-50%') s += 7
  if (a.workflow_standardization?.includes('Fully standardized')) s += 25
  else if (a.workflow_standardization?.includes('Mostly standardized')) s += 15
  const autoPct = parsePct(a.automation_current)
  if (autoPct !== null) s += Math.round(autoPct * 0.2)
  return Math.min(100, s)
}

function scorePeople(a: DiagnosticAnswers): number {
  let s = 30
  if (a.internal_capability?.includes('Strong AI team')) s += 35
  else if (a.internal_capability?.includes('Some AI knowledge')) s += 20
  else if (a.internal_capability?.includes('Limited')) s += 8
  if (a.change_readiness?.includes('Embracing')) s += 20
  else if (a.change_readiness?.includes('Open')) s += 12
  else if (a.change_readiness?.includes('Cautious')) s += 5
  if (a.decision_speed?.includes('Hours to days')) s += 15
  else if (a.decision_speed?.includes('Days to weeks')) s += 8
  return Math.min(100, s)
}

function scoreGovernance(a: DiagnosticAnswers): number {
  let s = 40
  if (a.leadership_alignment?.includes('Fully aligned')) s += 30
  else if (a.leadership_alignment?.includes('Supportive')) s += 18
  else if (a.leadership_alignment?.includes('Some interest')) s += 8
  if (a.risk_tolerance?.includes('High')) s += 15
  else if (a.risk_tolerance?.includes('Moderate')) s += 10
  else if (a.risk_tolerance?.includes('Low')) s += 5
  if (a.budget_allocated?.includes('specific allocation')) s += 15
  else if (a.budget_allocated?.includes('flexible')) s += 8
  return Math.min(100, s)
}

function maturityFromScore(composite: number): MaturityLevel {
  if (composite >= 80) return 'Optimizing'
  if (composite >= 65) return 'Defined'
  if (composite >= 50) return 'Developing'
  if (composite >= 35) return 'Initiating'
  return 'Nascent'
}

function calculateDimensionScores(a: DiagnosticAnswers): DimensionScores {
  const strategy = scoreStrategy(a)
  const data = scoreData(a)
  const process = scoreProcess(a)
  const people = scorePeople(a)
  const governance = scoreGovernance(a)

  // Weighted composite: strategy 25%, data 25%, process 20%, people 15%, governance 15%
  const composite = Math.round(
    strategy * 0.25 + data * 0.25 + process * 0.20 + people * 0.15 + governance * 0.15
  )

  const dims: Record<DimensionKey, number> = { strategy, data, process, people, governance }
  const entries = Object.entries(dims) as [DimensionKey, number][]
  const strongest = entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0]
  const weakest = entries.reduce((a, b) => (b[1] < a[1] ? b : a))[0]

  return {
    strategy, data, process, people, governance,
    composite,
    maturityLevel: maturityFromScore(composite),
    strongestDimension: strongest,
    weakestDimension: weakest,
  }
}

// ---- Opportunity ranking ----

function classifyQuadrant(impact: number, effort: number): OpportunityQuadrant {
  const highImpact = impact >= 5.5
  const lowEffort = effort < 5.5
  if (highImpact && lowEffort) return 'quick_win'
  if (highImpact && !lowEffort) return 'major_project'
  if (!highImpact && lowEffort) return 'fill_in'
  return 'thankless_task'
}

function rankOpportunities(a: DiagnosticAnswers, scores: DimensionScores): RankedOpportunity[] {
  const opps: RankedOpportunity[] = []

  const priorityAreas: string[] = Array.isArray(a.priority_areas) ? a.priority_areas : []
  const dataScore = scores.data
  const processScore = scores.process

  const dataReadiness = (score: number): RankedOpportunity['dataReadiness'] =>
    score >= 70 ? 'ready' : score >= 45 ? 'needs_prep' : 'not_ready'

  const complexity = (effort: number): RankedOpportunity['errorComplexity'] =>
    effort <= 3 ? 'low' : effort <= 6 ? 'medium' : 'high'

  if (priorityAreas.includes('Customer service/support') || a.pain_points?.toLowerCase().includes('ticket') || a.pain_points?.toLowerCase().includes('support')) {
    const impact = 9; const effort = 5
    opps.push({
      id: 'opp-cs-automation',
      name: 'CS Ticket Automation',
      impactScore: impact, effortScore: effort,
      quadrant: classifyQuadrant(impact, effort),
      timeToValueWeeks: 8,
      projectedROINote: `Est. Rp ${Math.round(15_610_400_000 / 1e9 * 10) / 10}B/yr savings at 80% automation`,
      prerequisites: [],
      dataReadiness: dataReadiness(dataScore),
      errorComplexity: complexity(effort),
    })
  }

  if (priorityAreas.includes('Data analysis and reporting') || a.manual_processes?.toLowerCase().includes('report')) {
    const impact = 7; const effort = 4
    opps.push({
      id: 'opp-reporting',
      name: 'Automated Reporting',
      impactScore: impact, effortScore: effort,
      quadrant: classifyQuadrant(impact, effort),
      timeToValueWeeks: 5,
      projectedROINote: `Est. Rp ${Math.round(15_610_400_000 / 1e9 * 10) / 10}B/yr savings at 80% automation`,
      prerequisites: [],
      dataReadiness: dataReadiness(dataScore),
      errorComplexity: complexity(effort),
    })
  }

  if (priorityAreas.includes('Operations and logistics') || a.manual_processes?.toLowerCase().includes('process')) {
    const impact = 8; const effort = 5
    opps.push({
      id: 'opp-process-automation',
      name: 'Process Automation',
      impactScore: impact, effortScore: effort,
      quadrant: classifyQuadrant(impact, effort),
      timeToValueWeeks: 8,
      projectedROINote: `Est. Rp ${Math.round(15_610_400_000 / 1e9 * 10) / 10}B/yr savings at 80% automation`,
      prerequisites: [],
      dataReadiness: dataReadiness(processScore),
      errorComplexity: complexity(effort),
    })
  }

  if (priorityAreas.includes('Sales and marketing')) {
    const impact = 7; const effort = 6
    opps.push({
      id: 'opp-sales-intelligence',
      name: 'Sales Intelligence',
      impactScore: impact, effortScore: effort,
      quadrant: classifyQuadrant(impact, effort),
      timeToValueWeeks: 10,
      projectedROINote: 'Est. 15-25% pipeline improvement',
      prerequisites: ['CRM integration'],
      dataReadiness: dataReadiness(dataScore),
      errorComplexity: complexity(effort),
    })
  }

  // Always add a cross-system reporting opportunity if not already covered
  if (!opps.find(o => o.id === 'opp-reporting')) {
    const impact = 6; const effort = 5
    opps.push({
      id: 'opp-cross-reporting',
      name: 'Cross-system Reporting',
      impactScore: impact, effortScore: effort,
      quadrant: classifyQuadrant(impact, effort),
      timeToValueWeeks: 5,
      projectedROINote: `Est. Rp ${Math.round(15_610_400_000 / 1e9 * 10) / 10}B/yr savings at 80% automation`,
      prerequisites: [],
      dataReadiness: dataReadiness(dataScore),
      errorComplexity: complexity(effort),
    })
  }

  return opps.sort((a, b) => (b.impactScore - a.impactScore) || (a.effortScore - b.effortScore))
}

// ---- Risk classification ----

function classifyRisks(a: DiagnosticAnswers, scores: DimensionScores): RiskFlag[] {
  const risks: RiskFlag[] = []

  const compliance: string[] = Array.isArray(a.compliance_requirements) ? a.compliance_requirements : []
  if (compliance.some(c => c !== 'None')) {
    risks.push({
      id: 'risk-compliance',
      risk: 'Compliance requirements add implementation overhead',
      severity: 'MEDIUM',
      source: 'compliance_requirements',
      detected: true,
    })
  }

  if (scores.data < 50) {
    risks.push({
      id: 'risk-data-quality',
      risk: 'Data quality issues may delay AI model training and reduce accuracy',
      severity: scores.data < 35 ? 'HIGH' : 'MEDIUM',
      source: 'data_quality',
      detected: true,
    })
  }

  if (a.leadership_alignment?.includes('No alignment') || a.leadership_alignment?.includes('needs convincing')) {
    risks.push({
      id: 'risk-leadership',
      risk: 'Insufficient leadership alignment may stall initiative funding and adoption',
      severity: 'HIGH',
      source: 'leadership_alignment',
      detected: true,
    })
  }

  if (a.change_readiness?.includes('Resistant')) {
    risks.push({
      id: 'risk-change',
      risk: 'Organizational resistance to change could undermine adoption',
      severity: 'HIGH',
      source: 'change_readiness',
      detected: true,
    })
  }

  if (a.budget_allocated?.includes('No budget')) {
    risks.push({
      id: 'risk-budget',
      risk: 'No dedicated budget increases risk of project stalling mid-implementation',
      severity: 'HIGH',
      source: 'budget_allocated',
      detected: true,
    })
  }

  if (scores.process < 45) {
    risks.push({
      id: 'risk-process',
      risk: 'Undocumented or unstandardized processes make automation fragile',
      severity: 'MEDIUM',
      source: 'process_documentation',
      detected: false,
    })
  }

  // Sort: HIGH → MEDIUM → LOW
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  return risks.sort((a, b) => order[a.severity] - order[b.severity])
}

// ---- Main export ----

/**
 * Build a full DiagnosticContext from flat diagnostic answers.
 * Writes the result to localStorage under 'aivory_diagnostic_context'.
 */
export function buildDiagnosticContext(answers: DiagnosticAnswers): DiagnosticContext {
  const companyName = answers.companyName || 'Your Organization'

  // Extract quantitative fields
  const currentAutoPct = parsePct(answers.automation_current)
  const targetAutoPct = answers.target_automation ? parsePct(answers.target_automation) : 70
  const budgetMidpointUSD = parseBudgetMidpointUSD(answers.budget_range)
  const timelineMonths = parseTimelineMonths(answers.success_timeline)

  const quantitative: DiagnosticContext['quantitative'] = {
    ticketVolumePerDay: null,
    ahtCurrentMinutes: null,
    ahtTargetMinutes: null,
    costCurrentPerTicket: null,
    costTargetPerTicket: null,
    totalManualHoursWeekly: null,
    fteCountInScope: null,
    currentAutomationPct: currentAutoPct,
    targetAutomationPct: targetAutoPct,
    budgetMidpointUSD,
    timelineMonths,
  }

  const scores = calculateDimensionScores(answers)
  const calculations = calculateROI(quantitative)
  const opportunities = rankOpportunities(answers, scores)
  const risks = classifyRisks(answers, scores)

  const compliance: string[] = Array.isArray(answers.compliance_requirements)
    ? answers.compliance_requirements.filter((c: string) => c !== 'None')
    : []

  const qualitative: DiagnosticContext['qualitative'] = {
    primaryObjective: answers.primary_objective || '',
    topPainPoints: answers.pain_points || '',
    compliance,
    implementApproach: answers.preferred_approach || '',
    aiCapability: answers.internal_capability || '',
    leadershipAlignment: answers.leadership_alignment || '',
    priorAIAttempts: answers.prior_ai_attempts || '',
    resistanceSources: [],
    delayConsequence: answers.delay_consequence || '',
    errorTolerance: answers.risk_tolerance || '',
    dataResidency: answers.data_residency || '',
  }

  const context: DiagnosticContext = {
    company: companyName,
    submittedAt: new Date().toISOString(),
    quantitative,
    calculations,
    scores,
    opportunities,
    risks,
    qualitative,
  }

  try {
    localStorage.setItem('aivory_diagnostic_context', JSON.stringify(context))
  } catch {
    // localStorage unavailable (SSR or quota exceeded) — silently continue
  }

  return context
}
