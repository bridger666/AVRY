# Aivory Frontend Stack

## Architecture: Vanilla JavaScript (No Framework)

The Aivory frontend is built with **pure HTML, CSS, and JavaScript** - no frameworks, no build tools, no bundlers.

---

## Core Technologies

### 1. **HTML5**
- Semantic HTML structure
- Multiple single-page applications (SPAs)
- Modal-based interactions
- Form-based diagnostic flows

### 2. **CSS3**
- Custom CSS (no frameworks like Bootstrap or Tailwind)
- CSS Variables for design tokens
- Modular CSS architecture
- Responsive design with media queries

### 3. **Vanilla JavaScript (ES6+)**
- No frameworks (React, Vue, Angular, etc.)
- No build tools (Webpack, Vite, Rollup, etc.)
- No TypeScript
- Direct DOM manipulation
- Fetch API for HTTP requests
- LocalStorage for state persistence

---

## Design System

### CSS Architecture

**Core Design Files:**
- `design-system.css` - Design tokens and global variables
- `dashboard-layout.css` - Dashboard layout components
- `console-redesign.css` - Console-specific styles
- `styles.css` - Landing page styles

**Design Tokens (CSS Variables):**
```css
:root {
    /* Colors */
    --bg-primary: #1a1a24;
    --brand-purple: #5b3cc4;
    --mint-green: #0ae8af;
    --text-primary: rgba(255, 255, 255, 0.95);
    
    /* Spacing (8px grid) */
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    /* ... */
}
```

### Typography
- **Font**: Inter Tight (Google Fonts)
- **Base Size**: 16px
- **Line Height**: 1.65
- **Letter Spacing**: -0.01em (body), -0.015em (headings)
- **Weights**: 300, 400, 500, 600

### Color Palette
- **Primary Background**: #1a1a24 (dark purple)
- **Brand Purple**: #5b3cc4
- **Mint Green**: #0ae8af (accent)
- **Text**: rgba(255, 255, 255, 0.95)

---

## Page Structure

### Landing Page (`index.html`)
- Hero section with LED background animation
- Use cases showcase
- Pricing tiers
- Free diagnostic flow (12 questions)
- Snapshot diagnostic flow (30 questions)
- Blueprint generation

### Dashboard (`dashboard.html`)
- Overview page
- Tier and credit display
- Workflow management
- Diagnostic results

### Console (`console.html`)
- ChatGPT/Manus AI-style interface
- Real-time AI chat
- Message streaming
- Markdown rendering
- Code syntax highlighting

### Other Pages
- `workflows.html` - Workflow management
- `logs.html` - Execution logs
- `dashboard-subscription.html` - Subscription management
- `auth-test.html` - Authentication testing

---

## JavaScript Modules

### Core Application Logic

**Landing Page:**
- `app.js` - Main application logic
- `app_new.js` - Updated application logic
- `hero-animation.js` - Hero section animations
- `led-hero-background.js` - LED background canvas
- `hero-typewriter.js` - Typewriter effect

**Dashboard:**
- `dashboard.js` - Dashboard logic
- `dashboard-v2.js` - Updated dashboard
- `dashboard-subscription.js` - Subscription management
- `tier-sync.js` - Tier synchronization

**Console:**
- `console.js` - Core console logic
- `console-streaming.js` - Zenclaw AI integration
- `console-redesign.js` - Minimal (intentionally empty)
- `console-drawer.js` - System drawer functionality

**Diagnostics:**
- `diagnostic-questions-paid.js` - Paid diagnostic flow
- `diagnostic-questions-snapshot.js` - Snapshot diagnostic

**Utilities:**
- `auth-guard.js` - Authentication guard
- `sidebar-toggle.js` - Sidebar toggle logic
- `workflow-preview.js` - Workflow preview component
- `vps-bridge-client.js` - VPS bridge client

---

## External Dependencies

### CDN Libraries (Loaded via `<script>` tags)

**Markdown Rendering:**
```html
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
```

**Code Syntax Highlighting:**
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
```

**Google Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600&display=swap" rel="stylesheet">
```

---

## State Management

### LocalStorage
- `console_conversation` - Console chat history (last 50 messages)
- `aivory_tier` - User tier
- `user_tier` - Session tier
- Authentication tokens

### In-Memory State
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

---

## API Integration

### Backend APIs

**Local Backend (FastAPI):**
- **Port**: 8081
- **Base URL**: `http://localhost:8081`
- **Endpoints**:
  - `/api/console/context` - Fetch context data
  - `/api/console/upload` - File upload
  - `/api/diagnostic/submit` - Submit diagnostic

**Zenclaw AI Service:**
- **Endpoint**: `http://43.156.108.96:8080/chat`
- **Trigger**: `http://43.156.108.96:8080/trigger`
- **Method**: POST
- **Format**: JSON
- **CORS**: Enabled

### Request Format (Zenclaw)
```javascript
{
  "message": "User message",
  "history": [
    {"role": "user", "content": "Previous message"},
    {"role": "assistant", "content": "Previous response"}
  ],
  "system_prompt": "You are Aivory..."
}
```

---

## Development Workflow

### Local Development

**Start Backend:**
```bash
cd app
python main.py
# Runs on http://localhost:8081
```

**Start Frontend:**
```bash
cd frontend
python3 -m http.server 8080
# Runs on http://localhost:8080
```

**Access:**
- Landing: `http://localhost:8080/index.html`
- Console: `http://localhost:8080/console.html`
- Dashboard: `http://localhost:8080/dashboard.html`

### No Build Process
- No compilation step
- No bundling
- No transpilation
- Direct file serving
- Changes are immediately visible (hard refresh required for cache)

### Cache Busting
```html
<link rel="stylesheet" href="console-redesign.css?v=1772019200">
<script src="console-streaming.js?v=1772019600"></script>
```

Increment version number after changes to force browser refresh.

---

## Key Features

### Console Features
- **Real-time AI Chat**: Streaming responses from Zenclaw
- **Markdown Support**: Full markdown rendering with code highlighting
- **Message History**: Persistent conversation storage
- **File Upload**: PDF, DOCX, CSV, TXT support
- **Workflow Attachment**: Attach workflows to messages
- **System Drawer**: Slide-in panel for system info

### Dashboard Features
- **Tier Management**: Foundation, Pro, Enterprise tiers
- **Credit Tracking**: Real-time credit display
- **Workflow Management**: Create, view, execute workflows
- **Diagnostic Results**: View AI readiness scores
- **Subscription Management**: Upgrade/downgrade plans

### Landing Page Features
- **LED Background**: Animated LED panel effect
- **Hero Animation**: Typewriter effect
- **Use Cases**: Interactive use case cards
- **Pricing Tiers**: Lifecycle flow visualization
- **Free Diagnostic**: 12-question assessment
- **Snapshot Diagnostic**: 30-question deep dive

---

## Browser Compatibility

**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features:**
- ES6+ JavaScript
- CSS Variables
- Fetch API
- LocalStorage
- Canvas API (for LED background)

---

## Performance Optimizations

### Lazy Loading
- Images loaded on demand
- Scripts deferred where possible
- Modular CSS loading

### Caching Strategy
- Static assets cached by browser
- Version-based cache busting
- LocalStorage for state persistence

### Streaming
- Message streaming for real-time feel
- 10 chars per 5ms (fast streaming)
- Progressive markdown rendering

---

## Security Considerations

### CORS
- Backend must enable CORS for frontend
- Zenclaw has CORS enabled (`access-control-allow-origin: *`)

### Authentication
- Token-based authentication
- LocalStorage for token storage
- Auth guard for protected routes

### Input Validation
- Client-side validation
- Server-side validation (backend)
- XSS protection via DOM methods

---

## File Organization

```
frontend/
├── index.html              # Landing page
├── console.html            # AI Console
├── dashboard.html          # Dashboard
├── workflows.html          # Workflows
├── logs.html              # Logs
├── design-system.css      # Design tokens
├── dashboard-layout.css   # Dashboard layout
├── console-redesign.css   # Console styles
├── styles.css             # Landing styles
├── app.js                 # Landing logic
├── console.js             # Console logic
├── console-streaming.js   # Zenclaw integration
├── dashboard.js           # Dashboard logic
├── tier-sync.js           # Tier sync
├── auth-guard.js          # Auth guard
├── sidebar-toggle.js      # Sidebar toggle
├── workflow-preview.js    # Workflow preview
├── hero-animation.js      # Hero animations
├── led-hero-background.js # LED background
└── components/            # React components (unused)
    └── *.jsx              # Legacy React files
```

---

## Why Vanilla JavaScript?

### Advantages
1. **Zero Build Time**: No compilation, instant changes
2. **Minimal Dependencies**: Only 2 CDN libraries (marked.js, highlight.js)
3. **Easy Debugging**: Direct browser DevTools, no source maps
4. **Fast Loading**: No framework overhead (~30KB vs 300KB+)
5. **Simple Deployment**: Just copy files to server
6. **No Version Conflicts**: No npm dependency hell

### Trade-offs
1. **Manual DOM Manipulation**: More verbose than React
2. **No Component Reusability**: Copy-paste for similar components
3. **State Management**: Manual state tracking
4. **No Type Safety**: No TypeScript
5. **Larger Codebase**: More code for complex interactions

---

## Future Considerations

### Potential Upgrades
- **TypeScript**: Add type safety without build tools (via JSDoc)
- **Web Components**: Reusable components without frameworks
- **Service Workers**: Offline support and caching
- **Progressive Web App**: Install as native app

### Not Recommended
- **React/Vue/Angular**: Adds unnecessary complexity
- **Build Tools**: Slows down development
- **CSS Frameworks**: Design system is already established

---

## Summary

**Stack**: Pure HTML + CSS + JavaScript  
**Dependencies**: 2 CDN libraries (marked.js, highlight.js)  
**Build Tools**: None  
**Deployment**: Static file serving  
**Development**: Python HTTP server  
**Philosophy**: Keep it simple, keep it fast

The Aivory frontend is intentionally minimal, focusing on performance, simplicity, and developer experience without the overhead of modern frameworks.
