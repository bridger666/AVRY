# Aivory Frontend - Diagnostic UI

Minimal single-page UI for the AI readiness diagnostic flow.

## Structure

- **Screen 1**: 10 diagnostic questions (mix of dropdowns, checkboxes, text input)
- **Screen 2**: Loading state with spinner
- **Screen 3**: Results display (score, findings, explanation, priorities, CTA)

## How to Run

### Option 1: Simple HTTP Server (Python)

```bash
cd frontend
python3 -m http.server 8080
```

Then open: http://localhost:8080

### Option 2: Simple HTTP Server (Node.js)

```bash
cd frontend
npx serve
```

### Option 3: Open Directly

Simply open `index.html` in your browser. Note: CORS may block API calls. Use a local server instead.

## Backend Connection

The UI expects the FastAPI backend running at `http://localhost:8000`.

Make sure to:
1. Start the backend: `uvicorn app.main:app --reload`
2. Enable CORS in FastAPI (see note below)

## Enable CORS in Backend

Add to `app/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Testing Without Backend

To test the UI without the backend, modify `app.js` to use mock data:

```javascript
// In the catch block of form submission, add:
const mockResult = {
    badge: {
        ai_readiness_score: 65,
        category: "AI Experimenting"
    },
    report: "Mock report text..."
};
displayResults(mockResult);
```
