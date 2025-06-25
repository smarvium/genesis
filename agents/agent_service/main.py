import os
import json
import logging
import traceback
from typing import Dict, Any, Optional, List, Union
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from lib.memory_service import get_memory_service
from lib.agent_manager import get_agent_manager
from lib.gemini_service import get_gemini_service
from lib.voice_service import get_voice_service

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define API models
class AgentInput(BaseModel):
    input: str
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)

class AgentOutput(BaseModel):
    output: str
    chain_of_thought: str
    status: str = "completed"
    audio: Optional[str] = None

class AgentConfig(BaseModel):
    name: str
    role: str
    description: str
    tools: Optional[List[str]] = Field(default_factory=list)
    personality: Optional[str] = "Professional, helpful, and knowledgeable"
    memory_enabled: Optional[bool] = True
    voice_enabled: Optional[bool] = False
    voice_config: Optional[Dict[str, Any]] = None

# Initialize services
memory_service = get_memory_service()
agent_manager = get_agent_manager()
gemini_service = get_gemini_service()
voice_service = get_voice_service()

# Define shutdown event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # Startup logic - use plain text for Windows compatibility
        logger.info("Starting GenesisOS Agent Service")
        # Initialize services
        yield
        # Shutdown logic
        logger.info("Shutting down GenesisOS Agent Service")
        # Close services
        await memory_service.close()
        await agent_manager.close()
        await gemini_service.close()
        await voice_service.close()
    except Exception as e:
        logger.error(f"Error in lifespan: {e}")
        raise

# Create FastAPI app
app = FastAPI(lifespan=lifespan)

# Configure CORS
# Allowing all origins in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Health check endpoint
@app.get("/")
async def read_root():
    gemini_key = os.getenv("GEMINI_API_KEY")
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
    pinecone_key = os.getenv("PINECONE_API_KEY")
    redis_url = os.getenv("REDIS_URL")
    
    gemini_configured = bool(gemini_key and not gemini_key.startswith('your_'))
    elevenlabs_configured = bool(elevenlabs_key and not elevenlabs_key.startswith('your_'))
    pinecone_configured = bool(pinecone_key and not pinecone_key.startswith('your_'))
    redis_configured = bool(redis_url and not redis_url.startswith('your_'))
    
    logger.info(f"Health check requested. Services: Gemini={gemini_configured}, ElevenLabs={elevenlabs_configured}, Pinecone={pinecone_configured}, Redis={redis_configured}")
    
    return {
        "status": "healthy",
        "message": "GenesisOS Agent Service is running",
        "version": "1.0.0",
        "integrations": {
            "gemini": "configured" if gemini_configured else "not configured",
            "elevenlabs": "configured" if elevenlabs_configured else "not configured",
            "pinecone": "configured" if pinecone_configured else "not configured",
            "redis": "configured" if redis_configured else "not configured"
        },
        "features": {
            "memory": True,
            "voice": elevenlabs_configured,
            "blueprint_generation": gemini_configured
        }
    }

# Execute agent endpoint
@app.post("/agent/{agent_id}/execute", response_model=AgentOutput)
async def execute_agent(agent_id: str, agent_input: AgentInput):
    print(f"Received execute request for agent {agent_id}")
    try:
        input_text = agent_input.input
        context = agent_input.context or {}
        
        logger.info(f"Agent {agent_id} executing with input: {input_text[:50]}...")
        
        # Get execution ID from context or generate one
        execution_id = context.get("executionId", f"exec-{int(time.time())}")
        
        # Add execution ID to context if not present
        if "executionId" not in context:
            context["executionId"] = execution_id
        
        # Note if this is a test/simulation
        is_simulation = context.get("isSimulation", False)
        logger.info(f"Execution {execution_id} is simulation: {is_simulation}")
        
        # Execute the agent
        output, chain_of_thought = await agent_manager.execute_agent(
            agent_id=agent_id,
            input_text=input_text,
            context=context
        )
        
        # Handle voice synthesis if enabled
        audio_data = None
        if context.get("voice_enabled", False) and voice_service.enabled:
            voice_id = context.get("voice_id")
            audio_data = await voice_service.synthesize_speech(
                text=output,
                voice_id=voice_id
            )
        
        # Log execution
        logger.info(f"✅ Agent {agent_id} completed execution for {execution_id}")
        
        return AgentOutput(
            output=output,
            chain_of_thought=chain_of_thought,
            status="completed",
            audio=audio_data
        )
    except Exception as e:
        logger.error(f"Error executing agent {agent_id}: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={
                "error": f"Agent execution failed: {str(e)}",
                "status": "error"
            }
        )

# Agent configuration endpoint
@app.post("/agent/{agent_id}/configure")
async def configure_agent(agent_id: str, config: AgentConfig):
    try:
        logger.info(f"Configuring agent {agent_id}: {config.name}")
        # Validate and store the agent configuration
        # In a real implementation, this would save to a database
        
        # Store in memory for now
        agent_config = {
            "id": agent_id,
            "name": config.name,
            "role": config.role,
            "description": config.description,
            "tools": config.tools,
            "personality": config.personality,
            "memory_enabled": config.memory_enabled,
            "voice_enabled": config.voice_enabled,
            "voice_config": config.voice_config
        }
        
        logger.info(f"Agent configuration updated for {agent_id} with name {config.name}")
        
        return {
            "success": True,
            "message": f"Agent {agent_id} configured successfully",
            "agent_id": agent_id,
            "config": agent_config
        }
    except Exception as e:
        logger.error(f"Error configuring agent {agent_id}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": f"Agent configuration failed: {str(e)}",
                "status": "error"
            }
        )

# Endpoint to clear agent memory
@app.post("/agent/{agent_id}/clear-memory")
async def clear_agent_memory(agent_id: str):
    try:
        logger.info(f"Clearing memory for agent {agent_id}")
        
        success = await memory_service.clear_agent_memories(agent_id)
        
        if success:
            return {
                "success": True,
                "message": f"Memory cleared for agent {agent_id}"
            }
        else:
            return {
                "success": False,
                "message": f"Failed to clear memory for agent {agent_id}"
            }
    except Exception as e:
        logger.error(f"Error clearing memory for agent {agent_id}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": f"Memory clearing failed: {str(e)}",
                "status": "error"
            }
        )

# Endpoint to retrieve agent memories
@app.get("/agent/{agent_id}/memories")
async def get_agent_memories(agent_id: str, limit: int = 10):
    try:
        logger.info(f"Retrieving memories for agent {agent_id}")
        
        memories = await memory_service.retrieve_recent_memories(agent_id, limit=limit)
        
        return {
            "agent_id": agent_id,
            "memories": memories,
            "count": len(memories)
        }
    except Exception as e:
        logger.error(f"Error retrieving memories for agent {agent_id}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": f"Memory retrieval failed: {str(e)}",
                "status": "error"
            }
        )

# Endpoint to synthesize speech
@app.post("/synthesize-speech")
async def synthesize_speech(
    text: str = Body(..., embed=True),
    voice_id: Optional[str] = Body(None, embed=True)
):
    try:
        logger.info(f"Synthesizing speech: {text[:50]}...")
        
        if not voice_service.enabled:
            return JSONResponse(
                status_code=400,
                content={
                    "error": "Voice synthesis is not enabled. Please configure ElevenLabs API key.",
                    "status": "error"
                }
            )
        
        audio_data = await voice_service.synthesize_speech(
            text=text,
            voice_id=voice_id
        )
        
        if audio_data:
            return {
                "success": True,
                "audio": audio_data
            }
        else:
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Failed to synthesize speech",
                    "status": "error"
                }
            )
    except Exception as e:
        logger.error(f"Error synthesizing speech: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": f"Speech synthesis failed: {str(e)}",
                "status": "error"
            }
        )

# Blueprint generation endpoint
@app.post("/generate-blueprint")
async def generate_blueprint(
    user_input: str = Body(..., embed=True)
):
    try:
        logger.info(f"Generating blueprint for: {user_input[:50]}...")
        
        if not gemini_service.api_key or gemini_service.api_key.startswith("your_"):
            return JSONResponse(
                status_code=400,
                content={
                    "error": "Gemini API key is not configured. Please set GEMINI_API_KEY in .env file.",
                    "status": "error"
                }
            )
        
        blueprint = await gemini_service.generate_blueprint(user_input)
        
        logger.info(f"✅ Blueprint generated successfully: {blueprint['id']}")
        
        return blueprint
    except Exception as e:
        logger.error(f"Error generating blueprint: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": f"Blueprint generation failed: {str(e)}",
                "status": "error"
            }
        )
    

# Main entry point
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AGENT_PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)