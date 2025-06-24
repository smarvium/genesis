from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.base import TimestampedModel

class BlueprintAgent(BaseModel):
    """Agent blueprint from AI generation"""
    name: str
    role: str
    description: str
    tools_needed: List[str]

class BlueprintWorkflow(BaseModel):
    """Workflow blueprint from AI generation"""
    name: str
    description: str
    trigger_type: str

class SuggestedStructure(BaseModel):
    """AI-suggested guild structure"""
    guild_name: str
    guild_purpose: str
    agents: List[BlueprintAgent]
    workflows: List[BlueprintWorkflow]

class Blueprint(TimestampedModel):
    """Blueprint model for AI-generated guild structure"""
    id: str
    user_input: str
    interpretation: str
    suggested_structure: SuggestedStructure
    status: str = "pending"

class GenerateBlueprintRequest(BaseModel):
    """Request model for blueprint generation"""
    user_input: str = Field(..., min_length=10, max_length=2000)

class BlueprintResponse(BaseModel):
    """Response model for blueprint operations"""
    id: str
    user_input: str
    interpretation: str
    suggested_structure: SuggestedStructure
    status: str
    created_at: str