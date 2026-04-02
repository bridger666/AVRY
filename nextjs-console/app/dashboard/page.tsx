"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { DashboardData, getPlaceholderData } from "@/types/dashboard"
import { FreeDiagnosticService } from "@/services/freeDiagnostic"
import OverviewCard from "@/components/dashboard/OverviewCard"
import LifecycleCard from "@/components/dashboard/LifecycleCard"
import RecentActivity from "@/components/dashboard/RecentActivity"
import LoadingState from "@/components/dashboard/LoadingState"
import ErrorState from "@/components/dashboard/ErrorState"
import styles from "./dashboard.module.css"

import { useRouterContext } from '@/contexts/RouterContext'
import { ContinuedFromConsole } from '@/components/routing/ContinuedFromConsole'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [freeDiagnosticScore, setFreeDiagnosticScore] = useState<number | null>(null)
  const [freeDiagnosticCompleted, setFreeDiagnosticCompleted] = useState(false)
  const t = useTranslations("dashboard")

  const { pendingContext, clearPendingContext } = useRouterContext()
  const [routingNotice, setRoutingNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!pendingContext) return
    if (Date.now() - pendingContext.timestamp > 300000) { clearPendingContext(); return }
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
  }, [])

  const fetchDashboardData = async () => {
    // For now, use placeholder data
    // TODO: Replace with actual API call
    setData(getPlaceholderData())
    setLoading(false)
  }

  if (loading) {
    return <LoadingState />
  }

  if (!data) {
    return <ErrorState onRetry={fetchDashboardData} />
  }

  return (
    <div className={styles.dashboardContainer}>
      {routingNotice !== null && (
        <ContinuedFromConsole summary={routingNotice} onDismiss={() => setRoutingNotice(null)} />
      )}
      <div className={styles.mainContent}>
        <h1 className={styles.pageTitle}>{t('title')}</h1>
        
        {/* FIXED: OVERVIEW CARD — pass score props for progress ring */}
        <OverviewCard
          data={data}
          freeDiagnosticScore={freeDiagnosticScore}
          freeDiagnosticCompleted={freeDiagnosticCompleted}
        />

        <div className={styles.lifecycleGrid}>
          <LifecycleCard
            title={t('diagnosticsCard.title')}
            description={
              freeDiagnosticCompleted
                ? t('diagnosticsCard.descriptionCompleted', { score: Math.round(freeDiagnosticScore || 0) })
                : t('diagnosticsCard.descriptionNotStarted')
            }
            status={freeDiagnosticCompleted ? 'completed' : data.diagnostic.status}
            cta={
              freeDiagnosticCompleted
                ? t('diagnosticsCard.viewResults')
                : data.diagnostic.status === 'not_started'
                ? t('diagnosticsCard.startDiagnostic')
                : t('diagnosticsCard.continueDiagnostic')
            }
            href={freeDiagnosticCompleted ? "/diagnostics/free/result" : "/diagnostics"}
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
        </div>
      </div>

      <aside className={styles.activitySidebar}>
        <RecentActivity events={data.recentActivity} />
      </aside>
    </div>
  )
}
