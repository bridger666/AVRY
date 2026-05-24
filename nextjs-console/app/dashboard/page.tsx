"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { DashboardData, getPlaceholderData } from "@/types/dashboard"
import { FreeDiagnosticService } from "@/services/freeDiagnostic"
import { DeepDiagnosticService } from "@/services/deepDiagnostic"
import OverviewCard from "@/components/dashboard/OverviewCard"
import LifecycleCard from "@/components/dashboard/LifecycleCard"
import RecentActivity from "@/components/dashboard/RecentActivity"
import LoadingState from "@/components/dashboard/LoadingState"
import ErrorState from "@/components/dashboard/ErrorState"
import styles from "./dashboard.module.css"
import { useRouterContext } from '@/contexts/RouterContext'
import { ContinuedFromConsole } from '@/components/routing/ContinuedFromConsole'
import { AuthManager } from '@/lib/authManager'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [freeDiagnosticScore, setFreeDiagnosticScore] = useState<number | null>(null)
  const [freeDiagnosticCompleted, setFreeDiagnosticCompleted] = useState(false)
  const [deepDiagnosticCompleted, setDeepDiagnosticCompleted] = useState(false)
  const t = useTranslations("dashboard")

  const { pendingContext, clearPendingContext } = useRouterContext()
  const [routingNotice, setRoutingNotice] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    if (!pendingContext) return
    
    // Use maxAge from context or default to 5 minutes
    const maxAge = pendingContext.maxAge ?? 5 * 60 * 1000
    if (Date.now() - pendingContext.timestamp > maxAge) {
      clearPendingContext()
      return
    }
    
    if (pendingContext.targetRoute !== 'dashboard') return
    setRoutingNotice(pendingContext.aiReplySummary || pendingContext.triggerMessage)
    clearPendingContext()
  }, [pendingContext, clearPendingContext])

  useEffect(() => {
    fetchDashboardData()

    // Check free diagnostic status
    const result = FreeDiagnosticService.getResult()
    if (result) {
      setFreeDiagnosticCompleted(true)
      setFreeDiagnosticScore(result.score)
    }

    // Check deep diagnostic status — presence of aivory_diagnostic_context means complete
    const deepContext = localStorage.getItem('aivory_diagnostic_context')
    if (deepContext) {
      setDeepDiagnosticCompleted(true)
    }
  }, [])

  // Auth guard - check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      // Wait for AuthManager to be ready
      if (!window.AuthManagerReady) {
        await new Promise(resolve => {
          const checkInterval = setInterval(() => {
            if (window.AuthManagerReady) {
              clearInterval(checkInterval)
              resolve(true)
            }
          }, 50)
          setTimeout(() => {
            clearInterval(checkInterval)
            resolve(true)
          }, 5000)
        })
      }

      if (typeof AuthManager !== 'undefined') {
        if (!AuthManager.isAuthenticated()) {
          // Show login modal instead of redirecting
          setShowLoginModal(true)
        }
      }
      setAuthLoading(false)
    }

    checkAuth()
  }, [])

  const fetchDashboardData = async () => {
    setData(getPlaceholderData())
    setLoading(false)
  }

  if (loading || authLoading) {
    return <LoadingState />
  }

  // Show login modal if not authenticated
  if (showLoginModal) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#353531]">
        <div className="text-center">
          <h2 className="text-2xl font-light text-white mb-4">Please Log In</h2>
          <p className="text-white/60 mb-6">You must be logged in to access the dashboard</p>
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && typeof window.showLoginModal === 'function') {
                window.showLoginModal()
              }
            }}
            className="px-6 py-3 bg-[#0ae8af] text-[#1a1a24] font-medium rounded-lg hover:bg-[#1cffbf] transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return <ErrorState onRetry={fetchDashboardData} />
  }

  // Determine diagnostics card state — deep takes priority over free
  const diagnosticsStatus = deepDiagnosticCompleted ? 'completed' : freeDiagnosticCompleted ? 'completed' : data.diagnostic.status
  const diagnosticsHref = deepDiagnosticCompleted
    ? '/diagnostics/deep/final-result'
    : freeDiagnosticCompleted
    ? '/diagnostics/free/result'
    : '/diagnostics'
  const diagnosticsCta = deepDiagnosticCompleted
    ? 'View AI Report'
    : freeDiagnosticCompleted
    ? t('diagnosticsCard.viewResults')
    : data.diagnostic.status === 'not_started'
    ? t('diagnosticsCard.startDiagnostic')
    : t('diagnosticsCard.continueDiagnostic')
  const diagnosticsDescription = deepDiagnosticCompleted
    ? 'Deep diagnostic complete — your AI readiness report is ready.'
    : freeDiagnosticCompleted
    ? t('diagnosticsCard.descriptionCompleted', { score: Math.round(freeDiagnosticScore || 0) })
    : t('diagnosticsCard.descriptionNotStarted')

  return (
    <div className={styles.dashboardContainer}>
      {routingNotice !== null && (
        <ContinuedFromConsole summary={routingNotice} onDismiss={() => setRoutingNotice(null)} />
      )}

      {/* Full-width page title spanning both columns */}
      <h1 className={styles.pageTitle}>{t('title')}</h1>

      {/* Left column: overview card (tall anchor) */}
      <div className={styles.mainContent}>
        <OverviewCard
          data={data}
          freeDiagnosticScore={freeDiagnosticScore}
          freeDiagnosticCompleted={freeDiagnosticCompleted}
        />
      </div>

      {/* Right column: 2x2 grid of lifecycle cards + recent activity */}
      <div className={styles.rightColumn}>
        <LifecycleCard
          title={t('diagnosticsCard.title')}
          description={diagnosticsDescription}
          status={diagnosticsStatus}
          cta={diagnosticsCta}
          href={diagnosticsHref}
        />
        <LifecycleCard
          title={t('blueprintCard.title')}
          description={t('blueprintCard.description')}
          status={data.blueprint.status}
          cta={data.blueprint.status === 'none' ? t('blueprintCard.generateBlueprint') : t('blueprintCard.viewBlueprint')}
          href="/blueprint"
        />
        <LifecycleCard
          title={t('workflowsCard.title')}
          description={t('workflowsCard.description')}
          status={data.workflows.active > 0 ? 'active' : 'none'}
          cta={t('workflowsCard.viewWorkflows')}
          href="/workflows"
        />
        <RecentActivity events={data.recentActivity} />
      </div>
    </div>
  )
}
