# Aivory UX Mental Model - CRITICAL RULES

**Status**: ENFORCED - All future changes must follow these rules

---

## Core Principle

**Users should NEVER see or think in terms of:**
- "n8n Workflow Editor"
- "Open n8n"
- "Edit in n8n"
- "n8n Workflow ID"
- Any n8n branding or concepts

**For users, there is ONLY:**
- "Aivory Workflows" tab
- "Aivory Workflow Viewer / Editor"
- All operations are Aivory-branded

---

## The Mental Model

```
User's Perspective:
  ↓
  "I'm editing a workflow in Aivory"
  ↓
  (Internally: Aivory reads/writes to self-hosted n8n)
  ↓
  User doesn't know or care about n8n
  ↓
  n8n is completely hidden implementation detail
```

**Key Insight**: The Aivory Workflow Viewer **IS** the n8n editor. All edit/save/run actions happen INSIDE Aivory, in the existing workflow detail layout.

---

## The 5 Critical Rules

### RULE 1: Single UX Shell
**There must be exactly ONE main workflow UI shell:**

```
Aivory Workflows Page
├── Left: List of workflows
├── Top: Workflow name, status (Active/Draft/Archived), Save, etc.
└── Right: Main content area (editor)
```

**This shell is the ONLY place where workflows are viewed/edited.**

❌ DO NOT invent a separate "n8n Workflow Editor" page or header
❌ DO NOT create a separate top-level layout for n8n workflows
✅ DO embed WorkflowCanvas inside the existing shell

---

### RULE 2: Embed Editor, Don't Fork UX
**For workflows backed by n8n:**

✅ Embed `<WorkflowCanvas workflowId={id} />` INSIDE the existing workflow detail shell's main content area
❌ DO NOT create a new standalone layout with its own header saying "n8n Workflow Editor"
❌ DO NOT create its own back button or separate navigation

**Result**: Users see one cohesive Aivory interface, not two merged UIs

---

### RULE 3: Hide n8n Branding / Concepts
**User should NEVER see anything labeled 'n8n' in the UI:**

❌ NO "n8n Workflow Editor"
❌ NO "Open in n8n" button
❌ NO "n8n Workflow ID" labels
❌ NO "n8n" anywhere in visible UI

**Internally** you may have:
- `n8nId` variables
- `n8nWorkflow` types
- `/api/n8n/...` routes
- n8n logs and debugging

**Visually** the UX uses Aivory terminology:
- "Workflow", "Step", "Run", "Execution Logs"
- "Workflow Editor", "Workflow Viewer"
- "Save", "Sync", "Status"

---

### RULE 4: All Operations Controlled from Aivory
**All workflow operations must be controllable from Aivory:**

✅ Create from blueprint
✅ Edit steps (canvas + right panel)
✅ Save / sync
✅ Run / test execution
✅ View execution logs
✅ Change status (Active/Draft/Archived)

❌ DO NOT send users to the n8n UI
❌ DO NOT require users to open n8n dashboard
❌ DO NOT expose n8n concepts to users

**n8n is only an execution/engine layer**, not a user-facing interface.

---

### RULE 5: Decision Tree for Any Change
**When in doubt, follow this decision tree:**

```
Q1: Does this add a new page or header for 'n8n editor'?
    → If YES, stop. Integrate into existing Workflow detail instead.

Q2: Does the user see the word 'n8n' anywhere?
    → If YES, stop. Replace with Aivory terminology.

Q3: Does a workflow action require opening the n8n dashboard?
    → If YES, stop. Implement the trigger via /api/n8n/... routes
       and expose it as a button/menu inside the Workflow viewer.
```

---

## Implementation Pattern

### ✅ CORRECT: Embedded in Existing Layout
```tsx
// /workflows/[id]/page.tsx
if (isN8nWorkflow) {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.n8nWorkflowContainer}>
        {/* Header: same as blueprint workflows */}
        <div className={styles.n8nHeader}>
          <button>← Back to Workflows</button>
          <h1>Workflow Editor</h1>  {/* NOT "n8n Workflow Editor" */}
        </div>
        
        {/* Embedded editor */}
        <div className={styles.n8nCanvasWrapper}>
          <WorkflowCanvas workflowId={workflowId} />
        </div>
      </div>
    </div>
  )
}
```

### ❌ WRONG: Separate Page with n8n Branding
```tsx
// DO NOT DO THIS:
if (isN8nWorkflow) {
  return (
    <div className="n8nWorkflowEditorPage">
      <h1>n8n Workflow Editor</h1>  {/* ❌ WRONG */}
      <div>Canvas | Execution Logs | Show Raw JSON</div>  {/* ❌ WRONG */}
      <WorkflowCanvas workflowId={workflowId} />
    </div>
  )
}
```

---

## Terminology Guide

### ✅ Use These Terms
| Term | Context |
|------|---------|
| Workflow | Any workflow (blueprint or n8n-backed) |
| Workflow Editor | The editing interface |
| Workflow Viewer | The viewing interface |
| Step | Individual workflow step |
| Canvas | The visual editor area |
| Execution Logs | Workflow run history |
| Save | Persist changes |
| Sync | Synchronize with backend |
| Status | Active/Draft/Archived |
| Run | Execute the workflow |

### ❌ Never Use These Terms
| Term | Why |
|------|-----|
| n8n Workflow Editor | Exposes implementation detail |
| n8n Workflow ID | Exposes implementation detail |
| Open in n8n | Sends user to external tool |
| n8n Execution | Use "Execution" instead |
| n8n Step | Use "Step" instead |
| n8n Canvas | Use "Canvas" instead |

---

## Current Implementation Status

### ✅ COMPLIANT
- `app/workflows/[id]/page.tsx` - Embedded in existing layout
- `components/workflow/WorkflowCanvas.tsx` - No n8n branding visible
- `components/workflow/StepInspector.tsx` - Uses Aivory terminology
- `components/workflow/WorkflowStepNode.tsx` - Uses Aivory terminology
- Dev-only UI hidden in production

### ⚠️ NEEDS REVIEW
- Any new features touching workflows
- Any new buttons or menu items
- Any new pages or routes

### ❌ VIOLATIONS TO AVOID
- Creating separate "n8n Workflow Editor" page
- Showing "n8n" text to users
- Sending users to n8n dashboard
- Creating separate navigation for n8n workflows

---

## Testing Checklist

When reviewing any workflow-related change:

- [ ] No "n8n" text visible to users
- [ ] No separate page for n8n workflows
- [ ] All operations work from Aivory UI
- [ ] Header/navigation consistent with blueprint workflows
- [ ] Back button works correctly
- [ ] No "Open in n8n" buttons
- [ ] No "n8n Workflow ID" labels
- [ ] All terminology is Aivory-branded

---

## Examples of Correct Implementation

### Example 1: Edit a Step
```
User sees:
  "Edit Step"
  "What happens" (textarea)
  "Tool / service used" (input)
  "What this produces" (textarea)
  "Save Changes" button

NOT:
  "Edit n8n Step"
  "n8n Node Configuration"
  "n8n API Settings"
```

### Example 2: View Execution Logs
```
User sees:
  "Execution Logs"
  Table with: ID, Status, Started, Stopped

NOT:
  "n8n Execution Logs"
  "n8n Execution History"
  "n8n Run Details"
```

### Example 3: Change Workflow Status
```
User sees:
  Dropdown: "Active" / "Draft" / "Archived"
  Button: "Save changes"

NOT:
  "Activate in n8n"
  "Deploy to n8n"
  "n8n Status"
```

---

## Future Development Guidelines

### When Adding New Features:
1. **Ask**: "Will users see n8n mentioned?"
   - If YES → Rename to Aivory terminology
2. **Ask**: "Does this require a separate page?"
   - If YES → Integrate into existing workflow detail
3. **Ask**: "Does this send users to n8n?"
   - If YES → Implement via Aivory API instead

### When Fixing Bugs:
1. **Check**: Is n8n branding visible?
   - If YES → Remove it
2. **Check**: Is there a separate n8n page?
   - If YES → Merge into existing layout
3. **Check**: Are users sent to n8n?
   - If YES → Implement in Aivory instead

---

## Summary

**The Golden Rule**: 
> Users should never know n8n exists. They should only see "Aivory Workflows" and think they're editing workflows in Aivory. n8n is a completely hidden implementation detail.

**All future changes must follow this principle.**

---

**Effective Date**: March 6, 2026
**Status**: ENFORCED
**Violations**: ZERO TOLERANCE
