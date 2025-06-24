@echo off
REM GenesisOS Backend Setup Script for Windows
echo 🔧 Setting up GenesisOS Backend...

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    exit /b 1
)

echo 📍 Using Python:
python --version

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 🔄 Creating virtual environment...
    python -m venv venv
) else (
    echo ✅ Virtual environment already exists
)

REM Activate virtual environment and install dependencies
echo 📦 Installing dependencies...
call venv\Scripts\activate

REM Upgrade pip first
pip install --upgrade pip

REM Install requirements
pip install -r requirements.txt

echo ✅ Backend setup complete!
echo 🚀 To start the backend server:
echo    cd backend
echo    venv\Scripts\activate
echo    python run.py