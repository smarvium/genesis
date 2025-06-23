from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.base import TimestampedModel, AgentStatus, ToolType

class AgentTool(BaseModel):
    """Agent tool configuration"""
    id: str
    name: str
    type: ToolType
    config: Dict[str, Any] = Field(default_factory=dict)
    credentials: Optional[Dict[str, str]] = Field(default_factory=dict)

class AgentMemoryConfig(BaseModel):
    """Agent memory configuration"""
    short_term_enabled: bool = True
    long_term_enabled: bool = True
    memory_limit: int = 100
    retention_days: int = 365

class VoiceConfig(BaseModel):
    """Agent voice configuration"""
    enabled: bool = True
    voice_id: str = ""
    voice_name: str = "Default"
    stability: float = 0.5
    similarity_boost: float = 0.5
    style: float = 0.0

class Agent(TimestampedModel):
    """Agent model representing a digital worker"""
    id: str
    name: str
    role: str
    description: str
    guild_id: str
    personality: str
    instructions: str
    tools: List[AgentTool] = Field(default_factory=list)
    memory_config: AgentMemoryConfig = Field(default_factory=AgentMemoryConfig)
    voice_config: VoiceConfig = Field(default_factory=VoiceConfig)
    status: AgentStatus = AgentStatus.INITIALIZING
    metadata: Dict[str, Any] = Field(default_factory=dict)

class CreateAgentRequest(BaseModel):
    """Request model for creating an agent"""
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    guild_id: str
    personality: str = Field(..., min_length=1, max_length=1000)
    instructions: str = Field(..., min_length=1, max_length=2000)
    tools: Optional[List[AgentTool]] = Field(default_factory=list)
    memory_config: Optional[AgentMemoryConfig] = Field(default_factory=AgentMemoryConfig)
    voice_config: Optional[VoiceConfig] = Field(default_factory=VoiceConfig)

class AgentResponse(BaseModel):
    """Response model for agent operations"""
    id: str
    name: str
    role: str
    description: str
    guild_id: str
    status: AgentStatus
    tools_count: int = 0
    memory_enabled: bool = True
    voice_enabled: bool = True
    created_at: str
    updated_at: str