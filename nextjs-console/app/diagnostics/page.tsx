'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { FreeDiagnosticService } from '@/services/freeDiagnostic'
import { useRouterContext } from '@/contexts/RouterContext'
import { ContinuedFromConsole } from '@/components/routing/ContinuedFromConsole'
import styles from './diagnostics.module.css'

export default function DiagnosticsPage() {
  const [freeDiagnosticCompleted, setFreeDiagnosticCompleted] = useState(false)
  const [freeDiagnosticScore, setFreeDiagnosticScore] = useState<number | null>(null)
  const [routingNotice, setRoutingNotice] = useState<string | null>(null)
  const t = useTranslations('diagnostics')

  const { pendingContext, clearPendingContext } = useRouterContext()

  useEffect(() => {
    if (!pendingContext) return
    if (Date.now() - pendingContext.timestamp > 5 * 60 * 1000) {
      clearPendingContext()
      return
    }
    if (pendingContext.targetRoute !== 'diagnostic') return
    setRoutingNotice(pendingContext.aiReplySummary || pendingContext.triggerMessage)
    clearPendingContext()
  }, [pendingContext, clearPendingContext])

  useEffect(() => {
    const result = FreeDiagnosticService.getResult()
    if (result) {
      setFreeDiagnosticCompleted(true)
      setFreeDiagnosticScore(result.score)
    }
  }, [])

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>
        {routingNotice !== null && (
          <ContinuedFromConsole
            summary={routingNotice}
            onDismiss={() => setRoutingNotice(null)}
          />
        )}
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{t('title')}</h1>
          <p className={styles.pageDescription}>
            Choose the diagnostic that fits your needs: quick assessment or comprehensive deep dive.
          </p>
        </header>

        {/* Free Diagnostic Section */}
        <div className={styles.diagnosticSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('freeDiagnostic')}</h2>
            <p className={styles.sectionDescription}>
              12 quick questions to check your AI readiness and get a scoring card.
            </p>
          </div>

          {!freeDiagnosticCompleted ? (
            <Link href="/diagnostics/free" className={styles.diagnosticCta}>
              {t('startFree')}
            </Link>
          ) : (
            <div className={styles.completedState}>
              <div className={styles.scoreDisplay}>
                <span className={styles.scoreLabel}>Your Score:</span>
                <span className={styles.scoreValue}>{Math.round(freeDiagnosticScore || 0)}/100</span>
              </div>
              <div className={styles.completedActions}>
                <Link href="/diagnostics/free/result" className={styles.diagnosticCta}>
                  {t('viewResults')}
                </Link>
                <button
                  className={styles.retakeButton}
                  onClick={() => {
                    FreeDiagnosticService.clearResult()
                    setFreeDiagnosticCompleted(false)
                    setFreeDiagnosticScore(null)
                  }}
                >
                  Retake Diagnostic
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Deep Diagnostic Section */}
        <div className={styles.diagnosticSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('deepDiagnostic')}</h2>
            <p className={styles.sectionDescription}>
              Multi-phase deep dive to prepare your AI System Blueprint.
            </p>
          </div>

          <div className={styles.deepDiagnosticContent}>
            <p className={styles.comingSoonText}>
              The Deep Diagnostic provides comprehensive analysis across business context, operations, data readiness, and strategic goals.
            </p>
            <Link href="/diagnostics/deep" className={styles.diagnosticCta}>
              {t('startDeep')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
