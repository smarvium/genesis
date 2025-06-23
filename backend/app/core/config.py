import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings and configuration for Phase 1"""
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = True
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-jwt-key-change-in-production")
    
    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_HOSTS: list = ["localhost", "127.0.0.1"]
    
    # Supabase (Required for Phase 1)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    
    # Redis (Optional for Phase 1, Required for Phase 3)
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    
    # Pinecone (Optional for Phase 1, Required for Phase 3)
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "genesis-memory")
    PINECONE_ENVIRONMENT: str = os.getenv("PINECONE_ENVIRONMENT", "")
    
    # AI Services (Required for Phase 1)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Voice (Optional for Phase 1, Required for Phase 4)
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    
    # Memory Configuration
    AGENT_SHORT_TERM_MEMORY_LIMIT: int = 100
    AGENT_LONG_TERM_MEMORY_DAYS: int = 365
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()