# Aivory Next.js Console - Setup Guide

## Prerequisites

You need Node.js installed. If you don't have it:

```bash
# macOS (using Homebrew)
brew install node

# Or download from https://nodejs.org/
```

## Installation

```bash
cd nextjs-console
npm install
```

## Running the Console

### 1. Start the Backend (Port 8081)

In one terminal:

```bash
# From the root Aivory directory
python3 -m uvicorn app.main:app --reload --port 8081
```

### 2. Start the Next.js Console (Port 3000)

In another terminal:

```bash
cd nextjs-console
npm run dev
```

### 3. Open the Console

Navigate to: http://localhost:3000/console

## Architecture

- **Frontend**: Next.js 14 (App Router) on port 3000
- **Backend**: FastAPI on port 8081
- **API Proxy**: Next.js rewrites `/api/*` to `http://localhost:8081/api/*`

## Features

✅ GPT-style warm gray design
✅ Inter Tight font
✅ Rounded message bubbles (20px radius)
✅ Sticky floating input (28px radius)
✅ Upload menu popover
✅ Fully responsive
✅ Pure CSS (no Tailwind, no UI frameworks)
✅ TypeScript
✅ Connected to ARIA backend

## Development

- Edit components in `components/`
- Edit styles in `styles/globals.css`
- Main console page: `app/console/page.tsx`

## Production Build

```bash
npm run build
npm start
```

## Replacing the Old Console

Once this is working, update the unified shell sidebar to point to:
- Old: `console-unified.html`
- New: `http://localhost:3000/console`

Then move `console-unified.html` to `frontend/legacy/`.

