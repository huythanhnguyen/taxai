"""
Valkey (Redis-compatible) connection and utilities for Vietnamese Tax Filing API
"""

import logging
from typing import Optional
import os

try:
    import valkey
    VALKEY_AVAILABLE = True
except ImportError:
    # Fallback to redis if valkey is not available
    import redis as valkey
    VALKEY_AVAILABLE = False

from app.core.config import settings

logger = logging.getLogger(__name__)

class ValkeyConnection:
    """Valkey connection manager"""
    
    def __init__(self):
        self._client: Optional[valkey.Redis] = None
        self._async_client: Optional[valkey.asyncio.Redis] = None
    
    def get_sync_client(self) -> valkey.Redis:
        """Get synchronous Valkey client"""
        if self._client is None:
            self._client = valkey.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            logger.info("✅ Valkey sync client initialized")
        return self._client
    
    def get_async_client(self) -> valkey.asyncio.Redis:
        """Get asynchronous Valkey client"""
        if self._async_client is None:
            self._async_client = valkey.asyncio.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            logger.info("✅ Valkey async client initialized")
        return self._async_client
    
    async def test_connection(self) -> bool:
        """Test Valkey connection"""
        try:
            client = self.get_async_client()
            await client.ping()
            logger.info("✅ Valkey connection test successful")
            return True
        except Exception as e:
            logger.error(f"❌ Valkey connection test failed: {e}")
            return False
    
    async def close(self):
        """Close Valkey connections"""
        if self._async_client:
            await self._async_client.close()
            logger.info("🔒 Valkey async client closed")
        
        if self._client:
            self._client.close()
            logger.info("🔒 Valkey sync client closed")

# Global Valkey connection instance
valkey_connection = ValkeyConnection()

# Convenience functions
def get_valkey_sync() -> valkey.Redis:
    """Get synchronous Valkey client"""
    return valkey_connection.get_sync_client()

def get_valkey_async() -> valkey.asyncio.Redis:
    """Get asynchronous Valkey client"""
    return valkey_connection.get_async_client()

async def test_valkey() -> bool:
    """Test Valkey connection"""
    return await valkey_connection.test_connection()

async def close_valkey():
    """Close Valkey connections"""
    await valkey_connection.close()

# Cache utilities
class ValkeyCache:
    """Valkey-based caching utilities"""
    
    def __init__(self):
        self.client = get_valkey_async()
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from cache"""
        try:
            return await self.client.get(key)
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    async def set(self, key: str, value: str, expire: int = 3600) -> bool:
        """Set value in cache with expiration"""
        try:
            await self.client.setex(key, expire, value)
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            await self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            return bool(await self.client.exists(key))
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False
    
    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment counter in cache"""
        try:
            return await self.client.incrby(key, amount)
        except Exception as e:
            logger.error(f"Cache increment error for key {key}: {e}")
            return None
    
    async def set_hash(self, key: str, mapping: dict, expire: int = 3600) -> bool:
        """Set hash in cache"""
        try:
            await self.client.hset(key, mapping=mapping)
            await self.client.expire(key, expire)
            return True
        except Exception as e:
            logger.error(f"Cache hash set error for key {key}: {e}")
            return False
    
    async def get_hash(self, key: str) -> Optional[dict]:
        """Get hash from cache"""
        try:
            return await self.client.hgetall(key)
        except Exception as e:
            logger.error(f"Cache hash get error for key {key}: {e}")
            return None

# Global cache instance
cache = ValkeyCache()

# Session storage for user sessions
class ValkeySessionStore:
    """Valkey-based session storage"""
    
    def __init__(self):
        self.client = get_valkey_async()
        self.prefix = "session:"
    
    async def create_session(self, user_id: str, session_data: dict, expire: int = 86400) -> str:
        """Create user session"""
        import uuid
        session_id = str(uuid.uuid4())
        session_key = f"{self.prefix}{session_id}"
        
        try:
            session_data["user_id"] = user_id
            session_data["created_at"] = str(int(time.time()))
            
            await self.client.hset(session_key, mapping=session_data)
            await self.client.expire(session_key, expire)
            
            logger.info(f"✅ Session created for user {user_id}: {session_id}")
            return session_id
        except Exception as e:
            logger.error(f"Session creation error for user {user_id}: {e}")
            return None
    
    async def get_session(self, session_id: str) -> Optional[dict]:
        """Get session data"""
        session_key = f"{self.prefix}{session_id}"
        try:
            return await self.client.hgetall(session_key)
        except Exception as e:
            logger.error(f"Session get error for {session_id}: {e}")
            return None
    
    async def update_session(self, session_id: str, session_data: dict) -> bool:
        """Update session data"""
        session_key = f"{self.prefix}{session_id}"
        try:
            await self.client.hset(session_key, mapping=session_data)
            return True
        except Exception as e:
            logger.error(f"Session update error for {session_id}: {e}")
            return False
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete session"""
        session_key = f"{self.prefix}{session_id}"
        try:
            await self.client.delete(session_key)
            logger.info(f"🗑️ Session deleted: {session_id}")
            return True
        except Exception as e:
            logger.error(f"Session delete error for {session_id}: {e}")
            return False

# Global session store
session_store = ValkeySessionStore()

# Rate limiting
class ValkeyRateLimiter:
    """Valkey-based rate limiting"""
    
    def __init__(self):
        self.client = get_valkey_async()
        self.prefix = "rate_limit:"
    
    async def is_allowed(self, key: str, limit: int, window: int) -> tuple[bool, int]:
        """
        Check if request is allowed under rate limit
        Returns (is_allowed, remaining_requests)
        """
        rate_key = f"{self.prefix}{key}"
        
        try:
            current = await self.client.get(rate_key)
            
            if current is None:
                # First request in window
                await self.client.setex(rate_key, window, 1)
                return True, limit - 1
            
            current_count = int(current)
            if current_count >= limit:
                return False, 0
            
            # Increment counter
            new_count = await self.client.incr(rate_key)
            return True, limit - new_count
            
        except Exception as e:
            logger.error(f"Rate limit error for key {key}: {e}")
            # Allow request on error
            return True, limit

# Global rate limiter
rate_limiter = ValkeyRateLimiter()

# Import time for session timestamps
import time

logger.info(f"🚀 Valkey module initialized (using {'valkey' if VALKEY_AVAILABLE else 'redis'} library)")
