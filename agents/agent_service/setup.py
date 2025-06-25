import os
import subprocess
import platform
import sys
import shutil

def setup_environment():
    """Setup the Python environment and install dependencies"""
    print("🚀 Setting up GenesisOS Agent Service...")

    # Create .env file if it doesn't exist
    if not os.path.exists('.env'):
        if os.path.exists('.env.example'):
            print("Creating .env file from example...")
            shutil.copy('.env.example', '.env')
            print("⚠️  Please update the .env file with your actual API keys!")
        else:
            print("Creating basic .env file...")
            with open('.env', 'w') as f:
                f.write("AGENT_PORT=8001\n")
                f.write("GEMINI_API_KEY=your_gemini_api_key\n")
                f.write("ELEVENLABS_API_KEY=your_elevenlabs_api_key\n")
                f.write("ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id\n")
                f.write("PINECONE_API_KEY=your_pinecone_api_key\n")
                f.write("PINECONE_ENVIRONMENT=your_pinecone_environment\n")
            print("⚠️  .env file created with placeholder values. Please update with actual keys!")

    # Install required packages
    print("Installing required Python packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Python packages installed successfully!")
    except subprocess.CalledProcessError:
        print("❌ Failed to install packages. Please check your environment and try again.")
        return False

    print("\n✅ Agent Service setup completed successfully!")
    print("\nTo run the agent service, use one of the following commands:")
    print("  - python run.py")
    print("  - python -m uvicorn main:app --reload --port 8001")
    return True

if __name__ == "__main__":
    setup_environment()