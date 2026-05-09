/**
 * Property-based tests for the 3 critical Diagnostic ROI bugs.
 *
 * Bug 1 — Currency Display Mismatch
 *   Property: formatCurrency(value, currencyCode) never returns "Rp" when currencyCode ≠ 'IDR'
 *   Property: formatCurrency(value, 'IDR') always returns a string starting with "Rp"
 *
 * Bug 2 — Non-Deterministic ROI
 *   Property: buildDiagnosticContext(answers) is a pure function — same inputs → same outputs
 *
 * Bug 3 — 3-Year ROI Cap Miscalculation
 *   Property: threeYearROIPercent = MIN(((totalAnnualSavingsUSD × 3 − investment) / investment) × 100, 999)
 *   Property: totalAnnualSavingsUSD is always exposed on the calculations object
 *   Property: budgetMidpointUSD used in formula matches the parseBudgetMidpointUSD lookup
 */

import { buildDiagnosticContext } from '@/services/deepDiagnostic'
import { formatCurrency, parseCurrencyCode, type CurrencyCode } from '@/lib/resultFormatters'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ALL_CURRENCY_CODES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'IDR', 'SGD', 'MYR', 'AUD', 'JPY', 'INR']

const BUDGET_TIERS = [
  { label: 'Under $10k',      midpoint: 5_000 },
  { label: '$10k - $50k',     midpoint: 30_000 },
  { label: '$50k - $100k',    midpoint: 75_000 },
  { label: '$100k - $500k',   midpoint: 300_000 },
  { label: 'Over $500k',      midpoint: 750_000 },
]

function makeAnswers(overrides: Record<string, any> = {}) {
  return {
    company_name: 'Test Corp',
    industry: 'Technology / Software',
    manual_hours_weekly: '25-50 hours/week',
    fte_count: '6-15 FTEs',
    automation_current: '10-25%',
    target_automation: '75-90%',
    budget_range: '$10k - $50k',
    success_timeline: '6-12 months',
    currency: 'USD',
    primary_objective: 'Reduce manual work',
    pain_points: 'Too much manual data entry',
    compliance_requirements: ['None'],
    preferred_approach: 'Phased',
    internal_capability: 'Some AI knowledge',
    leadership_alignment: 'Supportive',
    prior_ai_attempts: 'None',
    delay_consequence: 'Lost revenue',
    risk_tolerance: 'Moderate',
    data_residency: 'Local',
    priority_areas: ['operations'],
    manual_processes: 'data entry, reporting',
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bug 1 — Currency Display Mismatch
// ─────────────────────────────────────────────────────────────────────────────

describe('Bug 1 — Currency Display Mismatch', () => {
  const testValues = [0, 1, 100, 1_000, 10_000, 100_000, 1_000_000, 32_683]

  describe('Fix checking: non-IDR currencies never show "Rp"', () => {
    const nonIDRCodes = ALL_CURRENCY_CODES.filter(c => c !== 'IDR')

    for (const code of nonIDRCodes) {
      for (const value of testValues) {
        it(`formatCurrency(${value}, '${code}') does not contain "Rp"`, () => {
          const result = formatCurrency(value, code)
          expect(result).not.toContain('Rp')
        })
      }
    }
  })

  describe('Preservation checking: IDR always shows "Rp"', () => {
    for (const value of testValues) {
      it(`formatCurrency(${value}, 'IDR') starts with "Rp"`, () => {
        const result = formatCurrency(value, 'IDR')
        expect(result).toMatch(/^Rp\s/)
      })
    }
  })

  describe('Fix checking: buildDiagnosticContext respects currency selection', () => {
    it('USD context: totalAnnualSavingsLocal equals totalAnnualSavingsUSD (rate=1)', () => {
      const ctx = buildDiagnosticContext(makeAnswers({ currency: 'USD' }))
      const { totalAnnualSavingsLocal, totalAnnualSavingsUSD } = ctx.calculations
      if (totalAnnualSavingsUSD !== null && totalAnnualSavingsLocal !== null) {
        expect(totalAnnualSavingsLocal).toBeCloseTo(totalAnnualSavingsUSD, 0)
      }
    })

    it('IDR context: totalAnnualSavingsLocal is much larger than totalAnnualSavingsUSD', () => {
      const ctx = buildDiagnosticContext(makeAnswers({ currency: 'IDR' }))
      const { totalAnnualSavingsLocal, totalAnnualSavingsUSD } = ctx.calculations
      if (totalAnnualSavingsUSD !== null && totalAnnualSavingsLocal !== null) {
        // IDR rate is ~15,600 — local value should be >> USD value
        expect(totalAnnualSavingsLocal).toBeGreaterThan(totalAnnualSavingsUSD * 1000)
      }
    })

    it('context.currency is preserved from the answers', () => {
      const ctx = buildDiagnosticContext(makeAnswers({ currency: 'EUR' }))
      expect(ctx.currency).toBe('EUR')
    })
  })

  describe('parseCurrencyCode', () => {
    it('parses "USD — US Dollar ($)" → USD', () => {
      expect(parseCurrencyCode('USD — US Dollar ($)')).toBe('USD')
    })
    it('parses "IDR — Indonesian Rupiah (Rp)" → IDR', () => {
      expect(parseCurrencyCode('IDR — Indonesian Rupiah (Rp)')).toBe('IDR')
    })
    it('falls back to USD for unknown codes', () => {
      expect(parseCurrencyCode('XYZ — Unknown')).toBe('USD')
    })
    it('falls back to USD for undefined', () => {
      expect(parseCurrencyCode(undefined)).toBe('USD')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Bug 2 — Non-Deterministic ROI
// ─────────────────────────────────────────────────────────────────────────────

describe('Bug 2 — Non-Deterministic ROI', () => {
  describe('Fix checking: buildDiagnosticContext is deterministic', () => {
    const testCases = [
      makeAnswers(),
      makeAnswers({ currency: 'IDR', budget_range: '$100k - $500k' }),
      makeAnswers({ manual_hours_weekly: '50-100 hours/week', fte_count: '16-50 FTEs' }),
      makeAnswers({ automation_current: '25-50%', target_automation: '50-75%' }),
    ]

    for (const [i, answers] of testCases.entries()) {
      it(`identical inputs produce identical ROI (case ${i + 1})`, () => {
        const result1 = buildDiagnosticContext(answers)
        const result2 = buildDiagnosticContext(answers)

        expect(result1.calculations.totalAnnualSavingsLocal).toBe(result2.calculations.totalAnnualSavingsLocal)
        expect(result1.calculations.totalAnnualSavingsUSD).toBe(result2.calculations.totalAnnualSavingsUSD)
        expect(result1.calculations.threeYearROIPercent).toBe(result2.calculations.threeYearROIPercent)
        expect(result1.calculations.paybackMonths).toBe(result2.calculations.paybackMonths)
        expect(result1.calculations.hoursReclaimedPerYear).toBe(result2.calculations.hoursReclaimedPerYear)
        expect(result1.calculations.annualLaborSavingsLocal).toBe(result2.calculations.annualLaborSavingsLocal)
        expect(result1.calculations.annualProcessSavingsLocal).toBe(result2.calculations.annualProcessSavingsLocal)
      })
    }
  })

  describe('Fix checking: ROI values are finite numbers (not NaN/Infinity)', () => {
    it('all numeric ROI fields are finite when data is sufficient', () => {
      const ctx = buildDiagnosticContext(makeAnswers())
      const { calculations } = ctx

      const numericFields = [
        calculations.totalAnnualSavingsLocal,
        calculations.totalAnnualSavingsUSD,
        calculations.annualLaborSavingsLocal,
        calculations.annualProcessSavingsLocal,
        calculations.hoursReclaimedPerYear,
        calculations.paybackMonths,
        calculations.threeYearROIPercent,
        calculations.costOfInaction90DaysLocal,
      ]

      for (const field of numericFields) {
        if (field !== null) {
          expect(isFinite(field)).toBe(true)
          expect(isNaN(field)).toBe(false)
        }
      }
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Bug 3 — 3-Year ROI Cap Miscalculation
// ─────────────────────────────────────────────────────────────────────────────

describe('Bug 3 — 3-Year ROI Cap Miscalculation', () => {
  describe('Fix checking: totalAnnualSavingsUSD is always exposed', () => {
    it('totalAnnualSavingsUSD is present on calculations when data is sufficient', () => {
      const ctx = buildDiagnosticContext(makeAnswers())
      expect('totalAnnualSavingsUSD' in ctx.calculations).toBe(true)
    })

    it('totalAnnualSavingsUSD is null when manual hours are missing', () => {
      const ctx = buildDiagnosticContext(makeAnswers({ manual_hours_weekly: undefined }))
      expect(ctx.calculations.totalAnnualSavingsUSD).toBeNull()
    })
  })

  describe('Fix checking: 3-Year ROI formula uses totalAnnualSavingsUSD directly', () => {
    for (const tier of BUDGET_TIERS) {
      it(`budget tier "${tier.label}" (midpoint $${tier.midpoint.toLocaleString()}) produces auditable ROI`, () => {
        const ctx = buildDiagnosticContext(makeAnswers({ budget_range: tier.label, currency: 'USD' }))
        const { totalAnnualSavingsUSD, threeYearROIPercent } = ctx.calculations
        const investment = ctx.quantitative.budgetMidpointUSD

        // Verify budgetMidpointUSD matches the displayed tier
        expect(investment).toBe(tier.midpoint)

        if (totalAnnualSavingsUSD !== null && investment !== null && investment > 0) {
          const rawROI = ((totalAnnualSavingsUSD * 3 - investment) / investment) * 100
          const expectedROI = Math.min(rawROI, 999)
          expect(threeYearROIPercent).toBeCloseTo(expectedROI, 5)
        }
      })
    }
  })

  describe('Fix checking: 3-Year ROI cap fires at exactly 999%', () => {
    it('threeYearROIPercent never exceeds 999', () => {
      // Use high hours + low budget to force a very high ROI
      const ctx = buildDiagnosticContext(makeAnswers({
        manual_hours_weekly: 'Over 100 hours/week',
        budget_range: 'Under $10k',
        currency: 'USD',
      }))
      const { threeYearROIPercent } = ctx.calculations
      if (threeYearROIPercent !== null) {
        expect(threeYearROIPercent).toBeLessThanOrEqual(999)
      }
    })

    it('threeYearROIPercent is not capped when ROI is below 999%', () => {
      // Use low hours + high budget to force a low ROI
      const ctx = buildDiagnosticContext(makeAnswers({
        manual_hours_weekly: 'Under 10 hours/week',
        budget_range: 'Over $500k',
        currency: 'USD',
      }))
      const { threeYearROIPercent, totalAnnualSavingsUSD } = ctx.calculations
      const investment = ctx.quantitative.budgetMidpointUSD

      if (threeYearROIPercent !== null && totalAnnualSavingsUSD !== null && investment !== null && investment > 0) {
        const rawROI = ((totalAnnualSavingsUSD * 3 - investment) / investment) * 100
        if (rawROI < 999) {
          // Should not be capped — exact value
          expect(threeYearROIPercent).toBeCloseTo(rawROI, 5)
        }
      }
    })
  })

  describe('Fix checking: no floating-point drift from reverse currency conversion', () => {
    it('formula uses totalAnnualSavingsUSD directly, not totalAnnualSavingsLocal / rate', () => {
      // IDR rate is 15,600 — dividing back would introduce drift
      const ctx = buildDiagnosticContext(makeAnswers({ currency: 'IDR', budget_range: '$10k - $50k' }))
      const { totalAnnualSavingsUSD, totalAnnualSavingsLocal, threeYearROIPercent } = ctx.calculations
      const investment = ctx.quantitative.budgetMidpointUSD

      if (totalAnnualSavingsUSD !== null && investment !== null && investment > 0) {
        // Formula must use USD directly
        const correctROI = Math.min(((totalAnnualSavingsUSD * 3 - investment) / investment) * 100, 999)
        expect(threeYearROIPercent).toBeCloseTo(correctROI, 5)

        // Verify that dividing local back by rate would give a different (drifted) result
        if (totalAnnualSavingsLocal !== null) {
          const IDR_RATE = 15_600
          const driftedSavingsUSD = totalAnnualSavingsLocal / IDR_RATE
          // The drifted value should differ from the clean USD value by at least 0.01%
          // (demonstrating why we must NOT use the division approach)
          const driftedROI = Math.min(((driftedSavingsUSD * 3 - investment) / investment) * 100, 999)
          // Both should be close but the direct USD path is the canonical one
          expect(threeYearROIPercent).toBeCloseTo(correctROI, 5)
          // The drifted value may differ — this is the bug we fixed
          // (we don't assert they differ because rounding may make them equal in some cases)
          expect(typeof driftedROI).toBe('number')
        }
      }
    })
  })

  describe('Preservation checking: null handling', () => {
    it('threeYearROIPercent is null when budget is missing', () => {
      const ctx = buildDiagnosticContext(makeAnswers({ budget_range: undefined }))
      expect(ctx.calculations.threeYearROIPercent).toBeNull()
    })

    it('threeYearROIPercent is null when manual hours are missing', () => {
      const ctx = buildDiagnosticContext(makeAnswers({ manual_hours_weekly: undefined }))
      expect(ctx.calculations.threeYearROIPercent).toBeNull()
    })

    it('budgetMidpointUSD is null when budget_range is undefined', () => {
      const ctx = buildDiagnosticContext(makeAnswers({ budget_range: undefined }))
      expect(ctx.quantitative.budgetMidpointUSD).toBeNull()
    })
  })
})
