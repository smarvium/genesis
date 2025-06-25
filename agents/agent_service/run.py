import os
import sys
import uvicorn
from dotenv import load_dotenv
import platform
import time

def run_agent_service():
    """Run the FastAPI agent service"""
    # Load environment variables
    load_dotenv()
    
    # Get port from environment or use default
    port = int(os.getenv("AGENT_PORT", "8001"))
    
    # Check if running on Windows to avoid encoding issues
    is_windows = platform.system() == "Windows"
    
    # Ensure the .env file exists
    if not os.path.exists('.env'):
        print("Warning: .env file not found. Using default environment values.")
    
    # Plain text for Windows, emojis for other platforms
    if is_windows:
        print(f"Starting GenesisOS Agent Service on port {port}...")
        print(f"API will be available at http://localhost:{port}")
        print(f"Press CTRL+C to stop the server")
    else:
        print(f"🚀 Starting GenesisOS Agent Service on port {port}...")
        print(f"🌐 API will be available at http://localhost:{port}")
        print(f"📚 API docs available at http://localhost:{port}/docs")
        print(f"ℹ️ Press CTRL+C to stop the server")
    
    # Run the FastAPI server
    try:
        uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
    except Exception as e:
        print(f"Error starting agent service: {e}")
        # If port is already in use, try a different port
        if "address already in use" in str(e).lower():
            new_port = port + 1
            print(f"Port {port} is already in use. Trying port {new_port}...")
            time.sleep(1)  # Small delay
            # Try with a new port
            uvicorn.run("main:app", host="0.0.0.0", port=new_port, reload=True)

if __name__ == "__main__":
    run_agent_service()