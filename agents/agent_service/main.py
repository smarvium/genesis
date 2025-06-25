import os
import json
import logging
import traceback
from typing import Dict, Any, Optional, List, Union
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define API models
class AgentInput(BaseModel):
    input: str
    context: Dict[str, Any] = Field(default_factory=dict)

class AgentOutput(BaseModel):
    output: str
    chain_of_thought: str
    status: str = "completed"

class AgentConfig(BaseModel):
    name: str
    role: str
    description: str
    tools: List[str] = Field(default_factory=list)
    personality: Optional[str] = None

# Define shutdown event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic - use plain text for Windows compatibility
    logger.info("Starting GenesisOS Agent Service")
    yield
    # Shutdown logic
    logger.info("Shutting down GenesisOS Agent Service")

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
    print(f"Health check requested. Gemini configured: {gemini_key and not gemini_key.startswith('your_')}")
    
    return {
        "status": "healthy",
        "message": "GenesisOS Agent Service is running",
        "version": "1.0.0",
        "integrations": {
            "gemini": "configured" if gemini_key and not gemini_key.startswith("your_") else "not configured",
            "elevenlabs": "configured" if elevenlabs_key and not elevenlabs_key.startswith("your_") else "not configured"
        }
    }

# Execute agent endpoint
@app.post("/agent/{agent_id}/execute", response_model=AgentOutput)
async def execute_agent(agent_id: str, agent_input: AgentInput):
    print(f"Received execute request for agent {agent_id}")
    try:
        logger.info(f"Agent {agent_id} executing with input: {agent_input.input[:50]}...")
        
        # Extract context
        context = agent_input.context
        execution_id = context.get("executionId", "unknown")
        
        # Check if this is a test/simulation
        is_simulation = context.get("isSimulation", False)
        
        # Process the input using the appropriate agent
        # In a real implementation, this would use Gemini API or other LLM
        output, chain_of_thought = process_agent_request(agent_id, agent_input.input, context)
        
        # Log execution
        logger.info(f"Agent {agent_id} completed execution for {execution_id}")
        
        return AgentOutput(
            output=output,
            chain_of_thought=chain_of_thought,
            status="completed"
        )
    except Exception as e:
        logger.error(f"Error executing agent {agent_id}: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")

# Agent configuration endpoint
@app.post("/agent/{agent_id}/configure")
async def configure_agent(agent_id: str, config: AgentConfig):
    try:
        logger.info(f"Configuring agent {agent_id}: {config.name}")
        
        # In a real implementation, this would update agent configuration in a database
        print(f"Agent configuration updated for {agent_id} with name {config.name}")
        
        return {
            "success": True,
            "message": f"Agent {agent_id} configured successfully",
            "agent_id": agent_id
        }
    except Exception as e:
        logger.error(f"Error configuring agent {agent_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Agent configuration failed: {str(e)}")

# Process agent request with appropriate AI model
def process_agent_request(agent_id: str, input_text: str, context: Dict[str, Any]) -> tuple[str, str]:
    """Process the agent request using Gemini or a fallback mechanism"""
    
    # Check if Gemini API key is available
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    if gemini_key and not gemini_key.startswith("your_"):
        try:
            # In a real implementation, this would call the Gemini API
            # For now, we'll simulate a response
            return use_gemini_to_process(agent_id, input_text, context)
        except Exception as e:
            logger.error(f"❌ Gemini API call failed: {str(e)}")
            logger.info("Falling back to local mock response")
    
    # Fallback to mock responses
    return get_mock_response(agent_id, input_text, context)

def use_gemini_to_process(agent_id: str, input_text: str, context: Dict[str, Any]) -> tuple[str, str]:
    """Simulate processing with Gemini"""
    
    # This would be implemented with the actual Gemini API client
    # For now, we'll return enhanced mock responses
    
    if agent_id == "seo_ghostwriter":
        output = f"I've crafted a comprehensive SEO article about '{input_text}' with strategic keywords, meta description suggestions, and h1/h2/h3 structure for maximum search visibility."
        cot = "1. Analyzed topic relevance\n2. Researched primary and secondary keywords\n3. Structured content with SEO best practices\n4. Incorporated semantic relevance signals"
    elif agent_id == "business_analyst":
        output = f"Based on my analysis of '{input_text}', I've identified 3 key business opportunities and 2 potential challenges. The most promising direction appears to be expanding into the European market, with an estimated 32% growth potential."
        cot = "1. Examined market data and trends\n2. Applied financial modeling to scenario outcomes\n3. Identified key growth vectors and constraints\n4. Prioritized opportunities by ROI and feasibility"
    elif agent_id == "customer_support":
        output = f"I've prepared a thoughtful response to the customer inquiry about '{input_text}'. The response addresses their immediate concerns while also suggesting relevant premium features that could enhance their experience."
        cot = "1. Identified core customer issue\n2. Located relevant documentation and policies\n3. Crafted empathetic, solution-focused response\n4. Added personalized product recommendations"
    else:
        output = f"I've processed your request about '{input_text}' and created a comprehensive response that addresses all key points while maintaining a professional, helpful tone."
        cot = f"1. Analyzed the input request\n2. Identified key requirements\n3. Generated appropriate response for agent {agent_id}\n4. Verified alignment with user goals"
    
    return output, cot

def get_mock_response(agent_id: str, input_text: str, context: Dict[str, Any]) -> tuple[str, str]:
    """Generate mock responses for different agent types"""
    
    if agent_id == "seo_ghostwriter":
        output = f"Here's an SEO-optimized article about '{input_text}'."
        cot = "I analyzed the topic, identified keywords, and structured an article outline."
    elif agent_id == "business_analyst":
        output = f"Based on my analysis of '{input_text}', I recommend focusing on expanding market share in the SMB segment."
        cot = "I examined current metrics, identified growth opportunities, and evaluated ROI potential."
    elif agent_id == "customer_support":
        output = f"I understand you're having an issue with '{input_text}'. Here's how to resolve it step by step."
        cot = "I identified the customer's problem, found the relevant solution, and created clear instructions."
    elif agent_id == "data_scientist":
        output = f"After analyzing the data related to '{input_text}', I've discovered interesting patterns that suggest seasonal trends."
        cot = "I cleaned the dataset, applied statistical methods, and visualized the key patterns."
    else:
        output = f"I've processed your request about '{input_text}' and here's my response."
        cot = f"Simulated processing for agent {agent_id}."
    
    return output, cot

# Main entry point
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AGENT_PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)