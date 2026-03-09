#!/usr/bin/env python3
"""
Aivory Development Server
Serves frontend static files and handles API requests
No external dependencies required - uses only Python standard library
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
from pathlib import Path

# Scoring configuration
QUESTIONS = [
    {"id": "business_objective", "max_score": 3},
    {"id": "current_ai_usage", "max_score": 3},
    {"id": "data_availability", "max_score": 3},
    {"id": "process_documentation", "max_score": 3},
    {"id": "workflow_standardization", "max_score": 3},
    {"id": "erp_integration", "max_score": 3},
    {"id": "automation_level", "max_score": 3},
    {"id": "decision_speed", "max_score": 3},
    {"id": "leadership_alignment", "max_score": 3},
    {"id": "budget_ownership", "max_score": 3},
    {"id": "change_readiness", "max_score": 3},
    {"id": "internal_capability", "max_score": 3}
]

# Static content by category
STATIC_CONTENT = {
    "AI Unready": {
        "insights": [
            "Your organization lacks foundational data infrastructure needed for AI adoption",
            "Process documentation and standardization should be prioritized before AI initiatives",
            "Leadership alignment on AI goals is critical for successful transformation"
        ],
        "recommendation": "Focus on building foundational capabilities before pursuing AI. Start by centralizing data sources, documenting key processes, and establishing clear business objectives for AI adoption. Consider a phased approach beginning with process automation."
    },
    "AI Curious": {
        "insights": [
            "Your organization shows interest in AI but faces data accessibility challenges",
            "Workflow standardization would significantly improve AI implementation success",
            "Decision-making processes could benefit from data-driven automation"
        ],
        "recommendation": "You're ready to begin targeted AI pilots in specific areas. Focus on use cases with clear ROI and available data. Prioritize data centralization and process standardization to unlock broader AI opportunities across the organization."
    },
    "AI Ready": {
        "insights": [
            "Your organization has strong foundational capabilities for AI adoption",
            "Data infrastructure and process standardization support AI initiatives",
            "Leadership alignment positions you well for successful AI implementation"
        ],
        "recommendation": "You're well-positioned to implement AI solutions across multiple use cases. Focus on high-impact areas where AI can drive measurable business outcomes. Consider building internal AI capabilities while partnering with experts for complex implementations."
    },
    "AI Native": {
        "insights": [
            "Your organization exhibits advanced AI maturity across all dimensions",
            "Strong technical capabilities and leadership support enable ambitious AI initiatives",
            "Data infrastructure and processes are optimized for AI-driven operations"
        ],
        "recommendation": "You're ready for advanced AI implementations including custom models, autonomous agents, and AI-driven decision systems. Focus on strategic differentiation through AI and building proprietary capabilities that create competitive advantages in your market."
    }
}

def calculate_score(answers):
    """Calculate AI readiness score"""
    raw_score = sum(ans["selected_option"] for ans in answers)
    normalized_score = (raw_score / 36) * 100
    
    if normalized_score <= 30:
        category = "AI Unready"
    elif normalized_score <= 50:
        category = "AI Curious"
    elif normalized_score <= 70:
        category = "AI Ready"
    else:
        category = "AI Native"
    
    return {
        "raw_score": raw_score,
        "normalized_score": round(normalized_score, 1),
        "category": category
    }

def generate_badge(score, category):
    """Generate SVG badge"""
    colors = {
        "AI Unready": "#E74C3C",
        "AI Curious": "#F39C12",
        "AI Ready": "#3498DB",
        "AI Native": "#27AE60"
    }
    color = colors.get(category, "#95A5A6")
    score_int = int(round(score))
    
    return f'''<svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="250" fill="{color}" rx="15"/>
  <circle cx="350" cy="50" r="60" fill="rgba(255,255,255,0.1)"/>
  <circle cx="50" cy="200" r="40" fill="rgba(255,255,255,0.1)"/>
  <text x="200" y="110" font-size="80" fill="white" text-anchor="middle" font-weight="bold" font-family="Arial, sans-serif">{score_int}</text>
  <text x="200" y="155" font-size="28" fill="white" text-anchor="middle" font-weight="600" font-family="Arial, sans-serif">{category}</text>
  <text x="200" y="210" font-size="18" fill="rgba(255,255,255,0.9)" text-anchor="middle" font-family="Arial, sans-serif">Aivory AI Readiness</text>
  <text x="200" y="235" font-size="14" fill="rgba(255,255,255,0.7)" text-anchor="middle" font-family="Arial, sans-serif">Diagnostic Score</text>
</svg>'''

class RequestHandler(SimpleHTTPRequestHandler):
    """Custom request handler that serves static files and handles API requests"""
    
    def __init__(self, *args, **kwargs):
        # Set the directory to serve files from
        super().__init__(*args, directory='frontend', **kwargs)
    
    def end_headers(self):
        """Add CORS headers to all responses"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests - serve static files or API endpoints"""
        if self.path.startswith('/api/'):
            # Handle API GET requests
            if self.path == '/api/health':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"status": "healthy", "llm_available": False}
                self.wfile.write(json.dumps(response).encode())
            else:
                self.send_error(404, "API endpoint not found")
        else:
            # Serve static files from frontend directory
            super().do_GET()
    
    def do_POST(self):
        """Handle POST requests - API only"""
        if self.path == '/api/v1/diagnostic/run':
            try:
                # Read request body
                content_length = int(self.headers['Content-Length'])
                body = self.rfile.read(content_length)
                data = json.loads(body.decode())
                
                # Validate
                answers = data.get('answers', [])
                if len(answers) != 12:
                    self.send_error(422, f"Expected 12 answers, got {len(answers)}")
                    return
                
                # Calculate score
                score_result = calculate_score(answers)
                category = score_result['category']
                
                # Get static content
                content = STATIC_CONTENT[category]
                
                # Generate badge
                badge_svg = generate_badge(score_result['normalized_score'], category)
                
                # Build response
                result = {
                    "score": score_result['normalized_score'],
                    "category": category,
                    "category_explanation": f"Your organization is {category}",
                    "insights": content['insights'],
                    "recommendation": content['recommendation'],
                    "badge_svg": badge_svg,
                    "enriched_by_ai": False
                }
                
                # Send response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
                
            except Exception as e:
                self.send_error(500, str(e))
        
        elif self.path == '/api/v1/contact':
            try:
                content_length = int(self.headers['Content-Length'])
                body = self.rfile.read(content_length)
                data = json.loads(body.decode())
                
                # Log contact (in production, save to database)
                print(f"\n📧 Contact Form Submission:")
                print(f"   Name: {data.get('name')}")
                print(f"   Company: {data.get('company')}")
                print(f"   Email: {data.get('email')}")
                print(f"   Message: {data.get('message')}\n")
                
                result = {
                    "success": True,
                    "message": "Thank you for your interest! We'll be in touch soon."
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
                
            except Exception as e:
                self.send_error(500, str(e))
        else:
            self.send_error(404)
    
    def log_message(self, format, *args):
        """Custom logging"""
        print(f"[{self.log_date_time_string()}] {format % args}")

if __name__ == '__main__':
    PORT = 9000
    
    # Change to project root directory
    os.chdir(Path(__file__).parent)
    
    server = HTTPServer(('0.0.0.0', PORT), RequestHandler)
    print("=" * 60)
    print("🚀 Aivory Development Server")
    print("=" * 60)
    print(f"\n✓ Server running on http://localhost:{PORT}")
    print(f"✓ Frontend: http://localhost:{PORT}/index.html")
    print(f"✓ Dashboard: http://localhost:{PORT}/dashboard.html")
    print(f"✓ Console: http://localhost:{PORT}/console.html")
    print(f"✓ API Health: http://localhost:{PORT}/api/health")
    print(f"\n📂 Serving files from: ./frontend/")
    print(f"\n⚠️  IMPORTANT: Open http://localhost:{PORT} in your browser")
    print(f"   DO NOT open files directly (file://) - this causes CORS errors")
    print(f"\nPress Ctrl+C to stop\n")
    print("=" * 60)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped")
