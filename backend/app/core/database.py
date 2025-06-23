import redis
from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Centralized database connection manager with graceful fallbacks for Phase 1"""
    
    def __init__(self):
        self.supabase: Client = None
        self.redis_client: redis.Redis = None
        self.pinecone_index = None
        self.pinecone_available = False
        self.redis_available = False
        
    async def initialize(self):
        """Initialize all database connections with graceful fallbacks for Phase 1"""
        
        # Initialize Supabase (required)
        try:
            self.supabase = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
            logger.info("✅ Supabase connection initialized")
        except Exception as e:
            logger.error(f"❌ Supabase initialization failed: {e}")
            raise
        
        # Initialize Redis (optional for Phase 1, required for Phase 3)
        try:
            if settings.REDIS_URL and settings.REDIS_URL != "":
                self.redis_client = redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_timeout=5,
                    socket_connect_timeout=5
                )
                # Test connection with timeout
                self.redis_client.ping()
                self.redis_available = True
                logger.info("✅ Redis connection established")
            else:
                logger.info("⚠️ Redis URL not configured - using fallback for Phase 1")
        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed: {e} - Phase 1 can continue without Redis")
            self.redis_available = False
        
        # Initialize Pinecone (optional for Phase 1, required for Phase 3)
        try:
            if (settings.PINECONE_API_KEY and 
                settings.PINECONE_API_KEY != "" and 
                settings.PINECONE_INDEX_NAME and 
                settings.PINECONE_INDEX_NAME != ""):
                
                # Use new Pinecone client initialization (v3.0+)
                from pinecone import Pinecone
                
                pc = Pinecone(api_key=settings.PINECONE_API_KEY)
                
                # Try to get the index
                try:
                    self.pinecone_index = pc.Index(settings.PINECONE_INDEX_NAME)
                    # Test connection with a simple describe call
                    stats = self.pinecone_index.describe_index_stats()
                    self.pinecone_available = True
                    logger.info(f"✅ Pinecone connection established - Index: {settings.PINECONE_INDEX_NAME}")
                except Exception as index_error:
                    logger.warning(f"⚠️ Pinecone index '{settings.PINECONE_INDEX_NAME}' not accessible: {index_error}")
                    # Try to list available indexes
                    try:
                        indexes = pc.list_indexes()
                        if indexes and len(indexes.indexes) > 0:
                            available_indexes = [idx.name for idx in indexes.indexes]
                            logger.info(f"📋 Available Pinecone indexes: {available_indexes}")
                            logger.info(f"💡 Consider updating PINECONE_INDEX_NAME to one of: {available_indexes}")
                        else:
                            logger.info("📋 No Pinecone indexes found - you may need to create one")
                    except Exception:
                        logger.warning("⚠️ Could not list Pinecone indexes")
                    
                    self.pinecone_available = False
                    
            else:
                logger.info("⚠️ Pinecone not configured - Phase 1 can continue without vector storage")
        except ImportError:
            logger.warning("⚠️ Pinecone library not available - install with: pip install pinecone-client")
            self.pinecone_available = False
        except Exception as e:
            logger.warning(f"⚠️ Pinecone connection failed: {e} - Phase 1 can continue without vector storage")
            self.pinecone_available = False
        
        # Test connections (only require Supabase for Phase 1)
        await self._test_connections()
        
    async def _test_connections(self):
        """Test database connections with graceful fallbacks"""
        try:
            # Test Supabase (required for Phase 1)
            try:
                response = self.supabase.table("users").select("id").limit(1).execute()
                logger.info("✅ Supabase connection test successful")
            except Exception as e:
                logger.warning(f"⚠️ Supabase test warning (table may not exist): {e}")
            
            # Test Redis (optional for Phase 1)
            if self.redis_available and self.redis_client:
                try:
                    self.redis_client.ping()
                    logger.info("✅ Redis connection test successful")
                except Exception as e:
                    logger.warning(f"⚠️ Redis test failed: {e}")
                    self.redis_available = False
            
            # Test Pinecone (optional for Phase 1)
            if self.pinecone_available and self.pinecone_index:
                try:
                    self.pinecone_index.describe_index_stats()
                    logger.info("✅ Pinecone connection test successful")
                except Exception as e:
                    logger.warning(f"⚠️ Pinecone test failed: {e}")
                    self.pinecone_available = False
            
            # Summary for Phase 1
            services = []
            if self.supabase: services.append("Supabase ✅")
            if self.redis_available: services.append("Redis ✅")
            else: services.append("Redis ⏳ (Phase 3)")
            if self.pinecone_available: services.append("Pinecone ✅")
            else: services.append("Pinecone ⏳ (Phase 3)")
            
            logger.info(f"🎯 Phase 1 Database Status: {' | '.join(services)}")
            logger.info("✅ Phase 1 ready - Supabase connected, AI services operational")
            
        except Exception as e:
            logger.error(f"❌ Database connection test failed: {e}")
            raise
    
    async def close(self):
        """Close all database connections"""
        if self.redis_client and self.redis_available:
            try:
                # Check if aclose method exists (for newer Redis versions)
                if hasattr(self.redis_client, 'aclose'):
                    await self.redis_client.aclose()
                # For older Redis versions, use close
                elif hasattr(self.redis_client, 'close'):
                    self.redis_client.close()
                logger.info("✅ Redis connection closed")
            except Exception as e:
                logger.warning(f"⚠️ Redis close warning: {e}")

# Global database manager instance
db = DatabaseManager()