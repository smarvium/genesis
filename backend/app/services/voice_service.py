import httpx
from typing import Optional
from app.core.config import settings

class VoiceService:
    """Service for voice synthesis using ElevenLabs"""
    
    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        self.base_url = "https://api.elevenlabs.io/v1"
        
    async def generate_speech(
        self, 
        text: str, 
        voice_id: str,
        stability: float = 0.5,
        similarity_boost: float = 0.5,
        style: float = 0.0
    ) -> Optional[bytes]:
        """Generate speech from text using ElevenLabs"""
        
        if not self.api_key:
            # Fallback mode - return text only
            print(f"Using voice fallback mode: {text}")
            return None
            
        url = f"{self.base_url}/text-to-speech/{voice_id}"
        
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
                "use_speaker_boost": True
            }
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=data, headers=headers)
                
                if response.status_code == 200:
                    print(f"✅ Voice generation successful: {len(response.content)} bytes")
                    return response.content
                else:
                    print(f"ElevenLabs API error: {response.status_code} - {response.text}")
                    # If we get a 401 (unauthorized), the API key might be invalid
                    if response.status_code == 401:
                        print("⚠️ ElevenLabs API key is invalid or expired")
                    # If we get a 429 (too many requests), we're being rate limited
                    elif response.status_code == 429:
                        print("⚠️ ElevenLabs API rate limit exceeded")
                    return None
                    
        except Exception as e:
            print(f"Voice generation error: {e}")
            return None
    
    async def get_available_voices(self) -> list:
        """Get list of available voices from ElevenLabs"""
        
        if not self.api_key:
            return []
            
        url = f"{self.base_url}/voices"
        headers = {"xi-api-key": self.api_key}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    return response.json().get("voices", [])
                else:
                    return []
                    
        except Exception as e:
            print(f"Error fetching voices: {e}")
            return []

# Global voice service instance
voice_service = VoiceService()