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
