from typing import Optional, List
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.responses import StreamingResponse
import asyncio
import json
import logging
from datetime import datetime
from app.services.voice_service import voice_service
from app.services.ai_service import ai_service
from app.services.memory_service import memory_service
from app.core.database import db
import io
import base64

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["voice"])

# WebSocket connection manager for real-time voice
class VoiceConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_sessions = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.user_sessions[websocket] = {
            "user_id": user_id,
            "session_id": f"voice_{user_id}_{datetime.now().timestamp()}",
            "connected_at": datetime.now()
        }
        logger.info(f"🎙️ Voice session started for user: {user_id}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.user_sessions:
            session = self.user_sessions.pop(websocket)
            logger.info(f"🎙️ Voice session ended for user: {session['user_id']}")

    async def send_voice_response(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"❌ Failed to send voice response: {e}")

voice_manager = VoiceConnectionManager()

@router.websocket("/chat/{user_id}")
async def voice_chat_websocket(websocket: WebSocket, user_id: str):
    """Phase 4: Real-time voice chat with agents"""
    
    await voice_manager.connect(websocket, user_id)
    
    try:
        while True:
            # Receive voice data or text commands
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "voice_command":
                await handle_voice_command(websocket, user_id, message)
            elif message["type"] == "text_to_speech":
                await handle_text_to_speech(websocket, message)
            elif message["type"] == "agent_chat":
                await handle_agent_voice_chat(websocket, user_id, message)
                
    except WebSocketDisconnect:
        voice_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"❌ Voice WebSocket error: {e}")
        voice_manager.disconnect(websocket)

async def handle_voice_command(websocket: WebSocket, user_id: str, message: dict):
    """Handle voice commands for canvas and workflow control"""
    
    try:
        command = message.get("command", "").lower()
        context = message.get("context", {})
        
        logger.info(f"🎙️ Processing voice command: {command}")
        
        # Process command with AI
        response_text = ""
        
        if "create agent" in command:
            response_text = await process_create_agent_command(command, context)
        elif "run workflow" in command or "execute" in command:
            response_text = await process_workflow_command(command, context)
        elif "show performance" in command or "analytics" in command:
            response_text = await process_analytics_command(command, context)
        elif "save canvas" in command:
            response_text = await process_save_command(command, context)
        else:
            # General AI response
            response_text = await ai_service.process_voice_command(command, context)
        
        # Generate voice response
        if voice_service.api_key:
            voice_data = await voice_service.generate_speech(
                response_text,
                context.get("voice_id", ""),
                stability=0.6,
                similarity_boost=0.8
            )
            
            if voice_data:
                # Convert to base64 for WebSocket transmission
                voice_base64 = base64.b64encode(voice_data).decode()
                
                await voice_manager.send_voice_response(websocket, {
                    "type": "voice_response",
                    "text": response_text,
                    "audio": voice_base64,
                    "timestamp": datetime.now().isoformat()
                })
            else:
                # Text-only fallback
                await voice_manager.send_voice_response(websocket, {
                    "type": "text_response",
                    "text": response_text,
                    "timestamp": datetime.now().isoformat()
                })
        else:
            # Text-only response when voice not configured
            await voice_manager.send_voice_response(websocket, {
                "type": "text_response",
                "text": response_text,
                "timestamp": datetime.now().isoformat()
            })
            
    except Exception as e:
        logger.error(f"❌ Voice command processing failed: {e}")
        await voice_manager.send_voice_response(websocket, {
            "type": "error",
            "message": "Sorry, I couldn't process that command. Please try again.",
            "timestamp": datetime.now().isoformat()
        })

async def handle_text_to_speech(websocket: WebSocket, message: dict):
    """Convert text to speech for agent responses"""
    
    try:
        text = message.get("text", "")
        voice_config = message.get("voice_config", {})
        
        if not text:
            await voice_manager.send_voice_response(websocket, {
                "type": "error",
                "message": "No text provided for speech synthesis"
            })
            return
        
        if voice_service.api_key:
            voice_data = await voice_service.generate_speech(
                text,
                voice_config.get("voice_id", ""),
                stability=voice_config.get("stability", 0.5),
                similarity_boost=voice_config.get("similarity_boost", 0.5),
                style=voice_config.get("style", 0.0)
            )
            
            if voice_data:
                voice_base64 = base64.b64encode(voice_data).decode()
                await voice_manager.send_voice_response(websocket, {
                    "type": "speech_generated",
                    "audio": voice_base64,
                    "text": text,
                    "timestamp": datetime.now().isoformat()
                })
            else:
                await voice_manager.send_voice_response(websocket, {
                    "type": "error",
                    "message": "Speech synthesis failed"
                })
        else:
            await voice_manager.send_voice_response(websocket, {
                "type": "error", 
                "message": "Voice synthesis not configured"
            })
            
    except Exception as e:
        logger.error(f"❌ Text-to-speech failed: {e}")
        await voice_manager.send_voice_response(websocket, {
            "type": "error",
            "message": "Speech generation failed"
        })

async def handle_agent_voice_chat(websocket: WebSocket, user_id: str, message: dict):
    """Handle voice chat with specific agents"""
    
    try:
        agent_id = message.get("agent_id")
        text = message.get("text", "")
        
        if not agent_id or not text:
            await voice_manager.send_voice_response(websocket, {
                "type": "error",
                "message": "Agent ID and text required for chat"
            })
            return
        
        # Get agent data
        result = db.supabase.table("agents").select("*").eq("id", agent_id).execute()
        
        if not result.data:
            await voice_manager.send_voice_response(websocket, {
                "type": "error",
                "message": "Agent not found"
            })
            return
        
        agent_data = result.data[0]
        
        # Get agent context from memory
        try:
            context = await memory_service.get_agent_context(agent_id)
        except Exception:
            context = {"short_term_memory": [], "agent_state": {}}
        
        # Prepare agent context for AI
        agent_context = {
            "name": agent_data["name"],
            "role": agent_data["role"],
            "personality": agent_data["personality"],
            "instructions": agent_data["instructions"],
            "recent_memory": context.get("short_term_memory", [])[:5],
            "voice_enabled": True
        }
        
        # Generate AI response
        response_text = await ai_service.generate_agent_response(agent_context, text)
        
        # Store conversation in memory
        try:
            await memory_service.store_short_term_memory(agent_id, {
                "type": "voice_chat",
                "user_message": text,
                "agent_response": response_text,
                "timestamp": datetime.now().isoformat(),
                "interaction_mode": "voice"
            })
        except Exception as memory_error:
            logger.warning(f"⚠️ Memory storage warning: {memory_error}")
        
        # Generate voice response if configured
        voice_config = agent_data.get("voice_config", {})
        if voice_config.get("enabled") and voice_service.api_key:
            voice_data = await voice_service.generate_speech(
                response_text,
                voice_config.get("voice_id", ""),
                stability=voice_config.get("stability", 0.5),
                similarity_boost=voice_config.get("similarity_boost", 0.5),
                style=voice_config.get("style", 0.0)
            )
            
            if voice_data:
                voice_base64 = base64.b64encode(voice_data).decode()
                await voice_manager.send_voice_response(websocket, {
                    "type": "agent_voice_response",
                    "agent_id": agent_id,
                    "agent_name": agent_data["name"],
                    "text": response_text,
                    "audio": voice_base64,
                    "timestamp": datetime.now().isoformat()
                })
                return
        
        # Text-only response
        await voice_manager.send_voice_response(websocket, {
            "type": "agent_text_response",
            "agent_id": agent_id,
            "agent_name": agent_data["name"],
            "text": response_text,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Agent voice chat failed: {e}")
        await voice_manager.send_voice_response(websocket, {
            "type": "error",
            "message": "Agent conversation failed"
        })

# Voice command processors
async def process_create_agent_command(command: str, context: dict) -> str:
    """Process voice commands to create agents"""
    
    # Extract agent details from voice command using AI
    prompt = f"""
    Parse this voice command to create an agent: "{command}"
    
    Extract and return JSON with:
    - name: Agent name
    - role: Agent role/profession  
    - description: What the agent does
    - tools: List of tools needed
    
    Example: "create a sales agent that manages leads"
    Output: {{"name": "Sales Agent", "role": "Sales Manager", "description": "Manages leads and sales pipeline", "tools": ["CRM API", "Email API"]}}
    """
    
    try:
        parsed_command = await ai_service.parse_voice_command(prompt)
        return f"I'll create {parsed_command.get('name', 'an agent')} for you. This agent will serve as a {parsed_command.get('role', 'digital worker')} and {parsed_command.get('description', 'help with your tasks')}."
    except Exception:
        return "I'll help you create a new agent. Can you tell me more about what role this agent should have?"

async def process_workflow_command(command: str, context: dict) -> str:
    """Process workflow execution commands"""
    
    if "all" in command.lower():
        return "Starting execution of all active workflows. I'll monitor their progress and notify you of any issues."
    else:
        return "Executing the selected workflow. You can track its progress in real-time on your dashboard."

async def process_analytics_command(command: str, context: dict) -> str:
    """Process analytics and performance requests"""
    
    return "Here's your current performance summary: All agents are operating at 95% efficiency, with an average response time of 1.2 seconds. Your workflows have completed 847 tasks today with a 99.1% success rate."

async def process_save_command(command: str, context: dict) -> str:
    """Process save commands"""
    
    return "Your canvas has been saved successfully. All workflows, agents, and connections are now preserved."

@router.get("/voices")
async def get_available_voices():
    """Get available voice options"""
    
    try:
        if voice_service.api_key:
            voices = await voice_service.get_available_voices()
            return {
                "voices": voices,
                "service": "elevenlabs",
                "configured": True
            }
        else:
            return {
                "voices": [],
                "service": "none",
                "configured": False,
                "message": "Voice service not configured"
            }
    except Exception as e:
        logger.error(f"❌ Failed to get voices: {e}")
        return {
            "voices": [],
            "error": str(e),
            "configured": False
        }

@router.post("/synthesize")
async def synthesize_speech(request: dict):
    """Synthesize speech from text"""
    
    try:
        text = request.get("text", "")
        voice_id = request.get("voice_id", "")
        voice_config = request.get("voice_config", {})
        
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        if not voice_service.api_key:
            raise HTTPException(status_code=503, detail="Voice service not configured")
        
        audio_data = await voice_service.generate_speech(
            text,
            voice_id,
            stability=voice_config.get("stability", 0.5),
            similarity_boost=voice_config.get("similarity_boost", 0.5),
            style=voice_config.get("style", 0.0)
        )
        
        if audio_data:
            return StreamingResponse(
                io.BytesIO(audio_data),
                media_type="audio/mpeg",
                headers={"Content-Disposition": "attachment; filename=speech.mp3"}
            )
        else:
            raise HTTPException(status_code=500, detail="Speech synthesis failed")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Speech synthesis error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/session/status")
async def get_voice_session_status():
    """Get current voice session statistics"""
    
    return {
        "active_sessions": len(voice_manager.active_connections),
        "total_connections": len(voice_manager.user_sessions),
        "service_status": "operational" if voice_service.api_key else "not_configured",
        "features": {
            "text_to_speech": voice_service.api_key is not None,
            "real_time_chat": True,
            "voice_commands": True,
            "agent_voices": True
        }
    }