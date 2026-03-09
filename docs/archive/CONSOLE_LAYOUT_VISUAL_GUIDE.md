# Console Layout Visual Guide

## Before vs After

### BEFORE: Inner Container Scroll ❌

```
┌─────────────────────────────────────────────────────────┐
│ Browser Window                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Sidebar │ ┌─────────────────────────────────────┐  │ │
│ │         │ │ Header                              │  │ │
│ │         │ ├─────────────────────────────────────┤  │ │
│ │         │ │ ┌─────────────────────────────────┐ │  │ │
│ │         │ │ │ Messages (overflow: auto)       │ │  │ │
│ │         │ │ │ - AI Message                    │ │  │ │
│ │         │ │ │ - User Message                  │ │  │ │
│ │         │ │ │ - AI Message                    │ │  │ │
│ │         │ │ │ ...                             │ │  │ │
│ │         │ │ │ [INNER SCROLLBAR] ◄─────────────┼─┼──┼─ Problem!
│ │         │ │ └─────────────────────────────────┘ │  │ │
│ │         │ │                                     │  │ │
│ │         │ │ Input Bar (sometimes hidden)       │  │ │
│ │         │ └─────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

Issues:
- Inner scrollbar confusing
- Input bar scrolls out of view
- New messages hidden below fold
- Sidebar hover overlaps content
```

### AFTER: Page-Level Scroll ✅

```
┌─────────────────────────────────────────────────────────┐
│ Browser Window                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Sidebar │ Header (sticky top)                       │ │
│ │ (sticky)│ ┌─────────────────────────────────────┐   │ │
│ │         │ │ Messages (overflow: visible)        │   │ │
│ │         │ │ - AI Message                        │   │ │
│ │         │ │ - User Message                      │   │ │
│ │         │ │ - AI Message                        │   │ │
│ │         │ │ - User Message                      │   │ │
│ │         │ │ - AI Message                        │   │ │
│ │         │ │ ...                                 │   │ │
│ │         │ │ (content grows downward)            │   │ │
│ │         │ └─────────────────────────────────────┘   │ │
│ │         │ ┌─────────────────────────────────────┐   │ │
│ │         │ │ Input Bar (sticky bottom)           │   │ │
│ │         │ │ [Always visible] ◄──────────────────┼───┼─ Fixed!
│ │         │ └─────────────────────────────────────┘   │ │
│ └─────────────────────────────────────────────────────┘ │
│ [BROWSER SCROLLBAR] ◄───────────────────────────────────┼─ Only scrollbar
└─────────────────────────────────────────────────────────┘

Benefits:
✅ Only browser scrollbar
✅ Input always visible
✅ New messages auto-scroll into view
✅ Sidebar never overlaps
✅ Natural, familiar UX
```

## Layout Structure

### Component Hierarchy

```
.console-layout (flex container)
├── .dashboard-sidebar (sticky, 260px, left)
│   ├── Navigation items
│   └── Settings
│
└── .console-main (flex: 1, column)
    ├── .thread-header (sticky top, optional)
    │   ├── Title
    │   └── Actions (Clear, System)
    │
    ├── .thread-messages (flex: 1, grows)
    │   ├── .ai-message
    │   │   └── .message-bubble (max-width: 780px, centered)
    │   │       ├── .message-avatar
    │   │       └── .message-content
    │   │           ├── .message-text
    │   │           └── .message-timestamp
    │   │
    │   └── .user-message
    │       └── .message-bubble (right-aligned, 70% max)
    │
    └── .chat-input-wrapper (sticky bottom)
        └── .chat-input-bar (max-width: 780px, centered)
            ├── .chat-textarea
            └── .chat-input-actions
                ├── .actions-left (attach menu)
                └── .actions-right (send button)
```

## Message Styles

### AI Message (Left-Aligned, Flat)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌──┐  Welcome to Aivory AI Console.                   │
│  │AI│                                                   │
│  └──┘  I can help you with three things:               │
│        1. Identify automation gaps                      │
│        2. Map AI system architecture                    │
│        3. Get deployment-ready blueprint                │
│                                                         │
│        What does your business struggle to automate?    │
│                                                         │
│        12:34 PM                                         │
└─────────────────────────────────────────────────────────┘
```

### User Message (Right-Aligned, Bubble)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    ┌────────────────────────────────┐   │
│                    │ I need help automating our     │   │
│                    │ customer support workflow.     │   │
│                    │                                │   │
│                    │ 12:35 PM                  ┌──┐ │   │
│                    └───────────────────────────│👤│─┘   │
│                                                └──┘     │
└─────────────────────────────────────────────────────────┘
```

### Code Block with Language Label

```
┌─────────────────────────────────────────────────────────┐
│  ┌──┐  Here's a sample workflow:                        │
│  │AI│                                                    │
│  └──┘  ┌────────────────────────────────────────────┐   │
│        │ json                                       │   │
│        ├────────────────────────────────────────────┤   │
│        │ {                                          │   │
│        │   "workflow": "customer_support",          │   │
│        │   "trigger": "email_received",             │   │
│        │   "steps": [...]                           │   │
│        │ }                                          │   │
│        └────────────────────────────────────────────┘   │
│                                                         │
│        12:36 PM                                         │
└─────────────────────────────────────────────────────────┘
```

### Table Rendering

```
┌─────────────────────────────────────────────────────────┐
│  ┌──┐  Here's a comparison:                             │
│  │AI│                                                    │
│  └──┘  ┌────────────────────────────────────────────┐   │
│        │ TIER      │ FEATURES      │ PRICE          │   │
│        ├───────────┼───────────────┼────────────────┤   │
│        │ Foundation│ Basic, 50 cr  │ $15/mo         │   │
│        │ Operator  │ Advanced, 300 │ $79/mo         │   │
│        │ Enterprise│ Custom, 2000  │ Custom         │   │
│        └────────────────────────────────────────────┘   │
│                                                         │
│        12:37 PM                                         │
└─────────────────────────────────────────────────────────┘
```

## Input Bar States

### Default State

```
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Ask me anything about workflows, logs, or AI...     │ │
│ └─────────────────────────────────────────────────────┘ │
│ [+]                                            [Send]   │
│ Press Enter to send, Shift+Enter for new line          │
└─────────────────────────────────────────────────────────┘
```

### Focus State (Cyan Glow)

```
┌─────────────────────────────────────────────────────────┐
│ ┌═════════════════════════════════════════════════════┐ │
│ ║ How do I integrate with Salesforce?│              ║ │
│ └═════════════════════════════════════════════════════┘ │
│ [+]                                            [Send]   │
│ Press Enter to send, Shift+Enter for new line          │
└─────────────────────────────────────────────────────────┘
     ↑ Cyan border + glow effect
```

### Multi-Line Expanded

```
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────┐ │
│ │ I need help with:                                   │ │
│ │ 1. Salesforce integration                           │ │
│ │ 2. Email automation                                 │ │
│ │ 3. Workflow templates                               │ │
│ └─────────────────────────────────────────────────────┘ │
│ [+]                                            [Send]   │
│ Press Enter to send, Shift+Enter for new line          │
└─────────────────────────────────────────────────────────┘
     ↑ Auto-expands up to 200px
```

## Color Palette

### Background Colors
- Page: `#020617` (slate-950)
- Sidebar: `#020617` with radial gradient
- Input bar: `rgba(15, 23, 42, 0.98)` with gradient
- User bubble: `rgba(15, 23, 42, 0.9)`
- Code block: `#020617`

### Text Colors
- Primary: `#e5e7eb` (slate-200)
- Secondary: `rgba(226, 232, 240, 0.96)`
- Muted: `rgba(148, 163, 184, 0.6)`
- Inline code: `#22d3ee` (cyan)

### Accent Colors
- Primary: `#22d3ee` (cyan-400)
- Secondary: `#0ea5e9` (sky-500)
- Border: `rgba(148, 163, 184, 0.18)`
- Focus glow: `rgba(56, 189, 248, 0.6)`

### Button Gradient
- Start: `#22d3ee` (cyan-400)
- End: `#0ea5e9` (sky-500)
- Shadow: `rgba(34, 211, 238, 0.3)`

## Spacing System (Tailwind-Style)

- Extra small: `4px`
- Small: `8px`
- Medium: `12px`
- Large: `16px`
- Extra large: `24px`

### Message Spacing
- Between messages: `18px`
- Paragraph bottom: `12px`
- List margin: `10px 0 12px`
- Code block margin: `14px 0 18px`

### Input Bar Spacing
- Wrapper padding: `12px 24px 16px`
- Textarea padding: `10px 14px`
- Button padding: `8px 14px`
- Actions gap: `10px`

## Typography

### Font Families
- UI: `system-ui, -apple-system, "Inter", "Segoe UI"`
- Code: `"JetBrains Mono", "Fira Code", monospace`

### Font Sizes
- Body: `14.5px`
- Small: `13px`
- Extra small: `11px`
- H1: `1.35rem`
- H2: `1.2rem`
- H3: `1.05rem`
- Code: `13px`
- Inline code: `12.5px`

### Line Heights
- Body: `1.7`
- Code: `1.7`
- Textarea: `1.45`

## Responsive Breakpoints

### Mobile (< 768px)
- Sidebar: `60px` (collapsed)
- Message padding: `0 16px`
- Input padding: `12px 16px`
- Message bubble: `100%` max-width

### Desktop (≥ 768px)
- Sidebar: `260px` (expanded)
- Message padding: `0 24px`
- Input padding: `12px 24px 16px`
- Message bubble: `780px` max-width

## Animation & Transitions

### Typing Indicator
```css
@keyframes typing-pulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
}
```
- Duration: `1.4s`
- Easing: `ease-in-out`
- Staggered delays: `0s` to `0.8s`

### Button Hover
- Transform: `translateY(-1px)`
- Shadow increase: `18px → 22px`
- Brightness: `1.04`
- Duration: `0.12s`

### Input Focus
- Border color transition: `0.15s ease`
- Box shadow transition: `0.15s ease`
- Background transition: `0.15s ease`

## Accessibility

### Keyboard Navigation
- Tab through all interactive elements
- Enter to send message
- Shift+Enter for new line
- Escape to close attach menu

### Screen Readers
- Semantic HTML structure
- ARIA labels on buttons
- Alt text on avatars
- Proper heading hierarchy

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
    /* Instant rendering, no streaming */
    /* Reduced animations */
}
```

## Testing Checklist

- [ ] Only browser scrollbar visible
- [ ] Input bar always visible at bottom
- [ ] New messages auto-scroll into view
- [ ] Sidebar doesn't overlap on hover
- [ ] Code blocks show language labels
- [ ] Tables render properly
- [ ] Inline code styled correctly
- [ ] Textarea auto-resizes
- [ ] Send button gradient works
- [ ] Attach menu opens/closes
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Reduced motion respected

## Performance Metrics

- First Paint: < 100ms
- Time to Interactive: < 500ms
- Scroll FPS: 60fps
- Message render: < 50ms
- Textarea resize: < 16ms (1 frame)

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 90+     | ✅ Full |
| Firefox | 88+     | ✅ Full |
| Safari  | 14+     | ✅ Full |
| Edge    | 90+     | ✅ Full |
| Mobile  | iOS 14+ | ✅ Full |
| Mobile  | Android 10+ | ✅ Full |
