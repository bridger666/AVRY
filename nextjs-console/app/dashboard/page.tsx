"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardData, getPlaceholderData } from "@/types/dashboard"
import { FreeDiagnosticService } from "@/services/freeDiagnostic"
import OverviewCard from "@/components/dashboard/OverviewCard"
import LifecycleCard from "@/components/dashboard/LifecycleCard"
import RecentActivity from "@/components/dashboard/RecentActivity"
import LoadingState from "@/components/dashboard/LoadingState"
import ErrorState from "@/components/dashboard/ErrorState"
import styles from "./dashboard.module.css"

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [freeDiagnosticScore, setFreeDiagnosticScore] = useState<number | null>(null)
  const [freeDiagnosticCompleted, setFreeDiagnosticCompleted] = useState(false)

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
      <div className={styles.mainContent}>
        <h1 className={styles.pageTitle}>AI Operating System</h1>
        
        {/* FIXED: OVERVIEW CARD — pass score props for progress ring */}
        <OverviewCard
          data={data}
          freeDiagnosticScore={freeDiagnosticScore}
          freeDiagnosticCompleted={freeDiagnosticCompleted}
        />

        <div className={styles.lifecycleGrid}>
          <LifecycleCard
            title="Diagnostics"
            description={
              freeDiagnosticCompleted
                ? `Free Diagnostic completed with score ${Math.round(freeDiagnosticScore || 0)}/100. Continue with Deep Diagnostic for comprehensive analysis.`
                : "Run AI Readiness Diagnostic to understand your business and automation potential."
            }
            status={freeDiagnosticCompleted ? 'completed' : data.diagnostic.status}
            cta={
              freeDiagnosticCompleted
                ? 'View Results'
                : data.diagnostic.status === 'not_started'
                ? 'Start Diagnostic'
                : 'Continue Diagnostic'
            }
            href={freeDiagnosticCompleted ? "/diagnostics/free/result" : "/diagnostics"}
          />
          <LifecycleCard
            title="Blueprint"
            description="Design your AI System Blueprint: architecture, workflows, and deployment plan."
            status={data.blueprint.status}
            cta={data.blueprint.status === 'none' ? 'Generate Blueprint' : 'View Blueprint'}
            href="/blueprint"
          />
          <LifecycleCard
            title="Workflows"
            description="Deploy and manage automation workflows generated from your blueprints."
            status={data.workflows.active > 0 ? 'active' : 'none'}
            cta="View Workflows"
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
