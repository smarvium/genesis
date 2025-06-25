import os
import sys
import uvicorn
from dotenv import load_dotenv

def run_agent_service():
    """Run the FastAPI agent service"""
    # Load environment variables
    load_dotenv()
    
    # Get port from environment or use default
    port = int(os.getenv("AGENT_PORT", "8001"))
    
    print(f"🚀 Starting GenesisOS Agent Service on port {port}...")
    print("ℹ️  Press CTRL+C to stop the server")
    
    # Run the FastAPI server
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

if __name__ == "__main__":
    run_agent_service()