# Quick Start: Blueprint → Workflow Implementation

## 4 Main Goals

1. ✅ Fix Blueprint → Workflow generation (remove "Service temporarily unavailable")
2. ✅ Add source badges in Workflows list ([n8n] or [Blueprint])
3. ✅ Upgrade WorkflowCanvas to compact rounded-square nodes
4. ✅ Full n8n integration (no separate n8n dashboard needed)

---

## Files to Create (3 new files)

### 1. `nextjs-console/types/workflow.ts`
```typescript
export type WorkflowSource = 'n8n' | 'blueprint';
export interface ConsoleWorkflow {
  id: string;
  name: string;
  source: WorkflowSource;
  status: 'active' | 'draft' | 'archived';
  n8nId?: string;
  blueprintId?: string;
  createdAt?: string;
}
```

### 2. `nextjs-console/app/api/console/workflows/from-blueprint/route.ts`
```typescript
export async function POST(request: Request) {
  const { blueprintId, name } = await request.json();
  if (!blueprintId) return NextResponse.json({ error: 'blueprintId required' }, { status: 400 });
  
  const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return NextResponse.json({
    status: 'ok',
    data: {
      id: workflowId,
      name: name || 'Generated Workflow',
      source: 'n8n',
      status: 'draft',
      n8nId: workflowId,
      blueprintId,
      createdAt: new Date().toISOString(),
    }
  }, { status: 201 });
}
```

### 3. `nextjs-console/lib/consoleWorkflows.ts`
```typescript
export async function createWorkflowFromBlueprint(params: {
  blueprintId: string;
  name?: string;
}): Promise<ConsoleWorkflow> {
  const res = await fetch('/api/console/workflows/from-blueprint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to create workflow');
  const json = await res.json();
  return json.data;
}
```

---

## Files to Modify (4 files)

### 1. `nextjs-console/app/blueprint/page.tsx`

**Add imports:**
```typescript
import { createWorkflowFromBlueprint } from '@/lib/consoleWorkflows';
import { useRouter } from 'next/navigation';
```

**Update handleGenerateWorkflow:**
```typescript
const handleGenerateWorkflow = async (wf: BlueprintV1WorkflowModule) => {
  try {
    const consoleWorkflow = await createWorkflowFromBlueprint({
      blueprintId: wf.workflow_id,
      name: wf.name,
    });
    
    // Save to localStorage
    saveWorkflow({
      workflow_id: consoleWorkflow.id,
      title: consoleWorkflow.name,
      status: 'draft',
      source: 'blueprint',
      // ... rest of fields
    });
    
    // Navigate to new workflow
    router.push(`/workflows/${consoleWorkflow.id}`);
  } catch (err) {
    console.error(err);
    showToast('Failed to generate workflow', 'error');
  }
};
```

### 2. `nextjs-console/app/workflows/page.tsx`

**Update workflow list rendering:**
```typescript
<div className={styles.wliTop}>
  <span className={styles.wliTitle}>{wf.title}</span>
  <div className={styles.wliBadges}>
    <span className={`${styles.sourceBadge} ${wf.source === 'n8n' ? styles.sourceN8n : styles.sourceBlueprint}`}>
      {wf.source === 'n8n' ? 'n8n' : 'Blueprint'}
    </span>
    <StatusBadge status={wf.status} />
  </div>
</div>
```

### 3. `nextjs-console/app/workflows/workflows.module.css`

**Add styles:**
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

### 4. `nextjs-console/hooks/useWorkflows.ts`

**Update SavedWorkflow interface:**
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
  blueprintId?: string  // Add
  n8nId?: string  // Add
}
```

---

## Optional: Compact Node UI

### Update `nextjs-console/components/workflow/WorkflowStepNode.tsx`

**Change node size:**
```typescript
const cardClassName = useMemo(
  () =>
    cn(
      'relative flex flex-col rounded-lg px-3 py-2 w-[160px] h-[160px]',
      'shadow-md border text-xs text-slate-100',
      'overflow-hidden',
      accentClasses,
      selected && 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900',
    ),
  [accentClasses, selected],
);
```

**Add text wrapping:**
```typescript
<div className="text-xs font-medium leading-tight line-clamp-2 break-words">
  {data.title}
</div>
```

---

## Testing Checklist

- [ ] Generate workflow from blueprint → navigates to /workflows/[id]
- [ ] Workflows list shows [n8n] and [Blueprint] badges
- [ ] Nodes appear as compact squares with wrapped text
- [ ] Save button syncs to n8n
- [ ] Execute button runs workflow
- [ ] Execution logs display in canvas

---

## Environment Setup

```bash
# Ensure these env vars are set
N8N_URL=http://your-selfhosted-n8n:5678
N8N_API_KEY=your-api-key
```

---

## Next Steps

1. Create the 3 new files
2. Modify the 4 existing files
3. Test each phase:
   - Phase 1: Blueprint generation
   - Phase 2: Source badges
   - Phase 3: Compact UI (optional)
   - Phase 4: n8n integration
4. Capture screenshots for verification

See `BLUEPRINT_WORKFLOW_COMPLETE_IMPLEMENTATION.md` for detailed implementation guide.
