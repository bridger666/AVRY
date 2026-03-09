# Dashboard Redesign - Quick Reference Card

**For Developers: Keep this handy while implementing!**

---

## Color Palette

```css
/* Backgrounds */
--bg-primary: #1a1a24;
--bg-secondary: #20202b;
--bg-tertiary: #2a2a38;

/* Text */
--text-primary: rgba(255, 255, 255, 0.95);
--text-secondary: rgba(255, 255, 255, 0.85);
--text-tertiary: rgba(255, 255, 255, 0.65);

/* Brand */
--brand-purple: #5b3cc4;
--mint-green: #0ae8af;

/* Semantic */
--success: #0ae8af;
--warning: #ffb020;
--error: #ff5757;
--info: #4d9eff;

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.08);
--border-default: rgba(255, 255, 255, 0.12);
--border-strong: rgba(255, 255, 255, 0.20);
```

---

## Typography

```css
/* Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Weights */
--weight-light: 300;
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

---

## Spacing (8px Grid)

```css
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
```

---

## Border Radius

```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

---

## Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.4);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.5);
--shadow-glow: 0 0 20px rgba(10, 232, 175, 0.3);
```

---

## Component Sizes

### Sidebar
- Collapsed: 64px
- Expanded: 220px

### Header
- Height: 60px

### Avatars
- Small: 24px
- Default: 32px
- Large: 40px

### Buttons
- Height: 48px
- Padding: 12px 24px

### Input Fields
- Min height: 48px
- Padding: 12px 16px

### Cards
- Padding: 16px (compact)
- Padding: 24px (default)

---

## Common Patterns

### Card
```css
.card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    transition: all 0.2s ease;
}

.card:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-md);
}
```

### Button Primary
```css
.btn-primary {
    background: var(--mint-green);
    color: var(--bg-primary);
    padding: var(--space-3) var(--space-6);
    border-radius: var(--radius-lg);
    font-weight: var(--weight-semibold);
    transition: all 0.2s ease;
}

.btn-primary:hover {
    background: var(--mint-green-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-glow);
}
```

### Input Field
```css
.input {
    min-height: 48px;
    padding: var(--space-3) var(--space-4);
    background: var(--bg-secondary);
    border: 2px solid var(--border-default);
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    font-size: var(--text-base);
    transition: all 0.2s ease;
}

.input:focus {
    border-color: var(--mint-green);
    box-shadow: 0 0 0 3px rgba(10, 232, 175, 0.1);
}
```

### Badge
```css
.badge {
    display: inline-flex;
    align-items: center;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    text-transform: uppercase;
}

.badge-success {
    background: rgba(10, 232, 175, 0.15);
    color: var(--success);
}
```

---

## Accessibility Checklist

### Must-Have
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] Touch targets ≥ 44x44px
- [ ] Focus indicators visible
- [ ] Keyboard navigation works
- [ ] ARIA labels on icons
- [ ] Alt text on images
- [ ] Semantic HTML structure

### Focus Indicator
```css
*:focus-visible {
    outline: 2px solid var(--mint-green);
    outline-offset: 2px;
}

button:focus-visible {
    box-shadow: 0 0 0 3px rgba(10, 232, 175, 0.2);
}
```

---

## Animation Guidelines

### Duration
- Micro: 100-200ms (hover, focus)
- Normal: 200-300ms (modals, dropdowns)
- Slow: 300-500ms (page transitions)

### Easing
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

---

## Responsive Breakpoints

```css
--breakpoint-sm: 640px;   /* Mobile */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
```

---

## Common Mistakes to Avoid

❌ **Don't:**
- Use arbitrary spacing values
- Mix px and rem inconsistently
- Forget hover/focus states
- Skip ARIA labels on icons
- Use color alone to convey info
- Create touch targets < 44px
- Forget to test keyboard nav

✅ **Do:**
- Use CSS variables consistently
- Follow the 8px spacing grid
- Add transitions to interactive elements
- Include proper ARIA attributes
- Use semantic HTML
- Test with screen readers
- Support reduced motion

---

## Testing Commands

```bash
# Run Lighthouse
npm run lighthouse

# Check accessibility
npm run a11y

# Test contrast
npm run contrast-check

# Run all tests
npm test
```

---

## Useful Links

- Full Spec: `DASHBOARD_UI_REDESIGN_SPEC.md`
- Visual Guide: `DASHBOARD_REDESIGN_VISUAL_GUIDE.md`
- Implementation: `DASHBOARD_REDESIGN_IMPLEMENTATION_GUIDE.md`
- Summary: `DASHBOARD_REDESIGN_SUMMARY.md`

---

**Print this and keep it at your desk! 📌**
