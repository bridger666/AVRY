# AI Console & Dashboard Frontend Stack

Detailed technical breakdown of the Console and Dashboard applications.

---

## AI Console (`console.html`)

### Design Philosophy
**Inspiration**: ChatGPT / Manus AI conversational interface  
**Style**: Minimal, clean, conversation-first layout

### Architecture

#### HTML Structure
```
console.html
├── Dashboard Layout Wrapper
│   ├── Top Bar (tier, credits)
│   ├── Sidebar Navigation
│   └── Main Console Area
│       ├── Conversation Thread (centered, 900px max)
│       ├── Typing Indicator
│       └── Input Bar
└── System Drawer (slide-in from right)
```

#### CSS Files (Load Order)
1. `design-system.css` - Design tokens and variables
2. `dashboard-layout.css?v=3` - Dashboard layout components
3. `console-redesign.css?v=1772019200` - Console-specific styles
4. Inline `<style>` - Typography overrides

#### JavaScript Files (Load Order)
1. `marked.min.js` (CDN) - Markdown parsing
2. `highlight.min.js` (CDN) - Code syntax highlighting
3. `sidebar-toggle.js` - Sidebar collapse/expand
4. `tier-sync.js` - Tier synchronization across UI
5. `workflow-preview.js` - Workflow preview modal
6. `console-streaming.js?v=1772019600` - Zenclaw AI integration
7. `console-redesign.js?v=1772019500` - Minimal (intentionally empty)
8. `console-drawer.js` - System drawer toggle
9. `console.js?v=1772019500` - Core console logic

---

## Console Features Breakdown

### 1. Conversation Thread

**Layout:**
- Centered column (900px max-width)
- Full-height scrollable area
- Message bubbles with avatars
- Timestamp display

**Message Types:**
```javascript
// User Message
{
  role: 'user',
  content: 'Message text',
  files: [],
  timestamp: '2026-02-25T17:00:00Z'
}

// AI Message
{
  role: 'assistant',
  content: 'AI response with **markdown**',
  files: [],
  reasoning: {
    tokens: 150,
    confidence: 0.95,
    cost: 1
  },
  blueprint: null,
  timestamp: '2026-02-25T17:00:05Z'
}
```

**Styling:**
- User messages: Right-aligned, bordered bubble
- AI messages: Left-aligned, plain text (no bubble)
- Avatar: 32x32px (`Aivory_console_pic.svg` for AI)
- Font: Inter Tight, 16px, line-height 1.65

### 2. Message Streaming

**Implementation:**
```javascript
// Fast streaming: 10 chars per 5ms
const charsPerFrame = 2;
const frameDelay = 20;

function streamText(container, text) {
  // Progressive markdown rendering
  // Character-by-character reveal
  // Respects prefers-reduced-motion
}
```

**Features:**
- Real-time character streaming
- Progressive markdown rendering
- Syntax highlighting for code blocks
- Smooth animations

### 3. Markdown Rendering

**Library:** marked.js (CDN)

**Supported Elements:**
- Headings (H1-H6)
- Paragraphs
- Lists (ordered/unordered)
- Code blocks with syntax highlighting
- Inline code
- Bold/italic text
- Links

**Typography Rules:**
- ALL text: 16px (no size variation except headings)
- H1: 18px, H2: 17px, H3-H6: 16px
- Font-weight: 400 (body), 500 (headings)
- NO horizontal lines (hr hidden)
- NO borders on headings

### 4. Code Syntax Highlighting

**Library:** highlight.js (CDN)

**Theme:** Atom One Dark

**Supported Languages:**
- JavaScript, Python, Java, C++, Go
- HTML, CSS, JSON, YAML
- SQL, Bash, Shell
- And 180+ more

**Styling:**
```css
.ai-message .message-text pre {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 1.25rem;
}
```

### 5. Typing Indicator

**Design:** 3x3 grid of animated dots

**Animation:**
```css
.typing-grid-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  animation: pulse 1.4s infinite;
}
```

**States:**
- "Thinking..." - Default
- "Uploading file..." - During file upload
- Hidden when not active

### 6. Input Bar

**Components:**
- File upload button
- Workflow attach button
- Auto-resizing textarea (40px-200px)
- Send button
- Hint text

**Features:**
- Enter to send, Shift+Enter for new line
- Auto-resize on input
- Attachment chips display
- Disabled when no credits

### 7. System Drawer

**Trigger:** "System" button in header

**Layout:**
- Slides in from right (380px wide)
- Overlay with backdrop blur
- Smooth cubic-bezier animation

**Content:**
- Tier display
- Credits meter (X / Y format)
- Active workflows list
- Recent executions

**Interactions:**
- Click overlay to close
- Escape key to close
- Click X button to close

### 8. File Upload

**Supported Types:**
- PDF (application/pdf)
- DOCX (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
- CSV (text/csv)
- TXT (text/plain)

**Flow:**
1. User clicks upload button
2. File picker opens
3. File validated
4. POST to `/api/console/upload`
5. Attachment chip displayed
6. File ID stored in state

### 9. Conversation Persistence

**Storage:** LocalStorage

**Key:** `console_conversation`

**Data:**
```javascript
// Last 50 messages stored
[
  {
    role: 'user',
    content: 'Message',
    files: [],
    reasoning: null,
    blueprint: null,
    timestamp: '2026-02-25T17:00:00Z'
  },
  // ...
]
```

**Restoration:**
- On page load
- Messages rendered instantly (no streaming)
- State synchronized

### 10. Zenclaw AI Integration

**Endpoint:** `http://43.156.108.96:8080/chat`

**Request Format:**
```javascript
{
  message: "User message",
  history: [
    {role: "user", content: "Previous message"},
    {role: "assistant", content: "Previous response"}
  ],
  system_prompt: "You are Aivory..."
}
```

**Response Format:**
```javascript
{
  reply: "AI response with markdown"
}
```

**Features:**
- Multi-turn conversation (last 10 messages)
- System prompt injection
- Automatic credit deduction
- Error handling with user-friendly messages
- Connection diagnostics on page load

---

## Dashboard (`dashboard.html`)

### Design Philosophy
**Style**: Modern SaaS dashboard with sidebar navigation

### Architecture

#### HTML Structure
```
dashboard.html
├── Dashboard Layout Wrapper
│   ├── Top Bar (logo, tier, credits)
│   ├── Sidebar Navigation
│   └── Main Content Area
│       ├── Overview Cards
│       ├── Diagnostic Results
│       ├── Workflow List
│       └── Recent Activity
```

#### CSS Files (Load Order)
1. `design-system.css` - Design tokens
2. `dashboard-layout.css` - Layout components
3. `dashboard.css` - Dashboard-specific styles

#### JavaScript Files (Load Order)
1. `sidebar-toggle.js` - Sidebar functionality
2. `tier-sync.js` - Tier synchronization
3. `dashboard.js` - Core dashboard logic

---

## Dashboard Features Breakdown

### 1. Top Bar

**Components:**
- Logo (clickable, returns to home)
- Tier badge (Foundation/Pro/Enterprise)
- Credits display (numeric)

**Styling:**
```css
.dashboard-topbar {
  height: 60px;
  background: #1a0b2e;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  padding: 0 2rem;
}
```

**Tier Colors:**
- Foundation: Default
- Pro: Mint green (#0ae8af)
- Enterprise: Purple (#6627dd)

### 2. Sidebar Navigation

**Structure:**
```
Sidebar
├── Main Navigation
│   ├── Console
│   ├── Overview
│   ├── Workflows
│   ├── Logs
│   └── Diagnostics
├── Settings Section
│   ├── Settings
│   └── Home
└── Toggle Button (collapse/expand)
```

**Features:**
- Active state highlighting
- Icon + text labels
- Tooltips on hover
- Collapsible (icon-only mode)
- Smooth transitions

**Styling:**
```css
.sidebar-nav-item.active {
  background: rgba(10, 232, 175, 0.12);
  color: #0ae8af;
  border-left: 3px solid #0ae8af;
}
```

### 3. Overview Cards

**Card Types:**
- Tier status card
- Credits remaining card
- Active workflows card
- Recent executions card

**Layout:**
```css
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
```

**Card Structure:**
```html
<div class="stat-card">
  <div class="stat-icon"><!-- SVG --></div>
  <div class="stat-content">
    <div class="stat-label">Label</div>
    <div class="stat-value">Value</div>
  </div>
</div>
```

### 4. Diagnostic Results

**Display:**
- AI Readiness Score (0-100)
- Category badge (AI Experimenting, AI Ready, etc.)
- Key insights list
- Recommendations
- Downloadable badge

**Score Visualization:**
```javascript
// Score ranges
0-30: "AI Exploring"
31-50: "AI Experimenting"
51-70: "AI Ready"
71-85: "AI Optimizing"
86-100: "AI Leading"
```

### 5. Workflow Management

**Features:**
- Workflow list view
- Status indicators (active, paused, failed)
- Execution count
- Last run timestamp
- Quick actions (view, edit, delete)

**Workflow Card:**
```html
<div class="workflow-card">
  <div class="workflow-header">
    <h3>Workflow Name</h3>
    <span class="status-badge active">Active</span>
  </div>
  <div class="workflow-stats">
    <span>127 executions</span>
    <span>Last run: 2 hours ago</span>
  </div>
  <div class="workflow-actions">
    <button>View</button>
    <button>Edit</button>
  </div>
</div>
```

### 6. Tier Synchronization

**File:** `tier-sync.js`

**Purpose:** Keep tier display consistent across all UI elements

**Synced Elements:**
- Top bar tier badge
- System drawer tier
- Credits display (top bar)
- Credits display (drawer)
- Credit meter fill

**Implementation:**
```javascript
function syncTierDisplay() {
  const tier = localStorage.getItem('aivory_tier') || 'enterprise';
  
  // Update all tier badges
  document.querySelectorAll('[id*="tier"]').forEach(el => {
    el.textContent = formatTierName(tier);
  });
  
  // Update credits
  updateCreditsDisplay();
}
```

---

## Shared Components

### 1. Dashboard Layout System

**File:** `dashboard-layout.css`

**Grid Structure:**
```css
.dashboard-layout {
  display: grid;
  grid-template-areas:
    "topbar topbar"
    "sidebar main";
  grid-template-columns: 240px 1fr;
  grid-template-rows: 60px 1fr;
  height: 100vh;
}
```

**Responsive:**
```css
@media (max-width: 1023px) {
  .dashboard-layout {
    grid-template-columns: 60px 1fr;
  }
  
  .sidebar-nav-item span {
    display: none; /* Icon-only mode */
  }
}
```

### 2. Design System

**File:** `design-system.css`

**CSS Variables:**
```css
:root {
  /* Colors */
  --bg-primary: #1a1a24;
  --bg-secondary: #20202b;
  --brand-purple: #5b3cc4;
  --mint-green: #0ae8af;
  --text-primary: rgba(255, 255, 255, 0.95);
  
  /* Spacing (8px grid) */
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
  
  /* Typography */
  --font-family: 'Inter Tight', system-ui, sans-serif;
  --font-size-base: 16px;
  --line-height-base: 1.65;
  --letter-spacing-tight: -0.015em;
  --letter-spacing-normal: -0.01em;
}
```

### 3. Sidebar Toggle

**File:** `sidebar-toggle.js`

**Functionality:**
- Toggle sidebar width (240px ↔ 60px)
- Persist state in localStorage
- Smooth transitions
- Icon rotation animation

**Implementation:**
```javascript
function toggleSidebar() {
  const sidebar = document.querySelector('.dashboard-sidebar');
  const isCollapsed = sidebar.classList.toggle('collapsed');
  
  localStorage.setItem('sidebar_collapsed', isCollapsed);
  
  // Rotate toggle icon
  const icon = document.querySelector('.sidebar-toggle svg');
  icon.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
}
```

---

## State Management

### Console State
```javascript
const ConsoleState = {
  tier: 'enterprise',
  credits: 50,
  creditLimit: 2000,
  messages: [],
  uploadedFiles: [],
  attachedWorkflow: null,
  isTyping: false,
  userId: 'demo_user'
};
```

### Dashboard State
```javascript
const DashboardState = {
  tier: 'enterprise',
  credits: 50,
  workflows: [],
  executions: [],
  diagnosticResults: null
};
```

### Persistence
- **LocalStorage Keys:**
  - `console_conversation` - Chat history
  - `aivory_tier` - User tier
  - `sidebar_collapsed` - Sidebar state
  - Auth tokens

---

## API Integration

### Console APIs

**Context API:**
```javascript
GET /api/console/context?tier=enterprise&user_id=demo_user

Response:
{
  credits: 50,
  credit_limit: 2000,
  workflows: [...],
  executions: [...]
}
```

**Upload API:**
```javascript
POST /api/console/upload
Content-Type: multipart/form-data

Body:
- file: <binary>
- tier: "enterprise"

Response:
{
  file_id: "abc123",
  filename: "document.pdf",
  size: 1024000,
  type: "application/pdf"
}
```

**Zenclaw AI:**
```javascript
POST http://43.156.108.96:8080/chat
Content-Type: application/json

Body:
{
  message: "User message",
  history: [{role: "user", content: "..."}],
  system_prompt: "You are Aivory..."
}

Response:
{
  reply: "AI response"
}
```

### Dashboard APIs

**Diagnostic API:**
```javascript
POST /api/diagnostic/submit
Content-Type: application/json

Body:
{
  answers: {...},
  tier: "enterprise"
}

Response:
{
  score: 75,
  category: "AI Ready",
  insights: [...],
  recommendations: [...]
}
```

---

## Performance Optimizations

### Console
1. **Message Streaming**: 10 chars/5ms for smooth feel
2. **Lazy Rendering**: Only render visible messages
3. **LocalStorage**: Cache last 50 messages
4. **Debounced Input**: Auto-resize textarea
5. **Connection Test**: Automatic on page load

### Dashboard
1. **Lazy Loading**: Load data on demand
2. **Cached State**: Minimize API calls
3. **Optimistic Updates**: Update UI before API response
4. **Skeleton Screens**: Show loading states

---

## Accessibility

### WCAG AA Compliance
- **Color Contrast**: 4.5:1 minimum
- **Keyboard Navigation**: Full support
- **Screen Readers**: ARIA labels
- **Focus Indicators**: Visible outlines
- **Reduced Motion**: Respects prefers-reduced-motion

### Keyboard Shortcuts
- **Console:**
  - Enter: Send message
  - Shift+Enter: New line
  - Escape: Close drawer
- **Dashboard:**
  - Tab: Navigate elements
  - Escape: Close modals

---

## Browser Support

**Minimum Versions:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features:**
- ES6+ JavaScript
- CSS Grid
- CSS Variables
- Fetch API
- LocalStorage
- Canvas API

---

## Development Workflow

### Console Development
```bash
# Start backend
cd app && python main.py

# Start frontend
cd frontend && python3 -m http.server 8080

# Access console
open http://localhost:8080/console.html
```

### Dashboard Development
```bash
# Same backend
cd app && python main.py

# Same frontend server
cd frontend && python3 -m http.server 8080

# Access dashboard
open http://localhost:8080/dashboard.html
```

### Testing
1. **Hard Refresh**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **DevTools**: F12 → Console for errors
3. **Network Tab**: Check API calls
4. **LocalStorage**: Application tab in DevTools

---

## Summary

**Console Stack:**
- Vanilla JS + marked.js + highlight.js
- ChatGPT-style conversational UI
- Real-time streaming with Zenclaw AI
- Markdown rendering with syntax highlighting
- LocalStorage persistence

**Dashboard Stack:**
- Vanilla JS + CSS Grid
- Modern SaaS dashboard layout
- Tier-based feature access
- Workflow and diagnostic management
- Responsive sidebar navigation

**Shared:**
- Design system with CSS variables
- Inter Tight typography
- Dark theme (#1a1a24)
- No build tools, no frameworks
- Python HTTP server for development

Both applications prioritize simplicity, performance, and developer experience without the overhead of modern frameworks.
