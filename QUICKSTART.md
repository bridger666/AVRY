# Aivory Quick Start Guide

Get your AI readiness diagnostic platform running in 3 steps!

## Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 2: Start the Backend

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload
```

The backend will start on http://localhost:8081

## Step 3: Open the Frontend

Simply open `frontend/index.html` in your web browser!

Or use a simple HTTP server:
```bash
python3 -m http.server 8080 --directory frontend
```
Then visit http://localhost:8080

## That's It!

Your Aivory platform is now running. Try the diagnostic:

1. Click "Start Diagnostic" on the homepage
2. Answer the 12 questions
3. Get your AI readiness score!

## Optional: Enable AI Enrichment

For AI-powered insights (optional), install and run Ollama with Mistral:

```bash
# Install Ollama from https://ollama.ai
ollama pull mistralai/Mistral-7B-Instruct
ollama serve
```

The system works perfectly without AI - it uses smart static content as fallback!

## Troubleshooting

**Backend won't start?**
- Make sure port 8081 is available
- Check that all dependencies are installed

**Frontend can't connect?**
- Verify backend is running on port 8081
- Check browser console for errors
- Make sure CORS is enabled (it is by default)

**Want to test without the full diagnostic?**
- Visit http://localhost:8081/health to check backend status
- Visit http://localhost:8081/api/v1/diagnostic/test-llm to test LLM connection

## Next Steps

- Customize questions in `app/services/scoring_config.py`
- Adjust static content in `app/services/static_content.py`
- Modify styling in `frontend/styles.css`
- Add your branding and colors

Enjoy building with Aivory! 🚀
