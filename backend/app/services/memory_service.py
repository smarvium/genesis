import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import numpy as np
from app.core.database import db
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class MemoryService:
    """Service for agent memory management with graceful fallbacks"""
    
    def __init__(self):
        self.redis = None
        self.pinecone = None
        
    async def initialize(self):
        """Initialize memory service with available backends"""
        self.redis = db.redis_client if db.redis_available else None
        self.pinecone = db.pinecone_index if db.pinecone_available else None
        
        if not self.redis:
            logger.warning("⚠️ Redis not available - using in-memory fallback for short-term memory")
        if not self.pinecone:
            logger.warning("⚠️ Pinecone not available - long-term memory disabled for Phase 1")
        
    async def store_short_term_memory(self, agent_id: str, memory_data: Dict[str, Any]):
        """Store short-term memory with fallback to database"""
        memory_item = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "data": memory_data
        }
        
        if self.redis and db.redis_available:
            try:
                memory_key = f"agent:{agent_id}:short_memory"
                
                # Add to Redis list (FIFO)
                self.redis.lpush(memory_key, json.dumps(memory_item))
                
                # Trim to memory limit
                self.redis.ltrim(memory_key, 0, settings.AGENT_SHORT_TERM_MEMORY_LIMIT - 1)
                
                # Set expiration
                self.redis.expire(memory_key, timedelta(days=1).total_seconds())
                
                logger.debug(f"✅ Stored short-term memory for agent {agent_id} in Redis")
                return
            except Exception as e:
                logger.warning(f"⚠️ Redis storage failed: {e} - falling back to database")
        
        # Fallback to Supabase for Phase 1
        try:
            db.supabase.table("memories").insert({
                "id": memory_item["id"],
                "agent_id": agent_id,
                "user_id": "dev-user",  # TODO: Get from auth context
                "content": json.dumps(memory_data),
                "memory_type": "interaction",
                "metadata": {"source": "short_term_fallback"},
                "created_at": memory_item["timestamp"]
            }).execute()
            logger.debug(f"✅ Stored short-term memory for agent {agent_id} in Supabase fallback")
        except Exception as e:
            logger.error(f"❌ Failed to store memory in fallback: {e}")
    
    async def get_short_term_memory(self, agent_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Retrieve short-term memory with fallback"""
        
        if self.redis and db.redis_available:
            try:
                memory_key = f"agent:{agent_id}:short_memory"
                memories = self.redis.lrange(memory_key, 0, limit - 1)
                result = [json.loads(memory) for memory in memories]
                logger.debug(f"✅ Retrieved {len(result)} memories for agent {agent_id} from Redis")
                return result
            except Exception as e:
                logger.warning(f"⚠️ Redis retrieval failed: {e} - falling back to database")
        
        # Fallback to Supabase
        try:
            response = db.supabase.table("memories").select("*").eq("agent_id", agent_id).order("created_at", desc=True).limit(limit).execute()
            
            memories = []
            for row in response.data:
                memories.append({
                    "id": row["id"],
                    "timestamp": row["created_at"],
                    "data": json.loads(row["content"]) if row["content"] else {}
                })
            
            logger.debug(f"✅ Retrieved {len(memories)} memories for agent {agent_id} from Supabase fallback")
            return memories
        except Exception as e:
            logger.error(f"❌ Failed to retrieve memories: {e}")
            return []
    
    async def store_long_term_memory(
        self, 
        agent_id: str, 
        content: str, 
        metadata: Dict[str, Any],
        embedding: Optional[List[float]] = None
    ):
        """Store long-term memory (Pinecone or fallback to Supabase)"""
        
        memory_id = f"agent_{agent_id}_{uuid.uuid4()}"
        
        if self.pinecone and db.pinecone_available:
            try:
                # Generate embedding if not provided (mock for now)
                if not embedding:
                    embedding = np.random.rand(1536).tolist()  # Mock embedding
                
                # Prepare metadata
                memory_metadata = {
                    "agent_id": agent_id,
                    "content": content,
                    "timestamp": datetime.utcnow().isoformat(),
                    **metadata
                }
                
                # Store in Pinecone
                self.pinecone.upsert([
                    (memory_id, embedding, memory_metadata)
                ])
                
                logger.debug(f"✅ Stored long-term memory for agent {agent_id} in Pinecone")
                return memory_id
            except Exception as e:
                logger.warning(f"⚠️ Pinecone storage failed: {e} - falling back to database")
        
        # Fallback to Supabase
        try:
            db.supabase.table("memories").insert({
                "id": memory_id,
                "agent_id": agent_id,
                "user_id": "dev-user",  # TODO: Get from auth context
                "content": content,
                "memory_type": "learning",
                "metadata": metadata,
                "importance_score": metadata.get("importance", 0.5),
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            logger.debug(f"✅ Stored long-term memory for agent {agent_id} in Supabase fallback")
            return memory_id
        except Exception as e:
            logger.error(f"❌ Failed to store long-term memory: {e}")
            return None
    
    async def search_long_term_memory(
        self, 
        agent_id: str, 
        query_embedding: List[float], 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Search long-term memory (Pinecone or fallback)"""
        
        if self.pinecone and db.pinecone_available:
            try:
                response = self.pinecone.query(
                    vector=query_embedding,
                    filter={"agent_id": agent_id},
                    top_k=limit,
                    include_metadata=True
                )
                
                results = [
                    {
                        "id": match.id,
                        "score": match.score,
                        "content": match.metadata.get("content", ""),
                        "metadata": match.metadata
                    }
                    for match in response.matches
                ]
                
                logger.debug(f"✅ Retrieved {len(results)} long-term memories for agent {agent_id} from Pinecone")
                return results
            except Exception as e:
                logger.warning(f"⚠️ Pinecone search failed: {e} - falling back to database")
        
        # Fallback to simple database search
        try:
            response = db.supabase.table("memories").select("*").eq("agent_id", agent_id).eq("memory_type", "learning").order("importance_score", desc=True).limit(limit).execute()
            
            results = []
            for row in response.data:
                results.append({
                    "id": row["id"],
                    "score": row.get("importance_score", 0.5),
                    "content": row["content"],
                    "metadata": row.get("metadata", {})
                })
            
            logger.debug(f"✅ Retrieved {len(results)} long-term memories for agent {agent_id} from Supabase fallback")
            return results
        except Exception as e:
            logger.error(f"❌ Failed to search long-term memory: {e}")
            return []
    
    async def get_agent_context(self, agent_id: str) -> Dict[str, Any]:
        """Get comprehensive agent context from all available sources"""
        
        # Get recent short-term memories
        short_term = await self.get_short_term_memory(agent_id, limit=20)
        
        # Get agent state (Redis or fallback)
        agent_state = {}
        if self.redis and db.redis_available:
            try:
                agent_state = self.redis.hgetall(f"agent:{agent_id}:state")
            except Exception as e:
                logger.warning(f"⚠️ Failed to get agent state from Redis: {e}")
        
        return {
            "short_term_memory": short_term,
            "agent_state": agent_state,
            "context_retrieved_at": datetime.utcnow().isoformat(),
            "services_available": {
                "redis": db.redis_available,
                "pinecone": db.pinecone_available
            }
        }
    
    async def update_agent_state(self, agent_id: str, state_updates: Dict[str, Any]):
        """Update agent's current state with fallback"""
        
        if self.redis and db.redis_available:
            try:
                state_key = f"agent:{agent_id}:state"
                
                # Convert all values to strings for Redis
                string_updates = {k: json.dumps(v) if not isinstance(v, str) else v 
                               for k, v in state_updates.items()}
                
                self.redis.hset(state_key, mapping=string_updates)
                self.redis.expire(state_key, timedelta(days=7).total_seconds())
                
                logger.debug(f"✅ Updated agent state for {agent_id} in Redis")
                return
            except Exception as e:
                logger.warning(f"⚠️ Redis state update failed: {e} - falling back to database")
        
        # Fallback to Supabase
        try:
            # Update agent metadata in database
            db.supabase.table("agents").update({
                "metadata": state_updates,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", agent_id).execute()
            
            logger.debug(f"✅ Updated agent state for {agent_id} in Supabase fallback")
        except Exception as e:
            logger.error(f"❌ Failed to update agent state: {e}")

# Global memory service instance
memory_service = MemoryService()