#!/usr/bin/env python3
"""
Backend Setup Script - Ensures all dependencies are installed correctly
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors gracefully"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(f"   Output: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed")
        print(f"   Error: {e.stderr}")
        return False

def main():
    print("🚀 GenesisOS Backend Setup")
    print("=" * 50)
    
    # Check if we're in the backend directory
    if not os.path.exists("requirements.txt"):
        print("❌ Error: requirements.txt not found. Make sure you're in the backend directory.")
        sys.exit(1)
    
    # Check Python version
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print(f"❌ Error: Python 3.8+ required. You have {python_version.major}.{python_version.minor}")
        sys.exit(1)
    
    print(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro} detected")
    
    # Upgrade pip
    if not run_command("python -m pip install --upgrade pip", "Upgrading pip"):
        sys.exit(1)
    
    # Install requirements
    if not run_command("pip install -r requirements.txt", "Installing Python dependencies"):
        print("\n🔧 Trying alternative installation methods...")
        
        # Try with --no-cache-dir
        if not run_command("pip install -r requirements.txt --no-cache-dir", "Installing with no cache"):
            sys.exit(1)
    
    # Verify critical packages
    critical_packages = ["fastapi", "uvicorn", "supabase", "google-generativeai"]
    
    print("\n🔍 Verifying critical packages...")
    for package in critical_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ {package} installed correctly")
        except ImportError:
            print(f"❌ {package} not found, attempting individual install...")
            if not run_command(f"pip install {package}", f"Installing {package}"):
                print(f"⚠️ Warning: Could not install {package}")
    
    # Test import of main app
    try:
        sys.path.insert(0, os.getcwd())
        from app.main import app
        print("✅ FastAPI app imports successfully")
    except Exception as e:
        print(f"❌ Error importing FastAPI app: {e}")
        sys.exit(1)
    
    print("\n🎉 Backend setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Set up your .env file with API keys")
    print("2. Run: python run.py")
    print("3. Visit: http://localhost:8000/docs")

if __name__ == "__main__":
    main()