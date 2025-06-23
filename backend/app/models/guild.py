from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.base import TimestampedModel, GuildStatus

class Guild(TimestampedModel):
    """Guild model representing a department/team"""
    id: str
    name: str
    description: str
    purpose: str
    user_id: str
    status: GuildStatus = GuildStatus.DRAFT
    metadata: Dict[str, Any] = Field(default_factory=dict)

class CreateGuildRequest(BaseModel):
    """Request model for creating a guild"""
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    purpose: str = Field(..., min_length=1, max_length=1000)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class UpdateGuildRequest(BaseModel):
    """Request model for updating a guild"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    purpose: Optional[str] = Field(None, min_length=1, max_length=1000)
    status: Optional[GuildStatus] = None
    metadata: Optional[Dict[str, Any]] = None

class GuildResponse(BaseModel):
    """Response model for guild operations"""
    id: str
    name: str
    description: str
    purpose: str
    status: GuildStatus
    agents_count: int = 0
    workflows_count: int = 0
    created_at: str
    updated_at: str