import os
import base64
import logging
import json
from typing import Dict, Any, Optional
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get environment variables
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Default voice ID

class VoiceService:
    """Service for text-to-speech synthesis using ElevenLabs."""
    
    def __init__(self):
        """Initialize the voice service."""
        self.api_key = ELEVENLABS_API_KEY
        self.voice_id = ELEVENLABS_VOICE_ID
        self.client = httpx.AsyncClient(timeout=60.0)
        
        if not self.api_key or self.api_key.startswith("your_"):
            logger.warning("⚠️ No valid ElevenLabs API key found. Voice synthesis will be unavailable.")
            self.enabled = False
        else:
            self.enabled = True
            logger.info(f"🔊 Voice service initialized with voice ID: {self.voice_id}")
    
    async def synthesize_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        stability: float = 0.5,
        similarity_boost: float = 0.5,
        style: float = 0.0,
        use_speaker_boost: bool = True
    ) -> Optional[str]:
        """Convert text to speech using ElevenLabs API.
        
        Args:
            text: The text to convert to speech.
            voice_id: Optional voice ID to use. Defaults to the one in environment.
            stability: Voice stability (0-1).
            similarity_boost: Voice similarity boost (0-1).
            style: Speaking style (0-1).
            use_speaker_boost: Whether to use speaker boost.
            
        Returns:
            Base64-encoded audio data or None if synthesis failed.
        """
        if not self.enabled:
            logger.warning("⚠️ ElevenLabs voice synthesis is not enabled.")
            return None
        
        voice_id_to_use = voice_id or self.voice_id
        
        try:
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id_to_use}"
            
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.api_key
            }
            
            data = {
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": stability,
                    "similarity_boost": similarity_boost,
                    "style": style,
                    "use_speaker_boost": use_speaker_boost
                }
            }
            
            response = await self.client.post(url, json=data, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"❌ ElevenLabs API error: {response.status_code} {response.text}")
                return None
            
            # Get audio data
            audio_data = response.content
            
            # Convert to base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            logger.info(f"✅ Speech synthesized successfully: {len(audio_data)} bytes")
            return audio_base64
        except Exception as e:
            logger.error(f"❌ Error calling ElevenLabs API: {str(e)}")
            return None
    
    async def get_available_voices(self) -> List[Dict[str, Any]]:
        """Get available voices from ElevenLabs.
        
        Returns:
            List of voice objects with ID, name, and other metadata.
        """
        if not self.enabled:
            logger.warning("⚠️ ElevenLabs voice synthesis is not enabled.")
            return []
        
        try:
            url = "https://api.elevenlabs.io/v1/voices"
            
            headers = {
                "Accept": "application/json",
                "xi-api-key": self.api_key
            }
            
            response = await self.client.get(url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"❌ ElevenLabs API error: {response.status_code} {response.text}")
                return []
            
            voices = response.json().get("voices", [])
            logger.info(f"✅ Retrieved {len(voices)} voices from ElevenLabs")
            return voices
        except Exception as e:
            logger.error(f"❌ Error calling ElevenLabs API: {str(e)}")
            return []
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Create a singleton instance for the service
_voice_service = None

def get_voice_service() -> VoiceService:
    """Get the singleton VoiceService instance.
    
    Returns:
        VoiceService instance.
    """
    global _voice_service
    if _voice_service is None:
        _voice_service = VoiceService()
    return _voice_service