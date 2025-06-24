#!/usr/bin/env python3
"""
GenesisOS Backend Server
Run with: python run.py
"""

import sys
import os
import uvicorn
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from app.main import app
    from app.core.config import settings
except ImportError as e:
    print("❌ Import Error:", str(e))
    print("\n🔧 It looks like dependencies aren't installed. Please run:")
    print("   python setup_backend.py")
    print("\nOr manually install:")
    print("   pip install -r requirements.txt")
    sys.exit(1)

if __name__ == "__main__":
    print("🚀 Starting GenesisOS Backend Server...")
    print(f"📍 Host: {settings.API_HOST}:{settings.API_PORT}")
    print(f"🔧 Debug: {settings.DEBUG}")
    print(f"🌐 Frontend: {settings.FRONTEND_URL}")
    print("📚 API Docs: http://localhost:8000/docs")
    print("🔗 Health Check: http://localhost:8000/health")
    
    try:
        uvicorn.run(
            "app.main:app",
            host=settings.API_HOST,
            port=settings.API_PORT,
            reload=settings.DEBUG,
            workers=1,
            log_level="info"
        )
    except Exception as e:
        print(f"❌ Server failed to start: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Check if port 8000 is available")
        print("2. Verify .env file configuration") 
        print("3. Ensure all dependencies are installed")