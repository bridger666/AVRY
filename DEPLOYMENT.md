# Aivory Deployment Guide

## Local Development Setup

### Prerequisites

- Python 3.9+
- Node.js 16+ (for frontend tooling, optional)
- Supabase account
- OpenRouter API key

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Aivory
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   
   Copy `.env.example` to `.env.local` and fill in:
   ```
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   
   # OpenRouter
   OPENROUTER_API_KEY=your_openrouter_key
   
   # JWT
   JWT_SECRET=your_secret_key
   JWT_ALGORITHM=HS256
   
   # API
   API_BASE_URL=http://localhost:8000
   ```

5. **Run the backend:**
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

   Or use the restart script:
   ```bash
   ./restart_backend.sh
   ```

### Frontend Setup

1. **Serve frontend files:**
   
   The frontend is static HTML/CSS/JS. Use any static file server:
   
   **Option A: Python simple server**
   ```bash
   python simple_server.py
   ```
   
   **Option B: Python http.server**
   ```bash
   cd frontend
   python -m http.server 8080
   ```
   
   **Option C: Node.js http-server**
   ```bash
   npx http-server frontend -p 8080
   ```

2. **Access the application:**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Database Setup

1. **Create Supabase project** at https://supabase.com

2. **Run migrations** (if available) or create tables manually:
   - users
   - diagnostics
   - snapshots
   - blueprints
   - contacts

3. **Enable Row Level Security (RLS)** on all tables

4. **Configure authentication** in Supabase dashboard

## Production Deployment

### Backend Deployment

**Recommended: Railway, Render, or AWS ECS**

1. Set environment variables in your hosting platform
2. Deploy from GitHub repository
3. Ensure Python 3.9+ runtime
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend Deployment

**Recommended: Netlify, Vercel, or Cloudflare Pages**

1. Deploy `frontend/` directory
2. Configure build settings:
   - Build command: (none needed)
   - Publish directory: `frontend`
3. Set environment variable for API URL:
   - `API_BASE_URL=https://your-backend-url.com`

### Environment Variables

Ensure all production environment variables are set:
- Use strong JWT_SECRET
- Use production Supabase keys
- Configure CORS for your frontend domain
- Set appropriate rate limits

## Troubleshooting

### Backend won't start
- Check Python version: `python --version`
- Verify all environment variables are set
- Check port 8000 is not in use: `lsof -i :8000`

### Frontend can't connect to backend
- Verify `API_BASE_URL` in frontend code
- Check CORS configuration in backend
- Verify backend is running and accessible

### Authentication issues
- Verify JWT_SECRET matches between backend and Supabase
- Check Supabase authentication is enabled
- Verify user exists in database

### Database connection issues
- Verify Supabase URL and keys
- Check network connectivity
- Verify RLS policies allow access

## Development Workflow

1. Make changes to code
2. Backend auto-reloads (with `--reload` flag)
3. Frontend: refresh browser
4. Test changes locally
5. Commit and push to repository
6. Deploy to production

## Monitoring

- Backend logs: Check console output or hosting platform logs
- Frontend errors: Check browser console (F12)
- API health: Visit `/health` endpoint
- Database: Monitor in Supabase dashboard
