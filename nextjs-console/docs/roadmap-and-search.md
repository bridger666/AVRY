# AI Roadmap

## Overview

AI Roadmap is a first-class tab in the Aivory Console at `/roadmap`. It generates a phased, actionable AI implementation plan with milestones and KPIs, built from your Diagnostic results and Blueprints.

## Entry Points

The roadmap can be generated from three places:

**1. Deep Diagnostic result page** (`/diagnostics/deep/result`)
- After completing a Deep Diagnostic, click "Generate AI Roadmap"
- Uses the diagnostic results as context
- Redirects to `/roadmap` on success

**2. Blueprint page** (`/blueprint`)
- Click "Generate Roadmap" in the blueprint header
- Uses the current blueprint + any available diagnostic data as context
- Redirects to `/roadmap` on success

**3. Roadmap page directly** (`/roadmap`)
- If no roadmap exists, the empty state shows a "Generate AI Roadmap" CTA
- Uses whatever diagnostic/blueprint data is available in localStorage
- Falls back to a generic template if no context is found

All three entry points call the same backend: `POST /api/roadmap/generate`.

## Data Model

```ts
type AiryRoadmap = {
  id: string;
  title: string;
  createdAt: string;
  source?: 'diagnostic' | 'blueprint' | 'direct';
  blueprintId?: string;
  phases: AiryRoadmapPhase[];
};

type AiryRoadmapPhase = {
  id: string;
  name: string;
  timeframe: string;
  description?: string;
  milestones: Array<{
    id: string;
    title: string;
    description?: string;
    linkedWorkflowIds?: string[];
  }>;
  kpis: Array<{
    id: string;
    label: string;
    target: string;
  }>;
};
```

Stored in `localStorage` under key `aivory_roadmap`. One active roadmap per tenant.

## Monetization

AI Roadmap is a one-time service. It can be bundled with Diagnostic + Blueprint for a complete AI strategy package. The UI shows a "One-time service" badge when a roadmap exists, and mentions bundling in the empty state. Billing hooks are not wired yet — the texts and buttons are in place for future Stripe integration.

## API

`POST /api/roadmap/generate`

Request body:
```json
{
  "source": "diagnostic" | "blueprint" | "direct",
  "blueprintId": "optional-blueprint-id",
  "diagnosticContext": { ...diagnostic result object },
  "blueprintContext": { ...blueprint object }
}
```

Response:
```json
{
  "success": true,
  "roadmap": { ...AiryRoadmap }
}
```

The route calls the VPS Bridge AI service to generate the roadmap. If the AI call fails, it falls back to a sensible 3-phase default roadmap.
