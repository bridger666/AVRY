# Aivory AI Console - Next.js

The canonical AI Console for Aivory, built with Next.js 14 and pure CSS.

## Features

✅ **GPT-Style Design** - Warm gray aesthetic, rounded bubbles, floating input
✅ **Pure CSS** - No Tailwind, no UI frameworks, just clean CSS
✅ **TypeScript** - Full type safety
✅ **ARIA Integration** - Connected to ARIA backend on port 8081
✅ **Responsive** - Mobile-first design
✅ **Enterprise UX** - Calm, professional, no emojis

## Quick Start

### Prerequisites

Install Node.js if you haven't:
```bash
brew install node
```

### Installation

```bash
cd nextjs-console
npm install
```

### Running

**Terminal 1 - Backend (Port 8081):**
```bash
# From root Aivory directory
python3 -m uvicorn app.main:app --reload --port 8081
```

**Terminal 2 - Frontend (Port 3000):**
```bash
cd nextjs-console
npm run dev
```

**Open:** http://localhost:3000/console

## Architecture

```
┌─────────────────────────────────────┐
│   Next.js Console (Port 3000)      │
│   /console                          │
└─────────────────────────────────────┘
                 │
                 │ API Proxy
                 ▼
┌─────────────────────────────────────┐
│   FastAPI Backend (Port 8081)      │
│   /api/console/message              │
└─────────────────────────────────────┘
```

### API Proxy

Next.js rewrites `/api/*` to `http://localhost:8081/api/*` automatically.

## Project Structure

```
nextjs-console/
├── app/
│   ├── console/
│   │   └── page.tsx          # Main console page
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home (redirects to /console)
│
├── components/
│   ├── ChatMessage.tsx        # Message bubble component
│   ├── ChatInput.tsx          # Input with send/upload
│   └── UploadMenu.tsx         # Floating upload menu
│
├── styles/
│   └── globals.css            # GPT-style theme
│
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── next.config.js             # Next.js config (API proxy)
└── README.md                  # This file
```

## Components

### ChatMessage.tsx
Renders user/AI message bubbles with GPT-style rounded design.

**Props:**
- `role`: 'user' | 'assistant'
- `content`: string

### ChatInput.tsx
Sticky floating input with textarea, send button, and upload menu.

**Props:**
- `onSend`: (message: string) => void
- `disabled?`: boolean

**Features:**
- Enter to send
- Shift+Enter for new line
- Auto-resize textarea
- Upload menu toggle

### UploadMenu.tsx
Floating menu for file uploads (UI only for now).

**Props:**
- `isOpen`: boolean
- `onClose`: () => void

## Styling

### Color Palette (Warm Gray)

```css
--bg-main: #1e1d1a        /* Main background */
--bg-elevated: #262521     /* Message bubbles */
--bg-soft: #2f2e2a         /* User messages */
--border-soft: rgba(255,255,255,0.06)
--text-primary: #e8e6e3    /* Main text */
--text-secondary: #a8a6a2  /* Secondary text */
```

### Typography

- **Font:** Inter Tight (400, 500, 600)
- **Sizes:** 13px - 24px
- **Line height:** 1.6

### Layout

- **Message bubbles:** 20px border radius
- **Input box:** 28px border radius
- **Spacing:** Generous padding and margins
- **Scrollbar:** Custom styled

## API Integration

### Sending Messages

```typescript
const response = await fetch('/api/console/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: content,
    files: [],
    workflow: null,
    context: {
      tier: 'builder',
      user_id: 'demo_user',
      has_snapshot: false,
      has_blueprint: false
    }
  })
})

const data = await response.json()
// data.response contains ARIA's reply
// data.credits_remaining shows remaining credits
```

### Backend Endpoints

**POST /api/console/message**
- Send message to ARIA
- Returns AI response + credits

**POST /api/console/upload**
- Upload files (not wired yet)

**GET /api/console/context**
- Get user context (tier, credits, workflows)

**POST /api/console/prompt**
- Get ARIA system prompt

## Future Enhancements

### Ready to Add

1. **Streaming Responses**
   - Use Server-Sent Events (SSE)
   - Stream tokens as they arrive
   - Update `app/console/page.tsx`

2. **File Attachments**
   - Wire upload menu to backend
   - Show attachment chips
   - Preview uploaded files

3. **Markdown Rendering**
   - Install `react-markdown`
   - Render AI responses with formatting
   - Add code syntax highlighting

4. **Context Integration**
   - Pass snapshot data to ARIA
   - Pass blueprint data to ARIA
   - Show context chips in UI

5. **Message History**
   - Save conversation to localStorage
   - Load previous conversations
   - Export conversation

### Where to Add Features

**Streaming:**
- `app/console/page.tsx` - Update `handleSend()` to use SSE
- `components/ChatMessage.tsx` - Add streaming state

**Attachments:**
- `components/UploadMenu.tsx` - Wire to upload API
- `app/console/page.tsx` - Handle file state
- `components/ChatInput.tsx` - Show attachment chips

**Markdown:**
- `components/ChatMessage.tsx` - Replace `<div>` with `<ReactMarkdown>`
- Install: `npm install react-markdown`

**Context:**
- `app/console/page.tsx` - Fetch context on mount
- Pass to `handleSend()` in API call

## Development

### Hot Reload

Next.js watches for changes automatically. Edit any file and see updates instantly.

### TypeScript

All components are fully typed. Check `tsconfig.json` for configuration.

### Linting

```bash
npm run lint
```

## Production

### Build

```bash
npm run build
```

### Start

```bash
npm start
```

### Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8081
```

## Troubleshooting

### Port 3000 in use

```bash
lsof -ti:3000 | xargs kill -9
# Or use different port
npm run dev -- -p 3001
```

### Backend not connecting

1. Check backend is running: `curl http://localhost:8081/docs`
2. Check proxy config in `next.config.js`
3. Check CORS settings in backend

### Styling issues

1. Verify `globals.css` is imported in `app/layout.tsx`
2. Check Inter Tight font loads from Google Fonts
3. Clear browser cache

## Migration from Old Console

The old HTML console (`console-unified.html`) has been moved to `frontend/legacy/`.

All navigation links now point to the Next.js console at `http://localhost:3000/console`.

## Status

✅ **Complete and Production Ready**

- GPT-style UI implemented
- ARIA backend integrated
- Navigation updated
- Old console moved to legacy
- Documentation complete

## Next Steps

1. Install Node.js: `brew install node`
2. Install dependencies: `npm install`
3. Start backend: `python3 -m uvicorn app.main:app --reload --port 8081`
4. Start frontend: `npm run dev`
5. Open: http://localhost:3000/console

---

**Built with:** Next.js 14, TypeScript, Pure CSS
**Design:** GPT/Manus-inspired warm gray aesthetic
**Status:** ✅ Production Ready


## Free Diagnostic v2

The Free Diagnostic v2 is a 12-question AI readiness assessment integrated into the Next.js console.

### Routes

- `/diagnostics` - Diagnostics hub showing Free and Deep diagnostic options
- `/diagnostics/free` - 12-question free diagnostic flow
- `/diagnostics/free/result` - Results page with scoring card

### Features

- **Single-step navigation** - One question at a time with progress indicator
- **VPS Bridge integration** - AI-powered scoring and insights
- **localStorage persistence** - Results saved for dashboard display
- **Dashboard integration** - Shows completion status and score
- **Warm consultant tone** - Personalized narrative and recommendations

### API Endpoint

**POST /api/diagnostics/free/run**
- Proxies to VPS Bridge at `${VPS_BRIDGE_URL}/diagnostics/free/run`
- Request: `{ organization_id, answers: { question_id: option_index } }`
- Response: `{ diagnostic_id, score, maturity_level, strengths, blockers, opportunities, narrative }`

### Components

- `QuestionCard` - Displays question with 4 options
- `ProgressIndicator` - Shows progress bar and "Question X of 12"
- `NavigationControls` - Previous/Next buttons with validation
- `ScoringCard` - Displays score, maturity level, and insights

### Data Flow

1. User answers 12 questions → stored in component state
2. On submit → POST to `/api/diagnostics/free/run`
3. VPS Bridge processes → returns enriched results
4. Results saved to localStorage → displayed on results page
5. Dashboard reads from localStorage → shows completion status

### Testing

```bash
# Start backend
python3 -m uvicorn app.main:app --reload --port 8081

# Start frontend
npm run dev

# Navigate to
http://localhost:3000/diagnostics
```
