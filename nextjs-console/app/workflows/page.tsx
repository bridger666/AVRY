'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadWorkflows, updateWorkflow, deleteWorkflow, SavedWorkflow } from '@/hooks/useWorkflows'
import { WorkflowCanvas as N8nWorkflowCanvas } from '@/components/workflow/WorkflowCanvas'
import { WorkflowAIEditor } from '@/components/WorkflowAIEditor'
import styles from './workflows.module.css'

// ── Outline SVG icons ────────────────────────────────────
// Most icons moved to WorkflowNodes.tsx, keeping only those used in toolbar/modals
const Icons = {
  sparkle: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  ),
  play: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  download: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  trash: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  moreH: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
    </svg>
  ),
  close: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  edit: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  undo: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6"/>
      <path d="M3 13C5.5 6.5 13 4 18 8s5 12 0 16"/>
    </svg>
  ),
  save: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  workflow: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="6" height="6" rx="1"/>
      <rect x="15" y="15" width="6" height="6" rx="1"/>
      <path d="M9 6h3a3 3 0 0 1 3 3v6"/>
      <path d="M18 15V9"/>
    </svg>
  ),
  clock: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  aivoryAvatar: (
    <img src="/Aivory_Avatar.svg" alt="AIRA" style={{ width: '18px', height: '18px' }} />
  ),
  robot: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <circle cx="12" cy="5" r="2"/>
      <path d="M12 7v4"/>
      <line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
    </svg>
  ),
  stop: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="12" rx="1"/>
    </svg>
  ),
}

// ── Step type → icon mapping ─────────────────────────────
// Moved to WorkflowNodes.tsx
function getStepIcon(type: string) {
  // Placeholder - actual implementation in WorkflowNodes.tsx
  return Icons.sparkle
}

const STEP_TYPE_LABELS: Record<string, string> = {
  ingestion: 'Collect Data',
  ai_processing: 'AI Analysis',
  decision: 'Decision',
  execution: 'Run Action',
  notification: 'Send Alert',
}

function guessStepType(action: string): string {
  // Placeholder - actual implementation in WorkflowNodes.tsx
  return 'execution'
}

// ── Derive preview vs active ─────────────────────────────
// A workflow is "active" only when it has been deployed to n8n (n8n_workflow_id set)
// and its status is 'active'. Everything else is "preview".
function isActiveWorkflow(wf: SavedWorkflow): boolean {
  return wf.status === 'active' && !!wf.n8n_workflow_id
}

// ── Status badge ─────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`${styles.statusBadge} ${styles[`status_${status}`]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ── Preview / Active mode badge ──────────────────────────
function ModeBadge({ wf }: { wf: SavedWorkflow }) {
  const active = isActiveWorkflow(wf)
  return (
    <span style={{
      fontSize: 9,
      fontWeight: 700,
      padding: '2px 6px',
      borderRadius: 4,
      whiteSpace: 'nowrap',
      letterSpacing: '0.2px',
      background: active ? 'rgba(0,229,158,0.12)' : 'rgba(255,255,255,0.04)',
      color: active ? '#00e59e' : '#a8a6a2',
      border: `1px solid ${active ? 'rgba(0,229,158,0.2)' : 'rgba(255,255,255,0.07)'}`,
    }}>
      {active ? 'Active' : 'Preview'}
    </span>
  )
}

// ── Trigger card ─────────────────────────────────────────
// Moved to WorkflowNodes.tsx

// ── Connector arrow ──────────────────────────────────────
// Moved to React Flow edges

// ── Step card ────────────────────────────────────────────
// Moved to WorkflowNodes.tsx

// ── Right panel editor ───────────────────────────────────
interface EditTarget { type: 'trigger' | 'step'; index?: number }

function RightPanel({
  workflow, editTarget, onSave, onClose
}: {
  workflow: SavedWorkflow
  editTarget: EditTarget
  onSave: (updated: SavedWorkflow) => void
  onClose: () => void
}) {
  const isTrigger = editTarget.type === 'trigger'
  const step = !isTrigger && editTarget.index !== undefined ? workflow.steps[editTarget.index] : null

  const [action, setAction] = useState(step?.action ?? workflow.trigger)
  const [tool, setTool] = useState(step?.tool ?? '')
  const [output, setOutput] = useState(step?.output ?? '')
  const [showStepAI, setShowStepAI] = useState(false)
  const [showCredSection, setShowCredSection] = useState(false)
  const [showApiKeyPassword, setShowApiKeyPassword] = useState(false)
  const [showParamSection, setShowParamSection] = useState(false)
  const [jsonError, setJsonError] = useState('')

  // API & Credentials state
  const [integration, setIntegration] = useState((step?.config?.integration as string) ?? '')
  const [apiUrl, setApiUrl] = useState((step?.config?.url as string) ?? '')
  const [httpMethod, setHttpMethod] = useState((step?.config?.method as string) ?? 'GET')
  const [apiKey, setApiKey] = useState((step?.config?.apiKey as string) ?? '')
  const [credName, setCredName] = useState((step?.credentials?.name as string) ?? '')
  const [additionalParams, setAdditionalParams] = useState((step?.config?.additionalFields as string) ?? '')

  useEffect(() => {
    if (isTrigger) { 
      setAction(workflow.trigger)
      setTool('')
      setOutput('')
    } else if (step) { 
      setAction(step.action)
      setTool(step.tool)
      setOutput(step.output)
      setIntegration((step.config?.integration as string) ?? '')
      setApiUrl((step.config?.url as string) ?? '')
      setHttpMethod((step.config?.method as string) ?? 'GET')
      setApiKey((step.config?.apiKey as string) ?? '')
      setCredName((step.credentials?.name as string) ?? '')
      setAdditionalParams((step.config?.additionalFields as string) ?? '')
    }
  }, [editTarget, workflow])

  const handleSave = () => {
    if (isTrigger) {
      onSave({ ...workflow, trigger: action })
    } else if (editTarget.index !== undefined) {
      const newSteps = [...workflow.steps]
      const updatedStep = { ...newSteps[editTarget.index], action, tool, output }
      
      // Initialize config and credentials if not present
      if (!updatedStep.config) updatedStep.config = {}
      if (!updatedStep.credentials) updatedStep.credentials = {}
      
      // Save API & Credentials fields
      updatedStep.config.integration = integration
      updatedStep.config.url = apiUrl
      updatedStep.config.method = httpMethod
      updatedStep.config.apiKey = apiKey
      updatedStep.credentials.name = credName
      
      // Only save additionalParams if valid JSON
      if (additionalParams.trim()) {
        try {
          JSON.parse(additionalParams)
          updatedStep.config.additionalFields = additionalParams
        } catch {
          // Invalid JSON, don't save
        }
      }
      
      newSteps[editTarget.index] = updatedStep
      onSave({ ...workflow, steps: newSteps })
    }
  }

  const handleStepAIApply = (updatedStep: SavedWorkflow['steps'][0]) => {
    setAction(updatedStep.action)
    setTool(updatedStep.tool)
    setOutput(updatedStep.output)
    setShowStepAI(false)
  }

  const validateJSON = (value: string) => {
    if (!value.trim()) {
      setJsonError('')
      return
    }
    try {
      JSON.parse(value)
      setJsonError('')
    } catch {
      setJsonError('⚠ Format JSON tidak valid')
    }
  }

  if (showStepAI && !isTrigger && step && editTarget.index !== undefined) {
    const StepAIEditor = require('@/components/StepAIEditor').StepAIEditor
    return (
      <div className={styles.rightPanel}>
        <div className={styles.rightPanelHeader}>
          <span className={styles.rightPanelTitle}>
            Edit Step {editTarget.index + 1} with AI
          </span>
          <button className={styles.rightPanelClose} onClick={() => setShowStepAI(false)} aria-label="Close">
            {Icons.close}
          </button>
        </div>
        <StepAIEditor
          step={step}
          stepIndex={editTarget.index}
          onClose={() => setShowStepAI(false)}
          onApply={handleStepAIApply}
        />
      </div>
    )
  }

  return (
    <div className={styles.rightPanel}>
      <div className={styles.rightPanelHeader}>
        <span className={styles.rightPanelTitle}>
          {isTrigger ? 'Edit Trigger' : `Edit Step ${(editTarget.index ?? 0) + 1}`}
        </span>
        <button className={styles.rightPanelClose} onClick={onClose} aria-label="Close">
          {Icons.close}
        </button>
      </div>
      <div className={styles.rightPanelFields}>
        <div className={styles.fieldLabelRow}>
          <label className={styles.fieldLabel}>{isTrigger ? 'When this happens...' : 'What happens'}</label>
          {!isTrigger && (
            <button 
              className={styles.fieldAIEditButton} 
              onClick={() => setShowStepAI(true)} 
              title="Let AIRA help you rewrite and configure this step"
              aria-label="Edit this step with AIRA"
            >
              {Icons.aivoryAvatar}
              <span className={styles.fieldAIEditButtonLabel}>Edit with AIRA</span>
            </button>
          )}
        </div>
        <span className={styles.fieldHelperText}>
          Ceritakan apa yang terjadi di langkah ini dengan kalimat biasa. Contoh: 'Ambil data klien dari Salesforce ketika ada onboarding baru masuk.'
        </span>
        <textarea className={styles.fieldTextarea} value={action} onChange={e => setAction(e.target.value)} rows={3} />
        
        {!isTrigger && (
          <>
            <label className={styles.fieldLabel}>Tool / Service used</label>
            <span className={styles.fieldHelperText}>
              Tulis nama tool atau API yang dipakai. Contoh: 'Salesforce REST API', 'SendGrid v3', 'SharePoint Graph API', atau 'HTTP Custom API'.
            </span>
            <input className={styles.fieldInput} value={tool} onChange={e => setTool(e.target.value)} placeholder="e.g. Google Sheets, OpenAI, Slack" />
            
            <label className={styles.fieldLabel}>What this produces</label>
            <span className={styles.fieldHelperText}>
              Tulis output yang dihasilkan langkah ini. Contoh: 'Data klien lengkap dalam format JSON, siap diproses ke langkah berikutnya.'
            </span>
            <input className={styles.fieldInput} value={output} onChange={e => setOutput(e.target.value)} placeholder="e.g. Enriched lead record" />

            {/* API & Credentials Section */}
            <div 
              className={styles.credSectionHeader}
              onClick={() => setShowCredSection(!showCredSection)}
            >
              <span>API & CREDENTIALS</span>
              <span className={`${styles.credSectionArrow} ${showCredSection ? styles.open : ''}`}>›</span>
            </div>

            {showCredSection && (
              <div>
                {/* Field 1: Integration */}
                <div className={styles.credField}>
                  <label className={styles.credFieldLabel}>Integration</label>
                  <span className={styles.credFieldHelper}>
                    Pilih sistem yang digunakan. Kalau tidak ada di list, pilih 'Custom'.
                  </span>
                  <select 
                    className={styles.credSelect}
                    value={integration}
                    onChange={e => setIntegration(e.target.value)}
                  >
                    <option value="">-- Select Integration --</option>
                    <option value="Salesforce">Salesforce</option>
                    <option value="SharePoint">SharePoint</option>
                    <option value="SendGrid">SendGrid</option>
                    <option value="Slack">Slack</option>
                    <option value="OpenAI">OpenAI</option>
                    <option value="Notion">Notion</option>
                    <option value="HubSpot">HubSpot</option>
                    <option value="HTTP Custom API">HTTP Custom API</option>
                    <option value="Webhook">Webhook</option>
                    <option value="Database">Database</option>
                    <option value="Other">Other / Custom</option>
                  </select>
                </div>

                {/* Field 2: API URL */}
                <div className={styles.credField}>
                  <label className={styles.credFieldLabel}>API URL</label>
                  <span className={styles.credFieldHelper}>
                    Masukkan URL lengkap endpoint API yang akan dipanggil. Contoh: https://api.salesforce.com/v54/sobjects/Contact
                  </span>
                  <input 
                    className={styles.credInput}
                    type="text"
                    value={apiUrl}
                    onChange={e => setApiUrl(e.target.value)}
                    placeholder="https://api.example.com/v1/endpoint"
                  />
                </div>

                {/* Field 3: HTTP Method (only if URL is not empty) */}
                {apiUrl && (
                  <div className={styles.credField}>
                    <label className={styles.credFieldLabel}>HTTP METHOD</label>
                    <span className={styles.credFieldHelper}>
                      Pilih metode request yang dipakai API ini.
                    </span>
                    <select 
                      className={styles.credSelect}
                      value={httpMethod}
                      onChange={e => setHttpMethod(e.target.value)}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                )}

                {/* Field 4: API Key */}
                <div className={styles.credField}>
                  <label className={styles.credFieldLabel}>API KEY ATAU TOKEN</label>
                  <span className={styles.credFieldHelper}>
                    Masukkan API key atau Bearer token. Credential ini hanya disimpan di browser kamu — tidak dikirim ke server Aivory.
                  </span>
                  <div className={styles.apiKeyRow}>
                    <input 
                      className={styles.credInput}
                      type={showApiKeyPassword ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder="sk-xxxx atau Bearer eyJhbGc..."
                    />
                    <button 
                      className={styles.toggleVisBtn}
                      onClick={() => setShowApiKeyPassword(!showApiKeyPassword)}
                    >
                      {showApiKeyPassword ? 'Sembunyikan' : 'Tampilkan'}
                    </button>
                  </div>
                </div>

                {/* Field 5: Credential Name */}
                <div className={styles.credField}>
                  <label className={styles.credFieldLabel}>NAMA CREDENTIAL</label>
                  <span className={styles.credFieldHelper}>
                    Beri nama supaya AIRA bisa mereferensikannya saat membangun workflow. Contoh: 'Salesforce Production'.
                  </span>
                  <input 
                    className={styles.credInput}
                    type="text"
                    value={credName}
                    onChange={e => setCredName(e.target.value)}
                    placeholder="contoh: Salesforce Production"
                  />
                </div>

                {/* Field 6: Additional Parameters (sub-collapsible) */}
                <div className={styles.credField}>
                  <div 
                    className={styles.subSectionHeader}
                    onClick={() => setShowParamSection(!showParamSection)}
                  >
                    PARAMETER TAMBAHAN (OPSIONAL) {showParamSection ? '›' : '›'}
                  </div>
                  {showParamSection && (
                    <>
                      <span className={styles.credFieldHelper}>
                        Tambahkan parameter custom dalam format JSON. Contoh: {'{'}  "timeout": 30, "version": "v2" {'}'}
                      </span>
                      <textarea 
                        className={styles.credTextarea}
                        value={additionalParams}
                        onChange={e => {
                          setAdditionalParams(e.target.value)
                          validateJSON(e.target.value)
                        }}
                        onBlur={() => validateJSON(additionalParams)}
                        rows={3}
                        placeholder='{ "key": "value" }'
                      />
                      {jsonError && <span className={styles.jsonError}>{jsonError}</span>}
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <button className={styles.saveChangesBtn} onClick={handleSave}>Save Changes</button>
    </div>
  )
}

// ── Edit with AI modal ───────────────────────────────────
// Replaced with WorkflowAIEditor component (imported above)

// ── Save Workflow modal ──────────────────────────────────
function SaveWorkflowModal({
  onClose, onSave
}: {
  onClose: () => void
  onSave: (versionName: string) => void
}) {
  const [name, setName] = useState('v1.1')
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.saveModal} onClick={e => e.stopPropagation()}>
        <div className={styles.saveModalHeader}>
          <div className={styles.saveModalTitles}>
            <p className={styles.saveModalTitle}>Save Workflow Version</p>
            <p className={styles.saveModalSubtitle}>Give this version a name. It will be saved locally.</p>
          </div>
          <button className={styles.rightPanelClose} onClick={onClose} aria-label="Close">{Icons.close}</button>
        </div>
        <input
          className={styles.saveModalInput}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. v1.1 or Latest Draft"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSave(name.trim()) }}
        />
        <div className={styles.saveModalActions}>
          <button className={styles.saveModalCancel} onClick={onClose}>Cancel</button>
          <button className={styles.saveModalConfirm} onClick={() => name.trim() && onSave(name.trim())}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────
function WorkflowsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [showAIModal, setShowAIModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [undoStack, setUndoStack] = useState<SavedWorkflow[]>([])
  const [activating, setActivating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showActivateDropdown, setShowActivateDropdown] = useState(false)
  const [isWorkflowListCollapsed, setIsWorkflowListCollapsed] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const activateRef = useRef<HTMLDivElement>(null)

  const selected = workflows.find(w => w.workflow_id === selectedId) ?? null

  useEffect(() => {
    const wfs = loadWorkflows()
    setWorkflows(wfs)
    const selected = searchParams?.get('selected')
    if (selected && wfs.find(w => w.workflow_id === selected)) setSelectedId(selected)
    else if (wfs.length > 0) setSelectedId(wfs[0].workflow_id)
  }, [])

  // Re-sync list whenever a new workflow is saved from another page (e.g. Blueprint)
  useEffect(() => {
    const sync = () => {
      const wfs = loadWorkflows()
      setWorkflows(wfs)
      // If a ?selected param is present and not yet selected, pick it
      const sel = searchParams?.get('selected')
      if (sel) setSelectedId(sel)
    }
    window.addEventListener('aivory_workflows_updated', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('aivory_workflows_updated', sync)
      window.removeEventListener('storage', sync)
    }
  }, [searchParams])

  // Close "More" dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false)
      if (activateRef.current && !activateRef.current.contains(e.target as Node)) setShowActivateDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSaveStep = (updated: SavedWorkflow) => {
    // push current to undo stack before saving
    if (selected) setUndoStack(prev => [...prev.slice(-9), selected])
    updateWorkflow(updated.workflow_id, updated)
    setWorkflows(loadWorkflows())
    setEditTarget(null)
  }

  const handleStatusChange = (status: SavedWorkflow['status']) => {
    if (!selected) return
    updateWorkflow(selected.workflow_id, { status })
    setWorkflows(loadWorkflows())
  }

  const handleTitleSave = (newTitle: string) => {
    if (!selected || !newTitle.trim()) return
    updateWorkflow(selected.workflow_id, { title: newTitle.trim() })
    setWorkflows(loadWorkflows())
    setEditingTitle(false)
  }

  const handleDelete = (id: string) => {
    deleteWorkflow(id)
    const remaining = loadWorkflows()
    setWorkflows(remaining)
    if (selectedId === id) setSelectedId(remaining[0]?.workflow_id ?? null)
    setShowMore(false)
  }

  const handleExport = () => {
    if (!selected) return
    
    // Create a deep copy and redact apiKey from all steps
    const exportData = JSON.parse(JSON.stringify(selected))
    if (Array.isArray(exportData.steps)) {
      exportData.steps.forEach((step: any) => {
        if (step.config && step.config.apiKey) {
          step.config.apiKey = '[REDACTED]'
        }
      })
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selected.workflow_id}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowMore(false)
  }

  const handleAIApply = (updated: SavedWorkflow) => {
    if (selected) setUndoStack(prev => [...prev.slice(-9), selected])
    updateWorkflow(updated.workflow_id, updated)
    setWorkflows(loadWorkflows())
    setShowAIModal(false)
  }

  const handleUndo = () => {
    if (!undoStack.length || !selected) return
    const prev = undoStack[undoStack.length - 1]
    setUndoStack(s => s.slice(0, -1))
    updateWorkflow(selected.workflow_id, prev)
    setWorkflows(loadWorkflows())
  }

  const handleSaveVersion = (versionName: string) => {
    if (!selected) return
    // Save a snapshot copy with the version name appended to the id
    const snapshot: SavedWorkflow = {
      ...selected,
      workflow_id: `${selected.workflow_id}-${versionName.replace(/\s+/g, '-').toLowerCase()}`,
      title: `${selected.title} (${versionName})`,
      created_at: new Date().toISOString(),
    }
    const existing = loadWorkflows()
    if (!existing.find(w => w.workflow_id === snapshot.workflow_id)) {
      localStorage.setItem('aivory_workflows', JSON.stringify([...existing, snapshot]))
      setWorkflows(loadWorkflows())
    }
    setShowSaveModal(false)
  }

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleActivate = async () => {
    if (!selected || activating) return
    setActivating(true)
    try {
      const res = await fetch('/api/workflows/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: selected.workflow_id, workflow_data: selected }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Activation failed')

      // Persist n8n data to localStorage
      updateWorkflow(selected.workflow_id, {
        status: 'active',
        n8n_workflow_id: data.n8n_workflow_id,
        n8n_url: data.n8n_url,
      } as Partial<SavedWorkflow>)
      setWorkflows(loadWorkflows())
      showToast('Workflow activated ✓', 'success')
    } catch (err) {
      showToast('Failed to activate workflow.', 'error')
      console.error('[activate]', err)
    } finally {
      setActivating(false)
    }
  }

  const handleDeactivate = async () => {
    if (!selected || activating) return
    setActivating(true)
    try {
      // Update status to draft in localStorage
      updateWorkflow(selected.workflow_id, { status: 'draft' })
      setWorkflows(loadWorkflows())
      showToast('Workflow deactivated', 'success')
    } catch (err) {
      showToast('Failed to deactivate workflow.', 'error')
      console.error('[deactivate]', err)
    } finally {
      setActivating(false)
    }
  }

  // ── Empty state ──────────────────────────────────────────
  if (workflows.length === 0) {
    return (
      <div className={styles.emptyPage}>
        <div className={styles.emptyContent}>
          <div className={styles.emptyIconWrap}>{Icons.workflow}</div>
          <h2 className={styles.emptyTitle}>No workflows yet</h2>
          <p className={styles.emptyText}>
            Generate workflows from the Blueprint tab — they'll appear here automatically.
          </p>
          <button className={styles.emptyCTA} onClick={() => router.push('/blueprint')}>
            Go to Blueprint →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.workflowsLayout}>

      {/* ── Left sidebar ── */}
      <aside className={`${styles.workflowList} ${isWorkflowListCollapsed ? styles.workflowListCollapsed : ''}`}>
        <div className={styles.workflowListHeader}>
          {!isWorkflowListCollapsed && (
            <>
              <span className={styles.workflowListTitle}>Workflows</span>
              <span className={styles.workflowListCount}>{workflows.length}</span>
            </>
          )}
          <button
            className={styles.workflowListCollapseBtn}
            onClick={() => setIsWorkflowListCollapsed(v => !v)}
            title={isWorkflowListCollapsed ? 'Expand workflow list' : 'Collapse workflow list'}
            aria-label={isWorkflowListCollapsed ? 'Expand workflow list' : 'Collapse workflow list'}
            style={{ marginLeft: isWorkflowListCollapsed ? 'auto' : undefined, marginRight: isWorkflowListCollapsed ? 'auto' : undefined }}
          >
            {isWorkflowListCollapsed ? '›' : '‹'}
          </button>
        </div>
        {!isWorkflowListCollapsed && workflows.map(wf => (
          <div
            key={wf.workflow_id}
            className={`${styles.workflowListItem} ${selectedId === wf.workflow_id ? styles.workflowListItemActive : ''}`}
            onClick={() => { setSelectedId(wf.workflow_id); setEditTarget(null) }}
          >
            <div className={styles.wliTop}>
              <span className={styles.wliTitle}>{wf.title}</span>
              <div className={styles.wliBadges}>
                <ModeBadge wf={wf} />
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete workflow "${wf.title}"? This cannot be undone.`)) {
                      handleDelete(wf.workflow_id)
                    }
                  }}
                  title="Delete workflow"
                  aria-label="Delete workflow"
                >
                  {Icons.trash}
                </button>
              </div>
            </div>
            <span className={styles.wliMeta}>{wf.company_name} · {new Date(wf.created_at).toLocaleDateString()}</span>
          </div>
        ))}
      </aside>

      {/* ── Main canvas ── */}
      {selected && (
        <div className={styles.canvasArea}>

          {/* Toolbar */}
          <div className={styles.canvasHeader}>
            <div className={styles.canvasHeaderLeft}>
              {editingTitle ? (
                <input
                  className={styles.titleInput}
                  defaultValue={selected.title}
                  autoFocus
                  onBlur={e => handleTitleSave(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleTitleSave((e.target as HTMLInputElement).value)
                    if (e.key === 'Escape') setEditingTitle(false)
                  }}
                />
              ) : (
                <h1 className={styles.canvasTitle} onClick={() => setEditingTitle(true)} title="Click to edit">
                  {selected.title}
                  <span className={styles.editTitleHint}>{Icons.edit}</span>
                </h1>
              )}
              {/* Preview Mode label */}
              {!isActiveWorkflow(selected) && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.04)',
                  color: '#a8a6a2',
                  border: '1px solid rgba(255,255,255,0.07)',
                  letterSpacing: '0.3px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  Preview Mode
                </span>
              )}
            </div>

            <div className={styles.canvasHeaderActions}>
              <select
                className={styles.statusSelect}
                value={selected.status}
                onChange={e => handleStatusChange(e.target.value as SavedWorkflow['status'])}
                aria-label="Change status"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>

              {/* Edit with AIRA */}
              <button className={styles.aiBtn} onClick={() => setShowAIModal(true)}>
                {Icons.sparkle}
                Edit with AIRA
              </button>

              {/* Save Workflow */}
              <button className={styles.saveBtn} onClick={() => setShowSaveModal(true)}>
                {Icons.save}
                Save
              </button>

              {/* Undo */}
              <button
                className={styles.undoBtn}
                onClick={handleUndo}
                disabled={!undoStack.length}
                title="Undo last change"
                style={!undoStack.length ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
              >
                {Icons.undo}
                Undo
              </button>

              {/* More dropdown */}
              <div className={styles.moreDropdownWrap} ref={moreRef}>
                <button
                  className={styles.iconBtn}
                  onClick={() => setShowMore(v => !v)}
                  aria-label="More options"
                >
                  {Icons.moreH}
                </button>
                {showMore && (
                  <div className={styles.moreDropdown}>
                    <button className={styles.moreDropdownItem} onClick={handleExport}>
                      {Icons.download} Export JSON
                    </button>
                    <button
                      className={`${styles.moreDropdownItem} ${styles.moreDropdownItemDanger}`}
                      onClick={() => handleDelete(selected.workflow_id)}
                    >
                      {Icons.trash} Delete Workflow
                    </button>
                  </div>
                )}
              </div>

              {/* Activate/Deactivate dropdown */}
              <div className={styles.activateDropdownWrap} ref={activateRef}>
                {isActiveWorkflow(selected) ? (
                  // Active workflow — show deactivate button
                  <>
                    <button
                      className={styles.activateDropdownBtn}
                      onClick={() => setShowActivateDropdown(v => !v)}
                      disabled={activating}
                      aria-label="Workflow options"
                    >
                      {Icons.play}
                      {activating ? 'Processing…' : 'Deactivate'}
                    </button>
                    {showActivateDropdown && (
                      <div className={styles.activateDropdownMenu}>
                        <button
                          className={styles.activateDropdownItem}
                          onClick={() => { handleDeactivate(); setShowActivateDropdown(false) }}
                        >
                          {Icons.stop}
                          Deactivate Workflow
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  // Preview workflow — Activate is disabled
                  <button
                    className={styles.activateDropdownBtn}
                    disabled
                    title="Deploy this workflow to n8n to activate it"
                    style={{ opacity: 0.4, cursor: 'not-allowed' }}
                  >
                    {Icons.play}
                    Activate
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Toast notification */}
          {toast && (
            <div className={styles.activateToast} data-type={toast.type}>
              {toast.msg}
            </div>
          )}

          {/* Canvas flow — fills remaining space */}
          <div className={styles.canvasBody}>
            <N8nWorkflowCanvas
              key={`${selected.workflow_id}-${selected.n8n_workflow_id ?? 'preview'}`}
              workflowId={selected.workflow_id}
              isActive={isActiveWorkflow(selected)}
              n8nWorkflowId={selected.n8n_workflow_id}
              fallbackSteps={selected.steps}
            />

            {/* Meta footer — absolutely positioned overlay */}
            <div className={styles.canvasMeta}>
              {selected.integrations.length > 0 && (
                <div className={styles.canvasIntegrations}>
                  <span className={styles.canvasMetaLabel}>Integrations</span>
                  {selected.integrations.slice(0, 2).map((int, i) => (
                    <span key={i} className={styles.integrationTag}>{int}</span>
                  ))}
                  {selected.integrations.length > 2 && (
                    <span className={styles.integrationTag}>+{selected.integrations.length - 2}</span>
                  )}
                </div>
              )}
              <div className={styles.canvasStats}>
                {selected.estimated_time && (
                  <span className={styles.canvasStat}>
                    <span className={styles.canvasStatIcon}>{Icons.clock}</span>
                    {selected.estimated_time.replace(/minutes per client/g, 'min/client').replace(/minutes/g, 'min')}
                  </span>
                )}
                {selected.automation_percentage && (
                  <span className={styles.canvasStat}>
                    <span className={styles.canvasStatIcon}>{Icons.robot}</span>
                    {selected.automation_percentage.replace(/automated/g, 'auto')}
                  </span>
                )}
              </div>
            </div>

            {/* Secondary undo — absolutely positioned overlay */}
            <button
              className={styles.canvasUndoBtn}
              onClick={handleUndo}
              aria-disabled={!undoStack.length}
              title={undoStack.length ? 'Undo last change' : 'Nothing to undo'}
            >
              {Icons.undo}
              Undo last change
            </button>
          </div>
        </div>
      )}

      {/* ── Right panel ── */}
      {selected && editTarget && (
        <RightPanel
          workflow={selected}
          editTarget={editTarget}
          onSave={handleSaveStep}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* ── Edit with AI modal ── */}
      {showAIModal && selected && (
        <WorkflowAIEditor
          workflow={selected}
          onClose={() => setShowAIModal(false)}
          onApply={handleAIApply}
        />
      )}

      {/* ── Save Workflow modal ── */}
      {showSaveModal && (
        <SaveWorkflowModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveVersion}
        />
      )}
    </div>
  )
}

export default function WorkflowsPage() {
  return (
    <Suspense fallback={<div style={{ background: '#2c2c2c', height: '100vh' }} />}>
      <WorkflowsPageInner />
    </Suspense>
  )
}
