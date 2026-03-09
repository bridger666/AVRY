# Dashboard Premium Styling - Requirements

## Overview
Transform the dashboard UI to match the homepage's premium card aesthetic, consolidating all styling into canonical files and eliminating the over-engineered separate premium files.

## Problem Statement
The dashboard currently uses basic dark cards that don't match the homepage's polished purple/warm-gray card design. Previous attempts created separate files (dashboard-premium.css, console-premium.html) instead of fixing the canonical files, leading to fragmentation and inconsistency.

## User Stories

### 1. Visual Consistency
**As a** user navigating between homepage and dashboard  
**I want** the dashboard cards to match the homepage aesthetic  
**So that** the experience feels cohesive and professional

**Acceptance Criteria:**
- Dashboard cards use same background: `rgba(255, 255, 255, 0.04)`
- Dashboard cards use same border: `1px solid rgba(255, 255, 255, 0.08)`
- Hover states match homepage: background `rgba(255, 255, 255, 0.07)`, border `rgba(255, 255, 255, 0.18)`
- Typography uses Inter Tight font with font-weight 300 for headings
- Teal accent color `#07d197` used for CTAs and highlights
- Main background is `#272728` (warm gray)

### 2. File Consolidation
**As a** developer maintaining the codebase  
**I want** all dashboard styles in canonical files  
**So that** there's a single source of truth without file proliferation

**Acceptance Criteria:**
- All dashboard styles consolidated into `frontend/dashboard.css`
- No separate `-premium`, `-v2`, or `-test` CSS files referenced
- `frontend/dashboard.html` references only canonical CSS files
- Homepage card styles from `frontend/styles.css` replicated in dashboard.css

### 3. Comprehensive Tab Coverage
**As a** user viewing different dashboard tabs  
**I want** all tabs to have consistent premium styling  
**So that** the experience is uniform across Overview, Diagnostic, Snapshot, and Blueprint tabs

**Acceptance Criteria:**
- Overview tab uses premium card styling
- Diagnostic tab uses premium card styling
- Snapshot tab uses premium card styling
- Blueprint tab uses premium card styling
- All render functions in dashboard.js updated

## Technical Constraints

1. **No New Files**: Do not create new CSS or HTML files
2. **Canonical Files Only**: Modify only:
   - `frontend/dashboard.html`
   - `frontend/dashboard.css`
   - `frontend/dashboard.js`
3. **Exact Homepage Styling**: Use exact values from `frontend/styles.css` `.use-case-card` class
4. **All Tabs**: Update ALL rendering functions, not just Overview

## Out of Scope

- Sidebar styling (already correct with teal highlights)
- Console styling (separate concern)
- Backend changes
- New features or functionality

## Success Metrics

- Dashboard cards visually match homepage cards in screenshots
- Only canonical files modified
- All 4 tabs (Overview, Diagnostic, Snapshot, Blueprint) have consistent styling
- No `-premium` or variant files remain in use
