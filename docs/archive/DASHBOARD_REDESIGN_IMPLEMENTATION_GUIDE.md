# Dashboard UI Redesign - Implementation Guide

**Quick Start Guide for Developers**

This guide provides step-by-step instructions for implementing the dashboard redesign. Follow the phases in order for a smooth transition.

---

## Prerequisites

- Familiarity with CSS custom properties (CSS variables)
- Understanding of CSS Grid and Flexbox
- Knowledge of accessibility best practices
- Access to the Aivory codebase

---

## Phase 1: Foundation (Week 1-2)

### Step 1.1: Update Design System CSS

**File:** `frontend/design-system.css`

Replace the existing color variables with the new palette:

```css
:root {
    /* Background Layers */
    --bg-primary: #1a1a24;
    --bg-secondary: #20202b;
    --bg-tertiary: #2a2a38;
    
    /* Text Colors (WCAG AA Compliant) */
    --text-primary: rgba(255, 255, 255, 0.95);
    --text-secondary: rgba(255, 255, 255, 0.85);
    --text-tertiary: rgba(255, 255, 255, 0.65);
    --text-disabled: rgba(255, 255, 255, 0.38);
    
    /* Brand Colors */
    --brand-purple: #5b3cc4;
    --brand-purple-hover: #6d4dd6;
    --mint-green: #0ae8af;
    --mint-green-hover: #1cffbf;
    
    /* Semantic Colors */
    --success: #0ae8af;
    --warning: #ffb020;
    --error: #ff5757;
    --info: #4d9eff;
    
    /* Border Colors */
    --border-subtle: rgba(255, 255, 255, 0.08);
    --border-default: rgba(255, 255, 255, 0.12);
    --border-strong: rgba(255, 255, 255, 0.20);
    --border-accent: var(--mint-green);
}
```

### Step 1.2: Update Typography Scale

Add to `design-system.css`:

```css
:root {
    /* Font Sizes */
    --text-xs: 0.75rem;
    --text-sm: 0.875rem;
    --text-base: 1rem;
    --text-lg: 1.125rem;
    --text-xl: 1.25rem;
    --text-2xl: 1.5rem;
    --text-3xl: 1.875rem;
    --text-4xl: 2.25rem;
    
    /* Font Weights */
    --weight-light: 300;
    --weight-regular: 400;
    --weight-medium: 500;
    --weight-semibold: 600;
    --weight-bold: 700;
    
    /* Line Heights */
    --leading-tight: 1.25;
    --leading-snug: 1.375;
    --leading-normal: 1.5;
    --leading-relaxed: 1.625;
}
```

### Step 1.3: Update Spacing System

Add to `design-system.css`:

```css
:root {
    /* Spacing (8px base grid) */
    --space-0: 0;
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-8: 32px;
    --space-10: 40px;
    --space-12: 48px;
    --space-16: 64px;
}
```

### Step 1.4: Update Border Radius System

Add to `design-system.css`:

```css
:root {
    /* Border Radius */
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-full: 9999px;
}
```

### Step 1.5: Add Shadow System

Add to `design-system.css`:

```css
:root {
    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.4);
    --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.5);
    --shadow-glow: 0 0 20px rgba(10, 232, 175, 0.3);
}
```

### Step 1.6: Update Base Styles

Update body background in `design-system.css`:

```css
body {
    font-family: var(--font-family);
    font-weight: var(--weight-regular);
    background: var(--bg-primary);  /* Changed from #20202b */
    color: var(--text-primary);
    min-height: 100vh;
}
```

---

## Phase 2: Layout Restructure (Week 3-4)

### Step 2.1: Create Profile Dropdown Component

**File:** `frontend/components/profile-dropdown.html`

```html
<div class="profile-dropdown">
    <button class="profile-trigger" id="profileTrigger">
        <span class="profile-avatar">JD</span>
        <span class="profile-name">John Doe</span>
        <svg class="profile-chevron" width="16" height="16" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
    </button>
    
    <div class="profile-menu" id="profileMenu" hidden>
        <div class="profile-header">
            <div class="profile-info">
                <div class="profile-name-full">John Doe</div>
                <div class="profile-email">john@company.com</div>
            </div>
        </div>
        
        <div class="profile-divider"></div>
        
        <div class="profile-tier">
            <span class="badge badge-tier">Enterprise</span>
        </div>
        
        <div class="profile-credits">
            <div class="credits-label">Credits</div>
            <div class="credits-value">39 / 2000</div>
            <div class="credits-bar">
                <div class="credits-fill" style="width: 2%"></div>
            </div>
            <div class="credits-warning">⚠️ Low balance</div>
        </div>
        
        <button class="btn btn-primary btn-sm">Add Credits</button>
        
        <div class="profile-divider"></div>
        
        <a href="#" class="profile-menu-item">
            <svg width="16" height="16"><!-- Settings icon --></svg>
            Settings
        </a>
        <a href="#" class="profile-menu-item">
            <svg width="16" height="16"><!-- Billing icon --></svg>
            Billing
        </a>
        <a href="#" class="profile-menu-item">
            <svg width="16" height="16"><!-- Docs icon --></svg>
            Documentation
        </a>
        
        <div class="profile-divider"></div>
        
        <a href="#" class="profile-menu-item profile-menu-item-danger">
            <svg width="16" height="16"><!-- Logout icon --></svg>
            Logout
        </a>
    </div>
</div>
```

**File:** `frontend/components/profile-dropdown.css`

```css
.profile-dropdown {
    position: relative;
}

.profile-trigger {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
}

.profile-trigger:hover {
    border-color: var(--border-strong);
    background: var(--bg-tertiary);
}

.profile-avatar {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    background: var(--mint-green);
    color: var(--bg-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--weight-semibold);
    font-size: var(--text-sm);
}

.profile-menu {
    position: absolute;
    top: calc(100% + var(--space-2));
    right: 0;
    width: 280px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    padding: var(--space-4);
    z-index: 1000;
}

.profile-menu[hidden] {
    display: none;
}

.profile-header {
    margin-bottom: var(--space-3);
}

.profile-name-full {
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    color: var(--text-primary);
}

.profile-email {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
}

.profile-credits {
    margin: var(--space-3) 0;
}

.credits-label {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.credits-value {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: var(--space-1) 0;
}

.credits-bar {
    height: 8px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-full);
    overflow: hidden;
    margin: var(--space-2) 0;
}

.credits-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--mint-green), var(--brand-purple));
    transition: width 0.3s ease;
}

.credits-warning {
    font-size: var(--text-xs);
    color: var(--warning);
    display: flex;
    align-items: center;
    gap: var(--space-1);
}

.profile-menu-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    color: var(--text-secondary);
    text-decoration: none;
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
}

.profile-menu-item:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
}

.profile-menu-item-danger {
    color: var(--error);
}

.profile-divider {
    height: 1px;
    background: var(--border-subtle);
    margin: var(--space-3) 0;
}
```



### Step 2.2: Update Sidebar to Collapsible Design

**File:** `frontend/dashboard-layout.css`

Update the sidebar styles:

```css
/* Sidebar - Collapsed State (Default) */
.dashboard-sidebar {
    grid-area: sidebar;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-default);
    padding: var(--space-3) 0;
    position: sticky;
    top: 60px;
    height: calc(100vh - 60px);
    overflow-y: auto;
    width: 64px;  /* Collapsed width */
    transition: width 0.3s ease;
}

.dashboard-sidebar.expanded {
    width: 220px;  /* Expanded width */
}

/* Sidebar Navigation Items */
.sidebar-nav-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    color: var(--text-secondary);
    text-decoration: none;
    font-size: var(--text-sm);
    transition: all 0.2s ease;
    cursor: pointer;
    border-left: 3px solid transparent;
    position: relative;
}

/* Hide text in collapsed state */
.dashboard-sidebar:not(.expanded) .sidebar-nav-item span:not(.sidebar-nav-icon) {
    display: none;
}

/* Show tooltip on hover in collapsed state */
.dashboard-sidebar:not(.expanded) .sidebar-nav-item::after {
    content: attr(data-tooltip);
    position: absolute;
    left: calc(100% + var(--space-2));
    background: var(--bg-tertiary);
    color: var(--text-primary);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-md);
    font-size: var(--text-xs);
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
    z-index: 100;
}

.dashboard-sidebar:not(.expanded) .sidebar-nav-item:hover::after {
    opacity: 1;
}

/* Active state */
.sidebar-nav-item.active {
    background: var(--bg-tertiary);
    color: var(--mint-green);
    border-left-color: var(--mint-green);
}

.sidebar-nav-item:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
}

/* Toggle button */
.sidebar-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-2);
    margin: var(--space-3) var(--space-2);
    background: transparent;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all 0.2s ease;
}

.sidebar-toggle:hover {
    background: var(--bg-tertiary);
    border-color: var(--border-strong);
    color: var(--text-primary);
}

/* Section titles */
.sidebar-section-title {
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: var(--space-4);
}

.dashboard-sidebar:not(.expanded) .sidebar-section-title {
    display: none;
}
```

**File:** `frontend/sidebar-toggle.js`

```javascript
// Sidebar toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.dashboard-sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    
    // Load saved state
    const isExpanded = localStorage.getItem('sidebar-expanded') === 'true';
    if (isExpanded) {
        sidebar.classList.add('expanded');
    }
    
    // Toggle on click
    toggleBtn?.addEventListener('click', () => {
        sidebar.classList.toggle('expanded');
        const expanded = sidebar.classList.contains('expanded');
        localStorage.setItem('sidebar-expanded', expanded);
    });
});
```

### Step 2.3: Update Right Panel Cards

**File:** `frontend/console.css` (or relevant dashboard CSS)

Update the context section styles:

```css
/* Compact Context Cards */
.context-section {
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-4);  /* Reduced from var(--space-6) */
    transition: all 0.2s ease;
    margin-bottom: var(--space-3);  /* Reduced gap */
}

.context-section:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-md);
}

.context-section h3 {
    font-size: var(--text-sm);  /* Smaller */
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-3) 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* Compact stats */
.context-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-2) 0;  /* Reduced */
    font-size: var(--text-sm);  /* Smaller */
}

.context-label {
    color: var(--text-secondary);
    font-size: var(--text-xs);  /* Smaller */
}

.context-value {
    color: var(--text-primary);
    font-weight: var(--weight-medium);
    font-size: var(--text-sm);
}

/* Compact workflow list */
.workflow-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);  /* Reduced */
    margin-top: var(--space-2);
}

.workflow-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);  /* Reduced */
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);  /* Smaller */
    transition: all 0.2s ease;
}

.workflow-item:hover {
    background: rgba(255, 255, 255, 0.08);
}

.workflow-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.workflow-status.active {
    background: var(--success);
    box-shadow: 0 0 8px var(--success);
}

.workflow-status.idle {
    background: var(--text-tertiary);
}

/* Compact execution list */
.execution-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);  /* Reduced */
    margin-top: var(--space-2);
}

.execution-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);  /* Reduced */
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
    font-size: var(--text-sm);  /* Smaller */
}

.execution-item:hover {
    background: rgba(255, 255, 255, 0.08);
}

.execution-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.execution-status.success {
    background: var(--success);
}

.execution-status.failed {
    background: var(--error);
}

.execution-name {
    font-size: var(--text-sm);
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
}

.execution-time {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    white-space: nowrap;
}
```

---

## Phase 3: Component Updates (Week 5-6)

### Step 3.1: Update Chat Message Bubbles

**File:** `frontend/console.css`

```css
/* Consistent message bubbles */
.message-bubble {
    display: flex;
    gap: var(--space-3);
    align-items: flex-start;
    animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.message-avatar {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-base);
    flex-shrink: 0;
    transition: all 0.2s ease;
}

.message-text {
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);  /* Consistent 12px */
    padding: var(--space-3) var(--space-4);
    color: var(--text-primary);
    line-height: var(--leading-normal);
    transition: all 0.2s ease;
    font-size: var(--text-base);
}

.message-text:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-md);
}

/* User message styling */
.user-message .message-avatar {
    background: var(--brand-purple);
    border-color: var(--brand-purple);
    color: white;
}

/* AI message styling */
.ai-message .message-avatar {
    background: var(--mint-green);
    border-color: var(--mint-green);
    color: var(--bg-primary);
}
```

### Step 3.2: Update Input Bar

**File:** `frontend/console.css`

```css
/* Improved input bar */
.console-input-bar {
    border-top: 1px solid var(--border-default);
    background: transparent;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
}

.input-row {
    display: flex;
    gap: var(--space-2);
    align-items: flex-end;
}

.input-btn {
    width: 48px;  /* Larger */
    height: 48px;
    border: 1px solid var(--border-default);
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    color: var(--text-secondary);
    font-size: var(--text-lg);
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.input-btn:hover {
    background: var(--bg-tertiary);
    border-color: var(--border-strong);
    color: var(--mint-green);
    transform: translateY(-1px);
}

.message-input {
    flex: 1;
    min-height: 48px;  /* Comfortable height */
    max-height: 200px;
    padding: var(--space-3) var(--space-4);
    background: var(--bg-secondary);
    border: 2px solid var(--border-default);  /* Thicker border */
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    font-family: var(--font-primary);
    font-size: var(--text-base);
    font-weight: var(--weight-regular);
    resize: none;
    transition: all 0.2s ease;
}

.message-input:focus {
    outline: none;
    border-color: var(--mint-green);
    box-shadow: 0 0 0 3px rgba(10, 232, 175, 0.1);
    background: var(--bg-tertiary);
}

.message-input::placeholder {
    color: var(--text-tertiary);
}

.input-btn-send {
    padding: var(--space-3) var(--space-6);
    background: var(--mint-green);  /* Prominent accent color */
    border: none;
    border-radius: var(--radius-lg);
    color: var(--bg-primary);
    font-family: var(--font-primary);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.input-btn-send:hover:not(:disabled) {
    background: var(--mint-green-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-glow);
}

.input-btn-send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

/* Quick actions below input */
.input-quick-actions {
    display: flex;
    gap: var(--space-4);
    justify-content: center;
}

.quick-action-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    background: transparent;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    color: var(--text-tertiary);
    font-size: var(--text-xs);
    cursor: pointer;
    transition: all 0.2s ease;
}

.quick-action-btn:hover {
    background: var(--bg-tertiary);
    border-color: var(--border-default);
    color: var(--text-secondary);
}
```

---

## Phase 4: Accessibility & Polish (Week 7-8)

### Step 4.1: Add Focus Indicators

**File:** `frontend/design-system.css`

```css
/* Focus indicators for accessibility */
*:focus-visible {
    outline: 2px solid var(--mint-green);
    outline-offset: 2px;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
textarea:focus-visible {
    box-shadow: 0 0 0 3px rgba(10, 232, 175, 0.2);
}

/* Remove default outline */
*:focus {
    outline: none;
}
```

### Step 4.2: Add Skip Navigation

**File:** Add to top of `console.html` and other dashboard pages

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

**File:** `frontend/design-system.css`

```css
.skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--mint-green);
    color: var(--bg-primary);
    padding: var(--space-2) var(--space-4);
    text-decoration: none;
    font-weight: var(--weight-semibold);
    z-index: 100;
}

.skip-link:focus {
    top: 0;
}
```

### Step 4.3: Add ARIA Labels

Update HTML elements with proper ARIA labels:

```html
<!-- Sidebar navigation -->
<nav class="sidebar-nav" aria-label="Main navigation">
    <a href="dashboard.html" class="sidebar-nav-item" aria-label="Overview">
        <span class="sidebar-nav-icon" aria-hidden="true">📊</span>
        <span>Overview</span>
    </a>
    <!-- ... -->
</nav>

<!-- Profile dropdown -->
<button class="profile-trigger" 
        id="profileTrigger" 
        aria-expanded="false"
        aria-haspopup="true"
        aria-label="User profile menu">
    <!-- ... -->
</button>

<!-- Input buttons -->
<button class="input-btn" 
        id="uploadBtn" 
        aria-label="Upload file">
    <!-- Icon -->
</button>
```

### Step 4.4: Add Reduced Motion Support

**File:** `frontend/design-system.css`

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}
```

---

## Testing Checklist

### Visual Testing
- [ ] Test in Chrome, Firefox, Safari, Edge
- [ ] Test on mobile devices (iOS, Android)
- [ ] Test at different screen sizes (320px, 768px, 1024px, 1920px)
- [ ] Verify all colors meet WCAG AA contrast ratios
- [ ] Check hover states on all interactive elements
- [ ] Verify focus indicators are visible

### Functional Testing
- [ ] Sidebar collapse/expand works
- [ ] Profile dropdown opens/closes
- [ ] All navigation links work
- [ ] Chat input and send button work
- [ ] File upload works
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces all elements correctly

### Performance Testing
- [ ] Page load time < 2 seconds
- [ ] Time to interactive < 3 seconds
- [ ] Lighthouse score > 90
- [ ] No layout shifts (CLS < 0.1)
- [ ] Smooth animations (60fps)

### Accessibility Testing
- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Test with browser zoom at 200%
- [ ] Test with high contrast mode
- [ ] Verify all images have alt text
- [ ] Verify all forms have labels

---

## Deployment

### Pre-Deployment
1. Run full test suite
2. Get stakeholder approval
3. Create backup of current production
4. Prepare rollback plan

### Deployment Steps
1. Deploy to staging environment
2. Run smoke tests
3. Get final approval
4. Deploy to production
5. Monitor for errors
6. Collect user feedback

### Post-Deployment
1. Monitor analytics for usage patterns
2. Track error rates
3. Collect user feedback
4. Plan iteration based on feedback

---

## Support & Resources

### Documentation
- Full spec: `DASHBOARD_UI_REDESIGN_SPEC.md`
- Visual guide: `DASHBOARD_REDESIGN_VISUAL_GUIDE.md`
- This implementation guide

### Tools
- Color contrast checker: https://webaim.org/resources/contrastchecker/
- Accessibility checker: https://wave.webaim.org/
- Lighthouse: Built into Chrome DevTools

### Questions?
Contact the design team or refer to the specification documents.

---

**Good luck with the implementation!**
