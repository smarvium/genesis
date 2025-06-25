import os
import time
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
import httpx
from uuid import uuid4
import asyncio
import redis.asyncio as redis
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get environment variables
REDIS_URL = os.getenv("REDIS_URL")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class MemoryService:
    """Service for storing and retrieving agent memory."""
    
    def __init__(self):
        """Initialize the memory service."""
        self.redis_client = None
        self.pinecone_client = None
        self.memory_cache = {}  # In-memory fallback
        
        # Initialize Redis if URL is provided
        if REDIS_URL and not REDIS_URL.startswith("your_"):
            try:
                self.redis_client = redis.from_url(REDIS_URL)
                logger.info("✅ Connected to Redis for memory service")
            except Exception as e:
                logger.error(f"❌ Failed to connect to Redis: {str(e)}")
                logger.info("⚠️ Using in-memory cache for memory service")
        else:
            logger.info("⚠️ Redis URL not provided, using in-memory cache")
        
        # Initialize Pinecone client if API key is provided
        # In a full implementation, we would connect to Pinecone for vector storage
        if PINECONE_API_KEY and not PINECONE_API_KEY.startswith("your_"):
            logger.info("✅ Pinecone API key found for long-term memory")
        else:
            logger.info("⚠️ Pinecone not configured, long-term memory will be limited")
    
    async def store_memory(
        self,
        agent_id: str,
        content: str,
        memory_type: str = "interaction",
        metadata: Optional[Dict[str, Any]] = None,
        importance: float = 0.5,
        user_id: Optional[str] = None,
        expiration: Optional[int] = None
    ) -> str:
        """Store a memory for an agent.
        
        Args:
            agent_id: The ID of the agent.
            content: The content of the memory.
            memory_type: The type of memory (interaction, learning, etc.).
            metadata: Additional metadata about the memory.
            importance: Importance score (0-1).
            user_id: User ID associated with this memory.
            expiration: Optional TTL in seconds.
            
        Returns:
            The memory ID.
        """
        memory_id = str(uuid4())
        timestamp = int(time.time())
        
        memory = {
            "id": memory_id,
            "agent_id": agent_id,
            "content": content,
            "type": memory_type,
            "metadata": metadata or {},
            "importance": importance,
            "created_at": timestamp,
            "user_id": user_id
        }
        
        # Try to store in Redis first
        if self.redis_client:
            try:
                key = f"memory:{agent_id}:{memory_id}"
                await self.redis_client.set(key, json.dumps(memory))
                
                # Set expiration if specified
                if expiration:
                    await self.redis_client.expire(key, expiration)
                
                # Add to memory index for agent
                await self.redis_client.zadd(
                    f"memory_index:{agent_id}",
                    {memory_id: timestamp}
                )
                
                # Add to importance index
                await self.redis_client.zadd(
                    f"memory_importance:{agent_id}",
                    {memory_id: importance}
                )
                
                logger.info(f"✅ Memory {memory_id} stored in Redis for agent {agent_id}")
            except Exception as e:
                logger.error(f"❌ Failed to store memory in Redis: {str(e)}")
                # Fall back to in-memory storage
                self._store_in_memory(agent_id, memory_id, memory)
        else:
            # Store in memory
            self._store_in_memory(agent_id, memory_id, memory)
        
        # In a full implementation, we would also store in Pinecone for vector search
        return memory_id
    
    def _store_in_memory(self, agent_id: str, memory_id: str, memory: Dict[str, Any]):
        """Store memory in the in-memory cache.
        
        Args:
            agent_id: The agent ID.
            memory_id: The memory ID.
            memory: The memory data.
        """
        if agent_id not in self.memory_cache:
            self.memory_cache[agent_id] = {}
        
        self.memory_cache[agent_id][memory_id] = memory
        logger.info(f"✅ Memory {memory_id} stored in-memory for agent {agent_id}")
    
    async def retrieve_recent_memories(
        self, 
        agent_id: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Retrieve the most recent memories for an agent.
        
        Args:
            agent_id: The ID of the agent.
            limit: Maximum number of memories to retrieve.
            
        Returns:
            List of memory objects.
        """
        memories = []
        
        # Try to get from Redis first
        if self.redis_client:
            try:
                # Get memory IDs from the index, sorted by timestamp (newest first)
                memory_ids = await self.redis_client.zrevrange(
                    f"memory_index:{agent_id}", 
                    0, 
                    limit - 1
                )
                
                # Get the actual memories
                for memory_id in memory_ids:
                    memory_id_str = memory_id.decode("utf-8") if isinstance(memory_id, bytes) else memory_id
                    memory_json = await self.redis_client.get(f"memory:{agent_id}:{memory_id_str}")
                    if memory_json:
                        memories.append(json.loads(memory_json))
                
                logger.info(f"✅ Retrieved {len(memories)} recent memories from Redis for agent {agent_id}")
            except Exception as e:
                logger.error(f"❌ Failed to retrieve memories from Redis: {str(e)}")
                # Fall back to in-memory retrieval
                memories = self._retrieve_from_memory(agent_id, sort_by="timestamp", limit=limit)
        else:
            # Get from in-memory cache
            memories = self._retrieve_from_memory(agent_id, sort_by="timestamp", limit=limit)
        
        return memories
    
    async def retrieve_important_memories(
        self, 
        agent_id: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Retrieve the most important memories for an agent.
        
        Args:
            agent_id: The ID of the agent.
            limit: Maximum number of memories to retrieve.
            
        Returns:
            List of memory objects.
        """
        memories = []
        
        # Try to get from Redis first
        if self.redis_client:
            try:
                # Get memory IDs from the importance index, sorted by importance (highest first)
                memory_ids = await self.redis_client.zrevrange(
                    f"memory_importance:{agent_id}", 
                    0, 
                    limit - 1
                )
                
                # Get the actual memories
                for memory_id in memory_ids:
                    memory_id_str = memory_id.decode("utf-8") if isinstance(memory_id, bytes) else memory_id
                    memory_json = await self.redis_client.get(f"memory:{agent_id}:{memory_id_str}")
                    if memory_json:
                        memories.append(json.loads(memory_json))
                
                logger.info(f"✅ Retrieved {len(memories)} important memories from Redis for agent {agent_id}")
            except Exception as e:
                logger.error(f"❌ Failed to retrieve important memories from Redis: {str(e)}")
                # Fall back to in-memory retrieval
                memories = self._retrieve_from_memory(agent_id, sort_by="importance", limit=limit)
        else:
            # Get from in-memory cache
            memories = self._retrieve_from_memory(agent_id, sort_by="importance", limit=limit)
        
        return memories
    
    def _retrieve_from_memory(
        self, 
        agent_id: str, 
        sort_by: str = "timestamp", 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Retrieve memories from the in-memory cache.
        
        Args:
            agent_id: The agent ID.
            sort_by: Field to sort by ('timestamp' or 'importance').
            limit: Maximum number of memories to retrieve.
            
        Returns:
            List of memory objects.
        """
        if agent_id not in self.memory_cache:
            return []
        
        # Get all memories for the agent
        agent_memories = list(self.memory_cache[agent_id].values())
        
        # Sort based on the specified field
        if sort_by == "timestamp":
            agent_memories.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        elif sort_by == "importance":
            agent_memories.sort(key=lambda x: x.get("importance", 0), reverse=True)
        
        # Return limited number of memories
        return agent_memories[:limit]
    
    async def search_memories(
        self, 
        agent_id: str, 
        query: str, 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Search agent memories based on content similarity.
        
        Args:
            agent_id: The ID of the agent.
            query: The search query.
            limit: Maximum number of results.
            
        Returns:
            List of memory objects.
        """
        # In a full implementation, we would use vector similarity search with Pinecone
        # For now, we'll do a simple keyword search
        
        # Convert query to lowercase for case-insensitive matching
        query_lower = query.lower()
        
        # Get all memories for the agent
        if self.redis_client:
            try:
                # Get all memory IDs for the agent
                memory_ids = await self.redis_client.zrange(
                    f"memory_index:{agent_id}", 
                    0, 
                    -1
                )
                
                memories = []
                for memory_id in memory_ids:
                    memory_id_str = memory_id.decode("utf-8") if isinstance(memory_id, bytes) else memory_id
                    memory_json = await self.redis_client.get(f"memory:{agent_id}:{memory_id_str}")
                    if memory_json:
                        memory = json.loads(memory_json)
                        memories.append(memory)
                
                # Filter memories that contain the query in the content
                results = [
                    memory for memory in memories
                    if query_lower in memory.get("content", "").lower()
                ]
                
                # Sort by relevance (simple implementation)
                results.sort(
                    key=lambda x: (
                        query_lower in x.get("content", "").lower(),
                        x.get("importance", 0)
                    ),
                    reverse=True
                )
                
                return results[:limit]
            except Exception as e:
                logger.error(f"❌ Failed to search memories in Redis: {str(e)}")
                # Fall back to in-memory search
                return self._search_in_memory(agent_id, query_lower, limit)
        else:
            # Search in-memory cache
            return self._search_in_memory(agent_id, query_lower, limit)
    
    def _search_in_memory(self, agent_id: str, query: str, limit: int) -> List[Dict[str, Any]]:
        """Search memories in the in-memory cache.
        
        Args:
            agent_id: The agent ID.
            query: The search query (lowercase).
            limit: Maximum number of results.
            
        Returns:
            List of memory objects.
        """
        if agent_id not in self.memory_cache:
            return []
        
        # Get all memories for the agent
        agent_memories = list(self.memory_cache[agent_id].values())
        
        # Filter memories that contain the query in the content
        results = [
            memory for memory in agent_memories
            if query in memory.get("content", "").lower()
        ]
        
        # Sort by relevance (simple implementation)
        results.sort(
            key=lambda x: (
                query in x.get("content", "").lower(),
                x.get("importance", 0)
            ),
            reverse=True
        )
        
        return results[:limit]
    
    async def delete_memory(self, agent_id: str, memory_id: str) -> bool:
        """Delete a memory.
        
        Args:
            agent_id: The ID of the agent.
            memory_id: The ID of the memory to delete.
            
        Returns:
            True if successful, False otherwise.
        """
        # Try to delete from Redis first
        if self.redis_client:
            try:
                # Remove from memory storage
                await self.redis_client.delete(f"memory:{agent_id}:{memory_id}")
                
                # Remove from indices
                await self.redis_client.zrem(f"memory_index:{agent_id}", memory_id)
                await self.redis_client.zrem(f"memory_importance:{agent_id}", memory_id)
                
                logger.info(f"✅ Memory {memory_id} deleted from Redis for agent {agent_id}")
                
                # Also remove from in-memory cache if it exists there
                if agent_id in self.memory_cache and memory_id in self.memory_cache[agent_id]:
                    del self.memory_cache[agent_id][memory_id]
                
                return True
            except Exception as e:
                logger.error(f"❌ Failed to delete memory from Redis: {str(e)}")
                # Fall back to in-memory deletion
                return self._delete_from_memory(agent_id, memory_id)
        else:
            # Delete from in-memory cache
            return self._delete_from_memory(agent_id, memory_id)
    
    def _delete_from_memory(self, agent_id: str, memory_id: str) -> bool:
        """Delete memory from the in-memory cache.
        
        Args:
            agent_id: The agent ID.
            memory_id: The memory ID.
            
        Returns:
            True if successful, False otherwise.
        """
        if agent_id not in self.memory_cache:
            return False
        
        if memory_id in self.memory_cache[agent_id]:
            del self.memory_cache[agent_id][memory_id]
            logger.info(f"✅ Memory {memory_id} deleted from in-memory cache for agent {agent_id}")
            return True
        
        return False
    
    async def clear_agent_memories(self, agent_id: str) -> bool:
        """Clear all memories for an agent.
        
        Args:
            agent_id: The ID of the agent.
            
        Returns:
            True if successful, False otherwise.
        """
        # Try to clear from Redis first
        if self.redis_client:
            try:
                # Get all memory IDs for the agent
                memory_ids = await self.redis_client.zrange(
                    f"memory_index:{agent_id}", 
                    0, 
                    -1
                )
                
                # Delete all memories
                for memory_id in memory_ids:
                    memory_id_str = memory_id.decode("utf-8") if isinstance(memory_id, bytes) else memory_id
                    await self.redis_client.delete(f"memory:{agent_id}:{memory_id_str}")
                
                # Delete indices
                await self.redis_client.delete(f"memory_index:{agent_id}")
                await self.redis_client.delete(f"memory_importance:{agent_id}")
                
                logger.info(f"✅ All memories cleared for agent {agent_id}")
                
                # Also clear from in-memory cache
                if agent_id in self.memory_cache:
                    del self.memory_cache[agent_id]
                
                return True
            except Exception as e:
                logger.error(f"❌ Failed to clear memories from Redis: {str(e)}")
                # Fall back to in-memory clearing
                return self._clear_memory_cache(agent_id)
        else:
            # Clear from in-memory cache
            return self._clear_memory_cache(agent_id)
    
    def _clear_memory_cache(self, agent_id: str) -> bool:
        """Clear agent memories from the in-memory cache.
        
        Args:
            agent_id: The agent ID.
            
        Returns:
            True if successful, False otherwise.
        """
        if agent_id in self.memory_cache:
            del self.memory_cache[agent_id]
            logger.info(f"✅ All memories cleared from in-memory cache for agent {agent_id}")
            return True
        
        return False
    
    async def get_memory(self, agent_id: str, memory_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific memory by ID.
        
        Args:
            agent_id: The ID of the agent.
            memory_id: The ID of the memory.
            
        Returns:
            The memory object or None if not found.
        """
        # Try to get from Redis first
        if self.redis_client:
            try:
                memory_json = await self.redis_client.get(f"memory:{agent_id}:{memory_id}")
                if memory_json:
                    return json.loads(memory_json)
                
                logger.warning(f"⚠️ Memory {memory_id} not found in Redis for agent {agent_id}")
            except Exception as e:
                logger.error(f"❌ Failed to get memory from Redis: {str(e)}")
        
        # Fall back to in-memory cache
        if agent_id in self.memory_cache and memory_id in self.memory_cache[agent_id]:
            return self.memory_cache[agent_id][memory_id]
        
        return None
    
    async def update_memory_importance(
        self, 
        agent_id: str, 
        memory_id: str, 
        importance: float
    ) -> bool:
        """Update the importance score of a memory.
        
        Args:
            agent_id: The ID of the agent.
            memory_id: The ID of the memory.
            importance: New importance score (0-1).
            
        Returns:
            True if successful, False otherwise.
        """
        # Try to update in Redis first
        if self.redis_client:
            try:
                # Get the memory
                memory_json = await self.redis_client.get(f"memory:{agent_id}:{memory_id}")
                if not memory_json:
                    logger.warning(f"⚠️ Memory {memory_id} not found in Redis for agent {agent_id}")
                    return False
                
                memory = json.loads(memory_json)
                memory["importance"] = importance
                
                # Update the memory
                await self.redis_client.set(f"memory:{agent_id}:{memory_id}", json.dumps(memory))
                
                # Update the importance index
                await self.redis_client.zadd(
                    f"memory_importance:{agent_id}",
                    {memory_id: importance}
                )
                
                logger.info(f"✅ Importance updated to {importance} for memory {memory_id}")
                
                # Also update in in-memory cache if it exists there
                if agent_id in self.memory_cache and memory_id in self.memory_cache[agent_id]:
                    self.memory_cache[agent_id][memory_id]["importance"] = importance
                
                return True
            except Exception as e:
                logger.error(f"❌ Failed to update memory importance in Redis: {str(e)}")
                # Fall back to in-memory update
                return self._update_importance_in_memory(agent_id, memory_id, importance)
        else:
            # Update in in-memory cache
            return self._update_importance_in_memory(agent_id, memory_id, importance)
    
    def _update_importance_in_memory(self, agent_id: str, memory_id: str, importance: float) -> bool:
        """Update memory importance in the in-memory cache.
        
        Args:
            agent_id: The agent ID.
            memory_id: The memory ID.
            importance: New importance score.
            
        Returns:
            True if successful, False otherwise.
        """
        if agent_id not in self.memory_cache or memory_id not in self.memory_cache[agent_id]:
            return False
        
        self.memory_cache[agent_id][memory_id]["importance"] = importance
        logger.info(f"✅ Importance updated to {importance} for memory {memory_id} in in-memory cache")
        return True
    
    async def close(self):
        """Close connections to external services."""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("✅ Redis client closed")


# Create a singleton instance for the service
_memory_service = None

def get_memory_service() -> MemoryService:
    """Get the singleton MemoryService instance.
    
    Returns:
        MemoryService instance.
    """
    global _memory_service
    if _memory_service is None:
        _memory_service = MemoryService()
    return _memory_service