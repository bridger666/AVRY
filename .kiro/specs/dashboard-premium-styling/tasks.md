# Dashboard Premium Styling - Implementation Tasks

## Task 1: Add Premium Card Styles to dashboard.css
**Status**: [ ]  
**Description**: Add homepage-inspired card styles to the canonical dashboard.css file

**Details**:
- Open `frontend/dashboard.css`
- Add `.dashboard-card` base class with exact homepage styling:
  - Background: `rgba(255, 255, 255, 0.04)`
  - Border: `1px solid rgba(255, 255, 255, 0.08)`
  - Border radius: `12px`
  - Padding: `2rem`
  - Transition: `all 0.25s ease`
- Add `.dashboard-card:hover` state:
  - Background: `rgba(255, 255, 255, 0.07)`
  - Border: `rgba(255, 255, 255, 0.18)`
  - Transform: `translateY(-2px)`
- Add `.stat-card` extending dashboard-card for stat displays
- Add `.section-card` extending dashboard-card for content sections
- Add typography classes for Inter Tight headings

**Acceptance Criteria**:
- All card classes added to dashboard.css
- Styles match homepage `.use-case-card` exactly
- No new CSS files created

## Task 2: Remove Premium CSS Reference from dashboard.html
**Status**: [ ]  
**Description**: Clean up dashboard.html to reference only canonical CSS files

**Details**:
- Open `frontend/dashboard.html`
- Check for any reference to `dashboard-premium.css`
- If found, remove the `<link>` tag
- Verify only canonical CSS files remain:
  - `app-shell.css`
  - `dashboard.css`
  - `auth-modals.css`

**Acceptance Criteria**:
- No reference to dashboard-premium.css
- Only canonical CSS files linked
- HTML structure unchanged

## Task 3: Update Overview Tab Rendering
**Status**: [ ]  
**Description**: Update renderOverviewTab() function to use premium card styling

**Details**:
- Open `frontend/dashboard.js`
- Locate `renderOverviewTab()` function
- Replace all card class names with `.dashboard-card`
- Update stat displays to use `.stat-card`
- Update section containers to use `.section-card`
- Ensure headings use Inter Tight font classes

**Acceptance Criteria**:
- All cards in Overview tab use `.dashboard-card`
- Stat cards use `.stat-card`
- Visual consistency with homepage

## Task 4: Update Diagnostic Tab Rendering
**Status**: [ ]  
**Description**: Update renderDiagnosticTab() function to use premium card styling

**Details**:
- Open `frontend/dashboard.js`
- Locate `renderDiagnosticTab()` function
- Replace all result card class names with `.dashboard-card`
- Update any stat displays to use `.stat-card`
- Update section containers to use `.section-card`

**Acceptance Criteria**:
- All cards in Diagnostic tab use `.dashboard-card`
- Consistent styling with Overview tab

## Task 5: Update Snapshot Tab Rendering
**Status**: [ ]  
**Description**: Update renderSnapshotTab() function to use premium card styling

**Details**:
- Open `frontend/dashboard.js`
- Locate `renderSnapshotTab()` function
- Replace all snapshot card class names with `.dashboard-card`
- Update any stat displays to use `.stat-card`
- Update section containers to use `.section-card`

**Acceptance Criteria**:
- All cards in Snapshot tab use `.dashboard-card`
- Consistent styling with other tabs

## Task 6: Update Blueprint Tab Rendering
**Status**: [ ]  
**Description**: Update renderBlueprintTab() function to use premium card styling

**Details**:
- Open `frontend/dashboard.js`
- Locate `renderBlueprintTab()` function
- Replace all blueprint section class names with `.dashboard-card`
- Update any stat displays to use `.stat-card`
- Update section containers to use `.section-card`

**Acceptance Criteria**:
- All cards in Blueprint tab use `.dashboard-card`
- Consistent styling with other tabs

## Task 7: Visual Verification
**Status**: [ ]  
**Description**: Verify all tabs display with premium styling matching homepage

**Details**:
- Open dashboard in browser
- Navigate through all 4 tabs: Overview, Diagnostic, Snapshot, Blueprint
- Compare card styling to homepage cards
- Verify hover states work correctly
- Check typography uses Inter Tight
- Verify teal accent color on CTAs

**Acceptance Criteria**:
- All tabs visually match homepage card aesthetic
- Hover states work on all cards
- Typography consistent across all tabs
- No visual regressions

## Task 8: Cleanup Premium Files
**Status**: [ ]  
**Description**: Remove unused premium variant files from repository

**Details**:
- Check if `frontend/dashboard-premium.css` exists
- If exists, delete the file
- Check for any other `-premium`, `-v2`, or `-test` dashboard files
- Remove any found variant files
- Update any documentation referencing premium files

**Acceptance Criteria**:
- `dashboard-premium.css` removed if it exists
- No variant dashboard files remain
- Only canonical files in use
