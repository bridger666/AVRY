'use client'

const STORAGE_KEY = 'aivory_workflows'

export interface SavedWorkflow {
  workflow_id: string
  title: string
  status: 'draft' | 'active' | 'archived'
  source: 'blueprint' | 'n8n'
  blueprint_version?: string
  company_name: string
  created_at: string
  trigger: string
  steps: Array<{
    step: number
    action: string
    tool: string
    output: string
    type?: string
    config?: {
      integration?: string
      url?: string
      method?: string
      apiKey?: string
      additionalFields?: string
    }
    credentials?: {
      name?: string
    }
  }>
  integrations: string[]
  estimated_time: string
  automation_percentage: string
  error_handling?: string
  notes?: string
  // Source identifiers
  blueprintId?: string
  n8nId?: string
  // n8n activation data
  n8n_workflow_id?: string
  n8n_url?: string
}

export function loadWorkflows(): SavedWorkflow[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    
    const workflows = JSON.parse(raw) as SavedWorkflow[]
    
    // Normalize workflows in memory: if it has n8nId but legacy source 'blueprint',
    // treat it as n8n-backed so it uses the new editor
    const normalized = workflows.map((wf) => {
      if (wf.n8nId && wf.source === 'blueprint') {
        return { ...wf, source: 'n8n' as const }
      }
      return wf
    })
    
    return normalized
  } catch {
    return []
  }
}

export function saveWorkflow(wf: SavedWorkflow): string {
  const existing = loadWorkflows()
  const sameId = existing.filter(w => w.workflow_id === wf.workflow_id || w.workflow_id.startsWith(wf.workflow_id + '-v'))
  let finalId = wf.workflow_id
  if (sameId.length > 0) {
    finalId = `${wf.workflow_id}-v${sameId.length + 1}`
  }
  const toSave = { ...wf, workflow_id: finalId }
  existing.push(toSave)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('aivory_workflows_updated'))
  }
  return finalId
}

export function updateWorkflow(workflow_id: string, updates: Partial<SavedWorkflow>): void {
  const existing = loadWorkflows()
  const idx = existing.findIndex(w => w.workflow_id === workflow_id)
  if (idx !== -1) {
    existing[idx] = { ...existing[idx], ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  }
}

export function deleteWorkflow(workflow_id: string): void {
  const existing = loadWorkflows().filter(w => w.workflow_id !== workflow_id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}

export function getWorkflowCount(): number {
  return loadWorkflows().length
}
