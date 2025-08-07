#!/usr/bin/env python3
"""
Test database connection to Render PostgreSQL
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the app directory to Python path
app_dir = Path(__file__).parent
sys.path.insert(0, str(app_dir))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def test_database_connection():
    """Test connection to Render PostgreSQL database"""
    
    # Database URL from Render
    database_url = "postgresql+asyncpg://tax_user:7deku223FM7bXjVoAV6MxE5EHBzDq71c@dpg-d2a6t43e5dus73a23480-a.oregon-postgres.render.com/tax_filing_db"
    
    print("🔗 Testing connection to Render PostgreSQL...")
    print(f"Database: {database_url.split('@')[1].split('/')[1]}")
    print(f"Host: {database_url.split('@')[1].split('/')[0]}")
    
    try:
        # Create engine
        engine = create_async_engine(database_url, echo=True)
        
        # Test connection
        async with engine.begin() as conn:
            # Test basic query
            result = await conn.execute(text("SELECT version()"))
            version = result.fetchone()
            print(f"✅ Connected successfully!")
            print(f"PostgreSQL Version: {version[0]}")
            
            # Test database info
            result = await conn.execute(text("SELECT current_database(), current_user"))
            db_info = result.fetchone()
            print(f"Database: {db_info[0]}")
            print(f"User: {db_info[1]}")
            
            # Test table creation
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS test_connection (
                    id SERIAL PRIMARY KEY,
                    message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Insert test data
            await conn.execute(text("""
                INSERT INTO test_connection (message) 
                VALUES ('Connection test successful!')
            """))
            
            # Query test data
            result = await conn.execute(text("SELECT * FROM test_connection ORDER BY id DESC LIMIT 1"))
            test_data = result.fetchone()
            print(f"Test data: {test_data}")
            
            # Clean up
            await conn.execute(text("DROP TABLE test_connection"))
            
        await engine.dispose()
        print("🎉 Database connection test completed successfully!")
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    return True

async def test_valkey_connection():
    """Test Valkey connection (Redis-compatible)"""
    try:
        # Try Valkey first, fallback to Redis
        try:
            import valkey.asyncio as valkey_client
            client_name = "Valkey"
        except ImportError:
            import redis.asyncio as valkey_client
            client_name = "Redis (fallback)"
        
        # Render Valkey service URL
        valkey_url = "redis://red-d2a76kh5pdvs73af2ogg:6379"
        
        print(f"\n🔗 Testing {client_name} connection...")
        print(f"Valkey URL: {valkey_url}")
        
        r = valkey_client.from_url(valkey_url)
        
        # Test connection
        await r.ping()
        print(f"✅ {client_name} connected successfully!")
        
        # Test set/get
        await r.set("test_key", "Hello from Vietnamese Tax Filing API with Valkey!")
        value = await r.get("test_key")
        print(f"Test data: {value}")
        
        # Test hash operations
        await r.hset("test_hash", mapping={
            "api": "Vietnamese Tax Filing API",
            "backend": "Valkey",
            "status": "connected"
        })
        hash_data = await r.hgetall("test_hash")
        print(f"Hash test: {hash_data}")
        
        # Test expiration
        await r.setex("test_expire", 60, "This will expire in 60 seconds")
        ttl = await r.ttl("test_expire")
        print(f"TTL test: {ttl} seconds")
        
        # Clean up
        await r.delete("test_key", "test_hash", "test_expire")
        await r.close()
        
        print(f"🎉 {client_name} connection test completed successfully!")
        
    except ImportError:
        print("⚠️ Valkey/Redis library not installed. Run: pip install valkey redis")
    except Exception as e:
        print(f"❌ Valkey connection failed: {e}")
        print("💡 Make sure to create Valkey on Render and update REDIS_URL")

async def main():
    """Run all connection tests"""
    print("🚀 Vietnamese Tax Filing API - Database Connection Tests")
    print("=" * 60)
    
    # Test PostgreSQL
    db_success = await test_database_connection()
    
    # Test Valkey
    await test_valkey_connection()
    
    print("\n" + "=" * 60)
    if db_success:
        print("✅ PostgreSQL is ready for Vietnamese Tax Filing API!")
        print("📝 Next steps:")
        print("   1. Create Valkey on Render")
        print("   2. Update REDIS_URL in environment")
        print("   3. Run database migrations")
        print("   4. Start the API server")
    else:
        print("❌ Please check database configuration")

if __name__ == "__main__":
    asyncio.run(main())
