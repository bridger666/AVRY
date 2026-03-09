# Dashboard Premium Styling - Design Document

## Design Overview

This design consolidates dashboard styling into canonical files, applying homepage card aesthetics across all dashboard tabs without creating new files or variants.

## Architecture

### File Structure (Canonical Only)
```
frontend/
├── dashboard.html          # Main dashboard shell (canonical)
├── dashboard.css           # All dashboard styles (canonical)
├── dashboard.js            # Dashboard logic (canonical)
└── styles.css              # Homepage styles (reference source)
```

### Style Consolidation Strategy

1. **Extract from Homepage**: Copy `.use-case-card` styles from `styles.css`
2. **Adapt for Dashboard**: Create `.dashboard-card` class in `dashboard.css`
3. **Apply Universally**: Update all render functions to use new class

## Component Design

### 1. Dashboard Card Component

**CSS Class**: `.dashboard-card`

**Visual Specifications**:
- Background: `rgba(255, 255, 255, 0.04)`
- Border: `1px solid rgba(255, 255, 255, 0.08)`
- Border radius: `12px`
- Padding: `2rem`
- Transition: `all 0.25s ease`

**Hover State**:
- Background: `rgba(255, 255, 255, 0.07)`
- Border: `1px solid rgba(255, 255, 255, 0.18)`
- Transform: `translateY(-2px)`

**Typography**:
- Headings: `font-family: 'Inter Tight', sans-serif; font-weight: 300`
- Body: `color: rgba(255, 255, 255, 0.9)`
- Accent: `color: #07d197` (teal)

### 2. Stat Card Component

**CSS Class**: `.stat-card`

**Visual Specifications**:
- Inherits from `.dashboard-card`
- Display: `flex; flex-direction: column; gap: 0.5rem`
- Text alignment: `center`

**Elements**:
- `.stat-value`: Large number, teal color `#07d197`, font-weight 300
- `.stat-label`: Small label, `rgba(255, 255, 255, 0.8)`

### 3. Section Card Component

**CSS Class**: `.section-card`

**Visual Specifications**:
- Inherits from `.dashboard-card`
- Margin bottom: `1.5rem`

**Elements**:
- `.section-title`: Inter Tight, font-weight 300, size 1.5rem
- `.section-content`: Standard body text

## Implementation Plan

### Phase 1: CSS Consolidation

**File**: `frontend/dashboard.css`

**Actions**:
1. Add `.dashboard-card` base class with homepage styling
2. Add `.stat-card` extending dashboard-card
3. Add `.section-card` extending dashboard-card
4. Add typography classes for Inter Tight headings
5. Remove any references to dashboard-premium.css

### Phase 2: HTML Update

**File**: `frontend/dashboard.html`

**Actions**:
1. Remove `<link rel="stylesheet" href="dashboard-premium.css">` if present
2. Ensure only canonical CSS files are referenced:
   - `app-shell.css`
   - `dashboard.css`
   - `auth-modals.css`

### Phase 3: JavaScript Render Updates

**File**: `frontend/dashboard.js`

**Functions to Update**:
1. `renderOverviewTab()` - Apply `.dashboard-card` to all cards
2. `renderDiagnosticTab()` - Apply `.dashboard-card` to result cards
3. `renderSnapshotTab()` - Apply `.dashboard-card` to snapshot cards
4. `renderBlueprintTab()` - Apply `.dashboard-card` to blueprint sections

**Pattern**:
```javascript
// OLD (basic dark cards)
<div class="result-card">

// NEW (premium styling)
<div class="dashboard-card">
```

## Correctness Properties

### Property 1: Visual Consistency
**Specification**: All dashboard cards must have identical base styling to homepage cards

**Test Strategy**: Visual regression testing comparing dashboard cards to homepage `.use-case-card`

**Validation**:
- Background color matches: `rgba(255, 255, 255, 0.04)`
- Border matches: `1px solid rgba(255, 255, 255, 0.08)`
- Hover states match homepage behavior

### Property 2: File Canonicality
**Specification**: Only canonical files contain dashboard styles

**Test Strategy**: File system audit

**Validation**:
- `dashboard.html` references only: `app-shell.css`, `dashboard.css`, `auth-modals.css`
- No `-premium`, `-v2`, or `-test` files in use
- All styles in `dashboard.css`

### Property 3: Universal Tab Coverage
**Specification**: All 4 tabs render with premium card styling

**Test Strategy**: Tab navigation testing

**Validation**:
- Overview tab: All cards use `.dashboard-card`
- Diagnostic tab: All cards use `.dashboard-card`
- Snapshot tab: All cards use `.dashboard-card`
- Blueprint tab: All cards use `.dashboard-card`

## Testing Framework

**Framework**: Manual visual testing + browser DevTools inspection

**Test Files**: None (no new test files, use browser directly)

## Migration Notes

### Cleanup Required
1. Remove `frontend/dashboard-premium.css` from repository
2. Remove any references to premium CSS in HTML
3. Consolidate all premium styles into `dashboard.css`

### Backward Compatibility
- No breaking changes to functionality
- Pure visual enhancement
- Existing JavaScript logic unchanged

## Design Decisions

### Why Not Separate Premium File?
- **Reason**: Creates fragmentation and maintenance burden
- **Solution**: Single canonical CSS file with all styles

### Why Replicate Homepage Styles?
- **Reason**: Dashboard and homepage serve different purposes, need separate files
- **Solution**: Copy exact values to maintain consistency

### Why Update All Tabs?
- **Reason**: Partial updates create inconsistent UX
- **Solution**: Comprehensive update across all render functions

## Visual Reference

### Homepage Card (Source)
```css
.use-case-card {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 2rem;
}
```

### Dashboard Card (Target)
```css
.dashboard-card {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 2rem;
    transition: all 0.25s ease;
}

.dashboard-card:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.18);
    transform: translateY(-2px);
}
```
