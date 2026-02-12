#!/usr/bin/env python3
"""Simple script to run the Aivory backend server"""

import sys
import subprocess

print("=" * 60)
print("🚀 Starting Aivory Backend Server")
print("=" * 60)
print()

# Check Python version
print(f"Python version: {sys.version}")
print()

# Check if dependencies are installed
print("Checking dependencies...")
try:
    import fastapi
    import uvicorn
    import pydantic
    from pydantic_settings import BaseSettings
    import httpx
    print("✓ All dependencies installed")
except ImportError as e:
    print(f"✗ Missing dependency: {e}")
    print()
    print("Please install dependencies first:")
    print("  pip install -r requirements.txt")
    sys.exit(1)

print()
print("Starting server on http://localhost:8081")
print("Press Ctrl+C to stop")
print("=" * 60)
print()

# Start uvicorn
try:
    subprocess.run([
        sys.executable, "-m", "uvicorn",
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8081",
        "--reload"
    ])
except KeyboardInterrupt:
    print("\n\nServer stopped.")
