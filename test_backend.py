#!/usr/bin/env python3
"""Test script to diagnose backend issues"""

import sys
print(f"Python version: {sys.version}")
print(f"Python path: {sys.executable}")
print("\nChecking dependencies...")

try:
    import fastapi
    print(f"✓ FastAPI {fastapi.__version__}")
except ImportError as e:
    print(f"✗ FastAPI not installed: {e}")

try:
    import uvicorn
    print(f"✓ Uvicorn {uvicorn.__version__}")
except ImportError as e:
    print(f"✗ Uvicorn not installed: {e}")

try:
    import pydantic
    print(f"✓ Pydantic {pydantic.__version__}")
except ImportError as e:
    print(f"✗ Pydantic not installed: {e}")

try:
    from pydantic_settings import BaseSettings
    print(f"✓ Pydantic Settings installed")
except ImportError as e:
    print(f"✗ Pydantic Settings not installed: {e}")

try:
    import httpx
    print(f"✓ HTTPX {httpx.__version__}")
except ImportError as e:
    print(f"✗ HTTPX not installed: {e}")

print("\nTrying to import app...")
try:
    from app.main import app
    print("✓ App imported successfully")
    print(f"✓ App title: {app.title}")
except Exception as e:
    print(f"✗ Failed to import app: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*50)
print("If you see errors above, run:")
print("  pip install -r requirements.txt")
print("\nThen start the server with:")
print("  uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload")
