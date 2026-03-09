# n8n Integration — Ready for Implementation

## Status: ✅ Spec Complete & Ready

The complete specification for Aivory Workflow Tab ↔ n8n integration has been created and is ready for implementation.

## ⚠️ CRITICAL VPS CONTEXT

**n8n is running in Docker on VPS** — This affects implementation:

| Aspect | Detail |
|--------|--------|
| **Deployment** | Docker container on VPS (43.156.108.96) |
| **Database** | SQLite at `/home/node/.n8n/database.sqlite` (inside container) |
| **Access Method** | REST API only (NOT direct DB access) |
| **Public URL** | http://43.156.108.96:5678 (use this, not localhost) |
| **API Key** | Already in `.env.local` — use `process.env.N8N_API_KEY` |

**Implementation Rule**: Next.js server-side code fetches from public IP (43.156.108.96), not localhost.

## Quick Reference

**Spec File**: `nextjs-console/N8N_INTEGRATION_SPEC.md`

### Key Details
- **n8n URL**: http://43.156.108.96:5678 (public IP for server-side fetch)
- **API Base**: http://43.156.108.96:5678/api/v1
- **Workflow ID**: sdVzJXaKnmFQUUbo
- **Auth**: X-N8N-API-KEY (in `.env.local`)
- **API Key**: Already configured — use `process.env.N8N_API_KEY`
- **Deployment**: Docker container (not direct DB access)

### What's Included in Spec

1. **Architecture Overview** — Complete data flow diagram
2. **8 Implementation Tasks** — Prioritized with clear requirements
3. **Data Flow Diagrams** — Load, edit, activate workflows
4. **Error Handling Strategy** — Network, auth, timeout scenarios
5. **Security Checklist** — API key protection, validation
6. **Testing Checklist** — All scenarios to verify
7. **n8n REST API Reference** — All endpoints needed
8. **Implementation Order** — 3 phases (core → activation → bonus)

### Implementation Phases

**Phase 1 (Core Sync)** — P0 Priority
- n8n API client utility
- n8n ↔ ReactFlow mapper
- Workflow proxy route
- Update WorkflowCanvas component

**Phase 2 (Activation & Status)** — P1 Priority
- Activate/deactivate route
- Sync status indicator
- Update handlers

**Phase 3 (Bonus)** — P2 Priority
- Execution logs integration

### Files to Create/Modify

| File | Action |
|------|--------|
| `lib/n8n.ts` | CREATE |
| `lib/n8nMapper.ts` | CREATE |
| `app/api/n8n/workflow/[id]/route.ts` | CREATE |
| `app/api/n8n/workflow/[id]/activate/route.ts` | CREATE |
| `components/WorkflowCanvas.tsx` | MODIFY |
| `components/SyncStatus.tsx` | CREATE |
| `app/workflows/page.tsx` | MODIFY |
| `app/api/n8n/workflow/[id]/executions/route.ts` | CREATE (bonus) |

### Security Notes

✅ **API Key Protection**:
- Stays server-side only (never exposed to browser)
- All n8n calls go through Next.js API routes
- Uses `process.env.N8N_API_KEY` (already in `.env.local`)
- Do NOT hardcode or read from VPS

✅ **Network Configuration**:
- Use public IP: http://43.156.108.96:5678 (not localhost)
- Next.js server fetches from public IP
- n8n runs in Docker container on VPS
- REST API is the only access method (no direct DB access)

✅ **Validation**:
- Workflow ID validated against env var
- Same-origin check in API routes
- Server-side logging only (no sensitive data)

### Next Steps

1. Read `nextjs-console/N8N_INTEGRATION_SPEC.md` for full details
2. Start with Phase 1 tasks (core sync)
3. Follow implementation order for best results
4. Use testing checklist to verify each phase

---

## Environment Already Configured

```
N8N_BASE_URL=http://43.156.108.96:5678
N8N_API_KEY=<already set>
N8N_WORKFLOW_ID=sdVzJXaKnmFQUUbo
```

No additional setup needed — ready to implement!
