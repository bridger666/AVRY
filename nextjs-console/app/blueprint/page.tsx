'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BlueprintV1, BlueprintV1WorkflowModule } from '@/types/blueprint'
import { saveWorkflow } from '@/hooks/useWorkflows'
import styles from './blueprint.module.css'
import { exportBlueprintPDF, exportBlueprintDOCX } from '@/lib/blueprintExport'
import { saveRoadmap } from '@/hooks/useRoadmap'

const STEP_TYPE_COLORS: Record<string, string> = {
  ingestion: styles.badgeIngestion,
  ai_processing: styles.badgeAi,
  decision: styles.badgeDecision,
  execution: styles.badgeExecution,
  notification: styles.badgeNotification,
  human_review: styles.badgeHuman,
}

const SIZE_LABELS: Record<string, string> = {
  micro: 'Micro',
  sme: 'SME',
  'mid-market': 'Mid-Market',
  enterprise: 'Enterprise',
}

interface GeneratedWorkflow {
  workflow_id: string
  title: string
  trigger: string
  steps: Array<{ step: number; action: string; tool: string; output: string }>
  integrations: string[]
  estimated_time: string
  automation_percentage: string
  error_handling: string
  notes: string
}

interface BlueprintVersion {
  version: string
  label: string
  timestamp: string
  company_name: string
  diagnostic_score: number
  maturity_level: string
  blueprint_data: BlueprintV1
}

const VERSIONS_KEY = 'aivory_blueprint_versions'

function loadVersions(): BlueprintVersion[] {
  try {
    const raw = localStorage.getItem(VERSIONS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as BlueprintVersion[]
  } catch {
    return []
  }
}

function saveVersion(version: BlueprintVersion): void {
  const versions = loadVersions()
  versions.push(version)
  localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions))
}

function deleteVersion(versionLabel: string): void {
  const versions = loadVersions().filter(v => v.version !== versionLabel)
  localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions))
}

export default function BlueprintPage() {
  const router = useRouter()
  const [blueprint, setBlueprint] = useState<BlueprintV1 | null>(null)
  const [parseError, setParseError] = useState(false)
  const [empty, setEmpty] = useState(false)
  const [currentVersionLabel, setCurrentVersionLabel] = useState<string | null>(null)

  // Workflow generation state: keyed by workflow_id
  const [generatingWorkflow, setGeneratingWorkflow] = useState<Record<string, boolean>>({})
  const [generatedWorkflows, setGeneratedWorkflows] = useState<Record<string, GeneratedWorkflow>>({})
  const [workflowErrors, setWorkflowErrors] = useState<Record<string, string>>({})
  const [expandedWorkflows, setExpandedWorkflows] = useState<Record<string, boolean>>({})
  const [savedWorkflowIds, setSavedWorkflowIds] = useState<Record<string, string>>({})

  // Versioning state
  const [versions, setVersions] = useState<BlueprintVersion[]>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveVersionName, setSaveVersionName] = useState('')
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const saveInputRef = useRef<HTMLInputElement>(null)

  // Download state
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [toast, setToast] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)
  const downloadMenuRef = useRef<HTMLDivElement>(null)

  // Roadmap generation state
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('aivory_blueprint')
      if (!raw) { setEmpty(true); return }
      const parsed = JSON.parse(raw) as BlueprintV1
      setBlueprint(parsed)
    } catch {
      setParseError(true)
    }
    setVersions(loadVersions())
  }, [])

  useEffect(() => {
    if (showSaveModal && saveInputRef.current) {
      saveInputRef.current.focus()
    }
  }, [showSaveModal])

  // Close download menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleDownloadPDF = async () => {
    if (!blueprint || downloadLoading) return
    setShowDownloadMenu(false)
    setDownloadLoading(true)
    try {
      await exportBlueprintPDF(blueprint, currentVersionLabel ?? 'Draft')
      showToast('Blueprint downloaded successfully')
    } catch (e) {
      showToast('PDF export failed. Try again.')
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleDownloadDOCX = async () => {
    if (!blueprint || downloadLoading) return
    setShowDownloadMenu(false)
    setDownloadLoading(true)
    try {
      await exportBlueprintDOCX(blueprint, currentVersionLabel ?? 'Draft')
      showToast('Blueprint downloaded successfully')
    } catch (e) {
      showToast('DOCX export failed. Try again.')
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleRegenerate = () => {
    localStorage.removeItem('aivory_blueprint')
    window.location.href = '/diagnostics/deep'
  }

  const handleGenerateRoadmap = async () => {
    if (!blueprint || generatingRoadmap) return
    setGeneratingRoadmap(true)
    try {
      const diagnosticContext = (() => {
        try { return JSON.parse(localStorage.getItem('aivory_deep_result') || '{}') } catch { return {} }
      })()
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'blueprint',
          blueprintContext: blueprint,
          diagnosticContext,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to generate roadmap')
      saveRoadmap(data.roadmap)
      showToast('Roadmap generated! Redirecting…')
      setTimeout(() => router.push('/roadmap'), 800)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to generate roadmap')
      setGeneratingRoadmap(false)
    }
  }

  const handleGenerateWorkflow = async (wf: BlueprintV1WorkflowModule) => {
    const id = wf.workflow_id
    setGeneratingWorkflow(prev => ({ ...prev, [id]: true }))
    setWorkflowErrors(prev => ({ ...prev, [id]: '' }))

    try {
      const diagnosticContext = (() => {
        try { return JSON.parse(localStorage.getItem('aivory_deep_result') || '{}') } catch { return {} }
      })()

      const res = await fetch('/api/console/workflows/from-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: id,
          workflow_title: wf.name,
          workflow_steps: wf.steps,
          diagnostic_context: diagnosticContext,
          company_name: blueprint?.organization?.name || 'SME'
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to generate workflow' }))
        throw new Error(err.message || 'Failed to generate workflow')
      }

      const result: GeneratedWorkflow = await res.json()
      setGeneratedWorkflows(prev => ({ ...prev, [id]: result }))
      setExpandedWorkflows(prev => ({ ...prev, [id]: true }))

      // Save to localStorage workflows store
      // Use result.steps if populated; fall back to mapping blueprint steps directly
      // so the canvas always has something to render
      const stepsToSave = (result.steps && result.steps.length > 0)
        ? result.steps
        : wf.steps.map((s, i) => ({
            step: i + 1,
            action: s.action,
            tool: 'N/A',
            output: '',
          }))

      const savedId = saveWorkflow({
        workflow_id: result.workflow_id,
        title: result.title || wf.name,
        status: 'draft',
        source: 'blueprint',
        blueprint_version: currentVersionLabel || 'V1',
        company_name: blueprint?.organization?.name || 'SME',
        created_at: new Date().toISOString(),
        trigger: result.trigger || wf.trigger,
        steps: stepsToSave,
        integrations: result.integrations || wf.integrations_required || [],
        estimated_time: result.estimated_time,
        automation_percentage: result.automation_percentage,
        error_handling: result.error_handling,
        notes: result.notes,
      })
      setSavedWorkflowIds(prev => ({ ...prev, [id]: savedId }))
      
      // Show brief success toast then redirect
      showToast('Workflow berhasil dibuat! Membuka sekarang...')
      setTimeout(() => {
        // Navigate to the workflows list with the new workflow auto-selected
        // Use savedId (actual stored ID) not result.workflow_id — saveWorkflow may suffix -v2 on collision
        router.push(`/workflows?selected=${encodeURIComponent(savedId)}`)
      }, 800)
    } catch (err) {
      setWorkflowErrors(prev => ({
        ...prev,
        [id]: err instanceof Error ? err.message : 'Failed to generate workflow'
      }))
    } finally {
      setGeneratingWorkflow(prev => ({ ...prev, [id]: false }))
    }
  }

  // ── Versioning ───────────────────────────────────────────
  const nextVersionName = () => {
    const existing = loadVersions()
    return `V${existing.length + 1}`
  }

  const handleOpenSaveModal = () => {
    setSaveVersionName(nextVersionName())
    setShowSaveModal(true)
  }

  const handleSaveVersion = () => {
    if (!blueprint || !saveVersionName.trim()) return
    const version: BlueprintVersion = {
      version: saveVersionName.trim(),
      label: `${saveVersionName.trim()} — ${blueprint.organization?.name || 'Blueprint'}`,
      timestamp: new Date().toISOString(),
      company_name: blueprint.organization?.name || '',
      diagnostic_score: blueprint.diagnostic_summary?.ai_readiness_score ?? 0,
      maturity_level: blueprint.diagnostic_summary?.maturity_level ?? '',
      blueprint_data: blueprint
    }
    saveVersion(version)
    setVersions(loadVersions())
    setCurrentVersionLabel(saveVersionName.trim())
    setShowSaveModal(false)
  }

  const handleLoadVersion = (v: BlueprintVersion) => {
    setBlueprint(v.blueprint_data)
    setCurrentVersionLabel(v.version)
    setShowVersionHistory(false)
    setGeneratedWorkflows({})
    setExpandedWorkflows({})
  }

  const handleDeleteVersion = (versionLabel: string) => {
    deleteVersion(versionLabel)
    setVersions(loadVersions())
    if (currentVersionLabel === versionLabel) setCurrentVersionLabel(null)
  }

  if (empty) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyContent}>
          <p className={styles.emptyIcon}>🗺️</p>
          <h1 className={styles.emptyTitle}>No blueprint yet</h1>
          <p className={styles.emptyText}>
            Run a deep diagnostic first and we'll generate a personalized AI system blueprint for your organization.
          </p>
          <Link href="/diagnostics" className={styles.ctaLink}>Start Diagnostic</Link>
        </div>
      </div>
    )
  }

  if (parseError) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyContent}>
          <p className={styles.emptyIcon}>⚠️</p>
          <h1 className={styles.emptyTitle}>Blueprint data is corrupted</h1>
          <p className={styles.emptyText}>Regenerate it from your latest diagnostic.</p>
          <button className={styles.ctaLink} onClick={handleRegenerate}>Regenerate Blueprint</button>
        </div>
      </div>
    )
  }

  if (!blueprint) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    )
  }

  const { organization, diagnostic_summary, strategic_objective, system_architecture, workflow_modules, risk_assessment, deployment_plan } = blueprint

  return (
    <div className={styles.page}>
      <div className={styles.content} ref={contentRef}>

        {/* ── Header ─────────────────────────────────────────── */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.orgName}>{organization?.name}</h1>
              <p className={styles.orgMeta}>
                {organization?.industry}
                {organization?.size && (
                  <span className={styles.sizeBadge}>{SIZE_LABELS[organization.size] ?? organization.size}</span>
                )}
              </p>
            </div>
            <div className={styles.headerActions}>
              <span className={styles.statusBadge}>{currentVersionLabel ?? blueprint.status ?? 'draft'}</span>
              <button className={styles.saveVersionBtn} onClick={handleOpenSaveModal}>
                Save Version
              </button>

              {/* Download dropdown */}
              <div className={styles.downloadWrap} ref={downloadMenuRef}>
                <button
                  className={styles.downloadBtn}
                  onClick={() => setShowDownloadMenu(v => !v)}
                  disabled={downloadLoading}
                  aria-label="Download blueprint"
                >
                  {downloadLoading ? (
                    <><span className={styles.btnSpinnerSmall} aria-hidden="true" /> Exporting…</>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download
                    </>
                  )}
                </button>
                {showDownloadMenu && (
                  <div className={styles.downloadMenu}>
                    <button className={styles.downloadMenuItem} onClick={handleDownloadPDF}>
                      Download as PDF
                    </button>
                    <button className={styles.downloadMenuItem} onClick={handleDownloadDOCX}>
                      Download as DOCX
                    </button>
                  </div>
                )}
              </div>

              {versions.length > 0 && (
                <button
                  className={styles.historyBtn}
                  onClick={() => setShowVersionHistory(v => !v)}
                >
                  History ({versions.length})
                </button>
              )}

              {/* Generate AI Roadmap from this Blueprint */}
              <button
                className={styles.roadmapBtn}
                onClick={handleGenerateRoadmap}
                disabled={generatingRoadmap}
                title="Generate a phased AI Roadmap from this Blueprint"
              >
                {generatingRoadmap ? 'Generating…' : '🗺️ Generate Roadmap'}
              </button>
            </div>
          </div>
          <div className={styles.scoreRow}>
            <div className={styles.scoreBlock}>
              <span className={styles.scoreValue}>{diagnostic_summary?.ai_readiness_score ?? '—'}</span>
              <span className={styles.scoreLabel}>AI Readiness Score</span>
            </div>
            <div className={styles.maturityBlock}>
              <span className={styles.maturityValue}>{diagnostic_summary?.maturity_level ?? '—'}</span>
              <span className={styles.maturityLabel}>Maturity Level</span>
            </div>
          </div>
          {Array.isArray(diagnostic_summary?.primary_constraints) && diagnostic_summary.primary_constraints.length > 0 && (
            <div className={styles.constraintsRow}>
              <span className={styles.constraintsLabel}>Primary constraints:</span>
              {diagnostic_summary.primary_constraints.map((c, i) => (
                <span key={i} className={styles.constraintTag}>{c}</span>
              ))}
            </div>
          )}
        </header>

        {/* ── Version History panel ─────────────────────────── */}
        {showVersionHistory && (
          <section className={styles.versionHistoryPanel}>
            <h2 className={styles.sectionTitle}>Version History</h2>
            <div className={styles.versionList}>
              {versions.map(v => (
                <div key={v.version} className={styles.versionRow}>
                  <div className={styles.versionInfo}>
                    <span className={styles.versionLabel}>{v.version}</span>
                    <span className={styles.versionMeta}>
                      {v.company_name} · Score {v.diagnostic_score} · {v.maturity_level} · {new Date(v.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.versionActions}>
                    <button className={styles.versionLoadBtn} onClick={() => handleLoadVersion(v)}>Load</button>
                    <button className={styles.versionCompareBtn} disabled title="Coming soon">Compare</button>
                    <button className={styles.versionDeleteBtn} onClick={() => handleDeleteVersion(v.version)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Strategic Objective ────────────────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Strategic Objective</h2>
          <div className={styles.card}>
            <p className={styles.primaryGoal}>{strategic_objective?.primary_goal}</p>
            {Array.isArray(strategic_objective?.kpi_targets) && strategic_objective.kpi_targets.length > 0 && (
              <table className={styles.kpiTable}>
                <thead>
                  <tr>
                    <th className={styles.kpiTh}>Metric</th>
                    <th className={styles.kpiTh}>Target</th>
                  </tr>
                </thead>
                <tbody>
                  {strategic_objective.kpi_targets.map((kpi, i) => (
                    <tr key={i}>
                      <td className={styles.kpiTd}>{kpi.metric}</td>
                      <td className={styles.kpiTdAccent}>{kpi.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* ── System Architecture ────────────────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>System Architecture</h2>
          <div className={styles.card}>
            <div className={styles.archFlow}>
              <div className={styles.archNode}>
                <span className={styles.archNodeLabel}>Data Sources</span>
                <ul className={styles.archList}>
                  {Array.isArray(system_architecture?.data_sources) && system_architecture.data_sources.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.archArrow}>→</div>
              <div className={styles.archNode}>
                <span className={styles.archNodeLabel}>Processing</span>
                <ul className={styles.archList}>
                  {Array.isArray(system_architecture?.processing_layers) && system_architecture.processing_layers.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.archArrow}>→</div>
              <div className={styles.archNode}>
                <span className={styles.archNodeLabel}>Decision Engine</span>
                <p className={styles.archSingle}>{system_architecture?.decision_engine}</p>
              </div>
              <div className={styles.archArrow}>→</div>
              <div className={styles.archNode}>
                <span className={styles.archNodeLabel}>Execution</span>
                <ul className={styles.archList}>
                  {Array.isArray(system_architecture?.execution_layer) && system_architecture.execution_layer.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
            {system_architecture?.memory_layer && (
              <p className={styles.memoryNote}>
                <span className={styles.memoryNoteLabel}>Memory layer:</span> {system_architecture.memory_layer}
              </p>
            )}
          </div>
        </section>

        {/* ── Workflow Modules ───────────────────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Workflow Modules</h2>
          <div className={styles.workflowGrid}>
            {Array.isArray(workflow_modules) && workflow_modules.map((wf) => {
              const id = wf.workflow_id
              const generated = generatedWorkflows[id]
              const isGenerating = generatingWorkflow[id]
              const wfError = workflowErrors[id]
              const isExpanded = expandedWorkflows[id]

              return (
                <div key={id} className={styles.workflowCard}>
                  <div className={styles.workflowCardHeader}>
                    <h3 className={styles.workflowName}>{wf.name}</h3>
                    <button
                      className={styles.generateWorkflowBtn}
                      onClick={() => handleGenerateWorkflow(wf)}
                      disabled={isGenerating}
                      aria-busy={isGenerating}
                    >
                      {isGenerating ? (
                        <><span className={styles.btnSpinnerSmall} aria-hidden="true" /> Generating…</>
                      ) : generated ? 'Regenerate' : 'Generate Workflow'}
                    </button>
                  </div>
                  <p className={styles.workflowTrigger}>
                    <span className={styles.triggerLabel}>Trigger:</span> {wf.trigger}
                  </p>
                  {Array.isArray(wf.steps) && wf.steps.length > 0 && (
                    <ol className={styles.stepsList}>
                      {wf.steps.map((step, i) => (
                        <li key={i} className={styles.stepItem}>
                          <span className={`${styles.stepBadge} ${STEP_TYPE_COLORS[step.type] ?? ''}`}>
                            {step.type.replace('_', ' ')}
                          </span>
                          <span className={styles.stepAction}>{step.action}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  {Array.isArray(wf.integrations_required) && wf.integrations_required.length > 0 && (
                    <div className={styles.integrationsRow}>
                      {wf.integrations_required.map((int, i) => (
                        <span key={i} className={styles.integrationTag}>{int}</span>
                      ))}
                    </div>
                  )}

                  {/* Error */}
                  {wfError && <p className={styles.workflowError}>{wfError}</p>}

                  {/* View in Workflows button */}
                  {savedWorkflowIds[id] && (
                    <button
                      className={styles.viewInWorkflowsBtn}
                      onClick={() => router.push('/workflows')}
                    >
                      View in Workflows →
                    </button>
                  )}

                  {/* Generated workflow panel */}
                  {generated && (
                    <div className={styles.generatedWorkflow}>
                      <button
                        className={styles.generatedWorkflowToggle}
                        onClick={() => setExpandedWorkflows(prev => ({ ...prev, [id]: !isExpanded }))}
                      >
                        {isExpanded ? '▾ Hide detailed workflow' : '▸ Show detailed workflow'}
                      </button>
                      {isExpanded && (
                        <div className={styles.generatedWorkflowBody}>
                          <div className={styles.gwMeta}>
                            <span className={styles.gwMetaItem}>
                              <span className={styles.gwMetaLabel}>Trigger</span>
                              <span>{generated.trigger}</span>
                            </span>
                            <span className={styles.gwMetaItem}>
                              <span className={styles.gwMetaLabel}>Est. Time</span>
                              <span>{generated.estimated_time}</span>
                            </span>
                            <span className={styles.gwMetaItem}>
                              <span className={styles.gwMetaLabel}>Automation</span>
                              <span className={styles.gwAutomationPct}>{generated.automation_percentage}</span>
                            </span>
                          </div>
                          <ol className={styles.gwStepsList}>
                            {Array.isArray(generated.steps) && generated.steps.map((s, i) => (
                              <li key={i} className={styles.gwStep}>
                                <span className={styles.gwStepNum}>{s.step}</span>
                                <div className={styles.gwStepBody}>
                                  <span className={styles.gwStepAction}>{s.action}</span>
                                  <span className={styles.gwStepTool}>{s.tool}</span>
                                  <span className={styles.gwStepOutput}>→ {s.output}</span>
                                </div>
                              </li>
                            ))}
                          </ol>
                          {Array.isArray(generated.integrations) && generated.integrations.length > 0 && (
                            <div className={styles.gwIntegrations}>
                              {generated.integrations.map((int, i) => (
                                <span key={i} className={styles.integrationTag}>{int}</span>
                              ))}
                            </div>
                          )}
                          {generated.error_handling && (
                            <p className={styles.gwNote}>
                              <span className={styles.gwNoteLabel}>Error handling:</span> {generated.error_handling}
                            </p>
                          )}
                          {generated.notes && (
                            <p className={styles.gwNote}>
                              <span className={styles.gwNoteLabel}>Notes:</span> {generated.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Risk Assessment ───────────────────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Risk Assessment</h2>
          <div className={styles.riskGrid}>
            <div className={styles.card}>
              <h3 className={styles.riskColTitle}>Data Risks</h3>
              <ul className={styles.riskList}>
                {Array.isArray(risk_assessment?.data_risks) && risk_assessment.data_risks.map((r, i) => (
                  <li key={i} className={styles.riskItem}>{r}</li>
                ))}
              </ul>
            </div>
            <div className={styles.card}>
              <h3 className={styles.riskColTitle}>Operational Risks</h3>
              <ul className={styles.riskList}>
                {Array.isArray(risk_assessment?.operational_risks) && risk_assessment.operational_risks.map((r, i) => (
                  <li key={i} className={styles.riskItem}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
          {Array.isArray(risk_assessment?.mitigation_strategies) && risk_assessment.mitigation_strategies.length > 0 && (
            <div className={styles.card} style={{ marginTop: 12 }}>
              <h3 className={styles.riskColTitle}>Mitigation Strategies</h3>
              <ol className={styles.mitigationList}>
                {risk_assessment.mitigation_strategies.map((s, i) => (
                  <li key={i} className={styles.mitigationItem}>
                    <span className={styles.mitigationNum}>{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>

        {/* ── Deployment Plan ───────────────────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Deployment Plan</h2>
          <div className={styles.card}>
            <div className={styles.deployMeta}>
              <div className={styles.deployMetaItem}>
                <span className={styles.deployMetaLabel}>Phase</span>
                <span className={styles.deployMetaValue}>{deployment_plan?.phase}</span>
              </div>
              <div className={styles.deployMetaItem}>
                <span className={styles.deployMetaLabel}>Estimated Impact</span>
                <span className={styles.deployMetaValue}>{deployment_plan?.estimated_impact}</span>
              </div>
              <div className={styles.deployMetaItem}>
                <span className={styles.deployMetaLabel}>ROI Timeline</span>
                <span className={styles.deployMetaValue}>{deployment_plan?.estimated_roi_months} months</span>
              </div>
            </div>
            {Array.isArray(deployment_plan?.waves) && deployment_plan.waves.length > 0 && (
              <div className={styles.wavesTimeline}>
                {deployment_plan.waves.map((wave, i) => (
                  <div key={i} className={styles.waveItem}>
                    <div className={styles.waveDot} />
                    <div className={styles.waveBody}>
                      <span className={styles.waveName}>{wave.name}</span>
                      {Array.isArray(wave.included_workflows) && wave.included_workflows.length > 0 && (
                        <div className={styles.waveWorkflows}>
                          {wave.included_workflows.map((w, j) => (
                            <span key={j} className={styles.waveWorkflowTag}>{w}</span>
                          ))}
                        </div>
                      )}
                      {wave.notes && <p className={styles.waveNotes}>{wave.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>

      {/* ── Toast ────────────────────────────────────────────── */}
      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}

      {/* ── Save Version Modal ────────────────────────────────── */}
      {showSaveModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSaveModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Save Blueprint Version</h2>
            <p className={styles.modalDesc}>Give this version a name. It will be saved locally.</p>
            <input
              ref={saveInputRef}
              className={styles.modalInput}
              value={saveVersionName}
              onChange={e => setSaveVersionName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveVersion() }}
              placeholder="e.g. V1, Initial Assessment"
            />
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button
                className={styles.modalSave}
                onClick={handleSaveVersion}
                disabled={!saveVersionName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
