# Blueprint → Workflow Generation: Complete Implementation Guide

## Overview

This guide provides a step-by-step implementation plan to:
1. Fix Blueprint → Workflow generation (remove "Service temporarily unavailable" error)
2. Add source badges in Workflows list ([n8n] or [Blueprint])
3. Upgrade WorkflowCanvas UI to modern compact rounded-square nodes
4. Ensure full n8n integration without requiring separate n8n dashboard

## Current State Analysis

### What Works
- WorkflowCanvas component exists with React Flow integration
- WorkflowStepNode has custom styling (rounded-2xl, 260-320px width)
- StepInspector panel exists on the right side with "What happens", "Tool/service", "What this produces"
- useWorkflows hook handles localStorage persistence
- n8n API routes exist at `/api/n8n/workflow/[id]`

### What's Broken
- Blueprint → Workflow generation fails with "Service temporarily unavailable"
- No source badges in Workflows list
- Nodes are still too wide (260-320px) and text doesn't wrap optimally
- No full n8n integration (users still need n8n dashboard)

---

## Phase 1: Fix Blueprint → Workflow Generation

### 1.1 Create Unified Workflow Type

**File**: `nextjs-console/types/workflow.ts` (NEW)

```typescript
export type WorkflowSource = 'n8n' | 'blueprint';
export type WorkflowStatus = 'active' | 'draft' | 'archived';

export interface ConsoleWorkflow {
  id: string;
  name: string;
  source: WorkflowSource;
  status: WorkflowStatus;
  createdAt?: string;
  updatedAt?: string;
  n8nId?: string;
  blueprintId?: string;
  description?: string;
}
```

### 1.2 Create API Endpoint for Workflow Generation

**File**: `nextjs-console/app/api/console/workflows/from-blueprint/route.ts` (NEW)

```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { blueprintId, name, context } = body;

    if (!blueprintId) {
      return NextResponse.json(
        { error: 'blueprintId is required' },
        { status: 400 }
      );
    }

    // Generate unique workflow ID
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // TODO: Call n8n API to create workflow instance
    // For now, return mock response
    const consoleWorkflow = {
      id: workflowId,
      name: name || 'Generated Workflow',
      source: 'n8n' as const,
      status: 'draft' as const,
      n8nId: workflowId,
      blueprintId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      { status: 'ok', data: consoleWorkflow },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error creating workflow from blueprint', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 1.3 Create Frontend Client Helper

**File**: `nextjs-console/lib/consoleWorkflows.ts` (NEW)

```typescript
import type { ConsoleWorkflow } from '@/types/workflow';

export async function createWorkflowFromBlueprint(params: {
  blueprintId: string;
  name?: string;
  context?: Record<string, any>;
}): Promise<ConsoleWorkflow> {
  const res = await fetch('/api/console/workflows/from-blueprint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = body?.error || `Failed to create workflow (HTTP ${res.status})`;
    throw new Error(msg);
  }

  const json = await res.json();
  return json.data as ConsoleWorkflow;
}
```

### 1.4 Update Blueprint Page

**File**: `nextjs-console/app/blueprint/page.tsx` (MODIFY)

Add to imports:
```typescript
import { createWorkflowFromBlueprint } from '@/lib/consoleWorkflows';
import { useRouter } from 'next/navigation';
```

In the `handleGenerateWorkflow` function, replace the existing logic with:
```typescript
const handleGenerateWorkflow = async (wf: BlueprintV1WorkflowModule) => {
  const id = wf.workflow_id;
  setGeneratingWorkflow(prev => ({ ...prev, [id]: true }));
  setWorkflowErrors(prev => ({ ...prev, [id]: '' }));

  try {
    // Call the new API endpoint
    const consoleWorkflow = await createWorkflowFromBlueprint({
      blueprintId: id,
      name: wf.name,
      context: { blueprint: blueprint?.organization?.name },
    });

    // Save to localStorage workflows store
    const savedId = saveWorkflow({
      workflow_id: consoleWorkflow.id,
      title: consoleWorkflow.name,
      status: 'draft',
      source: 'blueprint',
      blueprint_version: currentVersionLabel || 'V1',
      company_name: blueprint?.organization?.name || 'SME',
      created_at: new Date().toISOString(),
      trigger: wf.trigger,
      steps: wf.steps.map((step, idx) => ({
        step: idx + 1,
        action: step.action,
        tool: '',
        output: '',
      })),
      integrations: wf.integrations_required || [],
      estimated_time: '—',
      automation_percentage: '—',
    });

    setSavedWorkflowIds(prev => ({ ...prev, [id]: savedId }));
    
    // Navigate to the new workflow
    router.push(`/workflows/${consoleWorkflow.id}`);
  } catch (err) {
    setWorkflowErrors(prev => ({
      ...prev,
      [id]: err instanceof Error ? err.message : 'Failed to generate workflow'
    }));
  } finally {
    setGeneratingWorkflow(prev => ({ ...prev, [id]: false }));
  }
};
```

---

## Phase 2: Add Source Badges to Workflows List

### 2.1 Update Workflows List UI

**File**: `nextjs-console/app/workflows/page.tsx` (MODIFY)

In the workflow list item rendering, add a source badge:

```typescript
{workflows.map(wf => (
  <div
    key={wf.workflow_id}
    className={`${styles.workflowListItem} ${selectedId === wf.workflow_id ? styles.workflowListItemActive : ''}`}
    onClick={() => { setSelectedId(wf.workflow_id); setEditTarget(null) }}
  >
    <div className={styles.wliTop}>
      <span className={styles.wliTitle}>{wf.title}</span>
      <div className={styles.wliBadges}>
        {/* Source badge */}
        <span className={`${styles.sourceBadge} ${wf.source === 'n8n' ? styles.sourceN8n : styles.sourceBlueprint}`}>
          {wf.source === 'n8n' ? 'n8n' : 'Blueprint'}
        </span>
        <StatusBadge status={wf.status} />
      </div>
    </div>
    <span className={styles.wliMeta}>{wf.company_name} · {new Date(wf.created_at).toLocaleDateString()}</span>
  </div>
))}
```

### 2.2 Add CSS for Source Badges

**File**: `nextjs-console/app/workflows/workflows.module.css` (MODIFY)

Add:
```css
.wliBadges {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sourceBadge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sourceN8n {
  background-color: rgba(20, 184, 166, 0.1);
  color: #14b8a6;
  border: 1px solid rgba(20, 184, 166, 0.3);
}

.sourceBlueprint {
  background-color: rgba(107, 114, 128, 0.1);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.3);
}
```

### 2.3 Update SavedWorkflow Interface

**File**: `nextjs-console/hooks/useWorkflows.ts` (MODIFY)

Change the `source` field from hardcoded 'blueprint' to support both:

```typescript
export interface SavedWorkflow {
  workflow_id: string
  title: string
  status: 'draft' | 'active' | 'archived'
  source: 'blueprint' | 'n8n'  // Changed from hardcoded 'blueprint'
  blueprint_version?: string
  company_name: string
  created_at: string
  trigger: string
  steps: Array<{...}>
  integrations: string[]
  estimated_time: string
  automation_percentage: string
  error_handling?: string
  notes?: string
  n8n_workflow_id?: string
  n8n_url?: string
  blueprintId?: string  // Add this
  n8nId?: string  // Add this
}
```

---

## Phase 3: Upgrade WorkflowCanvas UI to Compact Rounded-Square Nodes

### 3.1 Update WorkflowStepNode for Compact Design

**File**: `nextjs-console/components/workflow/WorkflowStepNode.tsx` (MODIFY)

Replace the `cardClassName` with:

```typescript
const cardClassName = useMemo(
  () =>
    cn(
      // Compact square-ish design
      'relative flex flex-col rounded-lg px-3 py-2 w-[160px] h-[160px]',
      'shadow-md border text-xs text-slate-100',
      'overflow-hidden',  // Prevent overflow
      accentClasses,
      selected && 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900',
    ),
  [accentClasses, selected],
);
```

Update text wrapping:

```typescript
<div className="text-[10px] uppercase tracking-wide text-slate-300/80 truncate">
  {categoryLabel}
</div>

<div className="text-xs font-medium leading-tight line-clamp-2 break-words">
  {data.title}
</div>

{data.subtitle && (
  <div className="mt-0.5 text-[10px] text-slate-300/80 line-clamp-2 break-words">
    {data.subtitle}
  </div>
)}

{data.description && (
  <div className="mt-1 text-[10px] text-slate-400 line-clamp-2 break-words">
    {data.description}
  </div>
)}
```

### 3.2 Improve Handle Positioning

Keep the existing handle logic but ensure they're positioned correctly for the smaller nodes:

```typescript
<Handle
  type="target"
  position={Position.Top}
  className={cn('h-2 w-2 rounded-full border border-slate-900', dotClass)}
  style={{ top: -6 }}
/>

{!hasMultipleOutputs && (
  <Handle
    type="source"
    position={Position.Bottom}
    className={cn('h-2 w-2 rounded-full border border-slate-900', dotClass)}
    style={{ bottom: -6 }}
  />
)}
```

---

## Phase 4: Full n8n Integration

### 4.1 Ensure Save Operations Sync to n8n

**File**: `nextjs-console/components/workflow/WorkflowCanvas.tsx` (MODIFY)

Add a save handler that syncs to n8n:

```typescript
const handleSaveWorkflow = async () => {
  try {
    // Convert React Flow nodes/edges to n8n format
    const n8nWorkflow = mapReactFlowToN8n(nodes, edges);
    
    // Save to n8n via API
    const response = await fetch(`/api/n8n/workflow/${workflowId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nWorkflow),
    });

    if (!response.ok) throw new Error('Failed to save to n8n');
    
    showToast('Workflow saved to n8n', 'success');
  } catch (err) {
    showToast('Failed to save workflow', 'error');
    console.error(err);
  }
};
```

### 4.2 Add Execute Workflow Button

Add to the canvas header:

```typescript
<button
  onClick={handleExecuteWorkflow}
  className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium"
  disabled={isExecuting}
>
  {isExecuting ? 'Executing...' : 'Execute Workflow'}
</button>
```

Implement the handler:

```typescript
const handleExecuteWorkflow = async () => {
  try {
    setIsExecuting(true);
    const response = await fetch(`/api/n8n/workflow/${workflowId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error('Execution failed');
    
    const result = await response.json();
    showToast('Workflow executed successfully', 'success');
    
    // Fetch and display execution logs
    fetchExecutionLogs();
  } catch (err) {
    showToast('Failed to execute workflow', 'error');
  } finally {
    setIsExecuting(false);
  }
};
```

### 4.3 Add Execution Logs Tab

Add a tab in the canvas to show execution history:

```typescript
<div className={styles.executionLogs}>
  <h3>Execution Logs</h3>
  {executions.map(exec => (
    <div key={exec.id} className={styles.executionItem}>
      <span>{new Date(exec.startedAt).toLocaleString()}</span>
      <span className={`${styles.status} ${styles[exec.status]}`}>
        {exec.status}
      </span>
    </div>
  ))}
</div>
```

### 4.4 Hide "Open in n8n" Button

Remove or hide any button that directs users to the n8n dashboard. All operations should happen in Aivory.

### 4.5 Add Sync Status Indicator

Add to the canvas header:

```typescript
<div className={styles.syncStatus}>
  {syncStatus === 'synced' && <span className={styles.synced}>✓ Synced</span>}
  {syncStatus === 'pending' && <span className={styles.pending}>⟳ Syncing...</span>}
  {syncStatus === 'error' && <span className={styles.error}>✗ Sync Error</span>}
</div>
```

---

## Implementation Checklist

### Phase 1: Blueprint → Workflow Generation
- [ ] Create `nextjs-console/types/workflow.ts`
- [ ] Create `nextjs-console/app/api/console/workflows/from-blueprint/route.ts`
- [ ] Create `nextjs-console/lib/consoleWorkflows.ts`
- [ ] Update `nextjs-console/app/blueprint/page.tsx` with new handler
- [ ] Test: Generate workflow from blueprint → should navigate to /workflows/[id]

### Phase 2: Source Badges
- [ ] Update `nextjs-console/app/workflows/page.tsx` to render source badges
- [ ] Add CSS to `nextjs-console/app/workflows/workflows.module.css`
- [ ] Update `nextjs-console/hooks/useWorkflows.ts` interface
- [ ] Test: Workflows list shows [n8n] and [Blueprint] badges

### Phase 3: Compact UI
- [ ] Update `nextjs-console/components/workflow/WorkflowStepNode.tsx`
  - Change width to 160px, height to 160px
  - Add text wrapping with line-clamp
  - Ensure handles are properly positioned
- [ ] Test: Nodes appear as compact squares with wrapped text

### Phase 4: n8n Integration
- [ ] Add save handler to `nextjs-console/components/workflow/WorkflowCanvas.tsx`
- [ ] Add execute workflow button and handler
- [ ] Add execution logs display
- [ ] Add sync status indicator
- [ ] Remove "Open in n8n" button
- [ ] Test: Save, execute, and view logs all work in Aivory

---

## Testing Steps

1. **Blueprint Generation**
   - Navigate to Blueprint tab
   - Click "Generate Workflow"
   - Verify: No error, navigation to /workflows/[id]

2. **Source Badges**
   - Go to Workflows tab
   - Verify: New workflow has [n8n] badge
   - Verify: Existing workflows have appropriate badges

3. **Compact UI**
   - Open workflow canvas
   - Verify: Nodes are compact squares (~160x160px)
   - Verify: Text wraps inside nodes
   - Verify: Connectors stay neat when dragging nodes

4. **n8n Integration**
   - Edit a step in the right panel
   - Click "Save Changes"
   - Click "Save" in canvas header
   - Verify: Workflow syncs to n8n (check n8n dashboard)
   - Click "Execute Workflow"
   - Verify: Execution appears in logs

---

## Environment Variables

Ensure these are set:
```
N8N_URL=http://your-selfhosted-n8n:5678
N8N_API_KEY=your-api-key
```

---

## Notes

- All operations should happen in Aivory without requiring the n8n dashboard
- The compact node design improves visual clarity and reduces canvas clutter
- Source badges help users quickly identify workflow origins
- Full n8n integration ensures data consistency and real-time sync
