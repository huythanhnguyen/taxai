# 🚀 Valkey Setup for Vietnamese Tax Filing API

## 📖 Về Valkey

**Valkey** là một fork của Redis được phát triển bởi Linux Foundation. Render.com đã chuyển từ Redis sang Valkey để tránh các vấn đề licensing.

### ✨ Tính năng:
- ✅ **100% tương thích** với Redis protocol
- ✅ **Open source** hoàn toàn
- ✅ **Performance** tương đương Redis
- ✅ **Drop-in replacement** cho Redis

## 🔧 Setup trên Render.com

### Bước 1: Tạo Valkey Service

1. **Trong Render Dashboard:**
   - Click **"New +"**
   - Chọn **"Redis"** (Render gọi là Redis nhưng thực tế là Valkey)

2. **Cấu hình:**
   ```
   Name: tax-filing-valkey
   Region: Oregon (cùng với PostgreSQL)
   Plan: Starter (Free - 25MB)
   Maxmemory Policy: allkeys-lru
   ```

3. **Click "Create Redis"**

### Bước 2: Lấy Connection URL

Sau khi tạo xong, bạn sẽ có:

```bash
# Internal Valkey URL (dùng trong Render services)
redis://red-xxxxx:6379

# External Valkey URL (dùng từ bên ngoài - nếu có)
rediss://red-xxxxx:6380
```

### Bước 3: Cập nhật Environment Variables

Trong file `.env` hoặc Render environment settings:

```bash
# Valkey connection
REDIS_URL=redis://red-xxxxx:6379

# Celery với Valkey
CELERY_BROKER_URL=redis://red-xxxxx:6379
CELERY_RESULT_BACKEND=redis://red-xxxxx:6379
```

## 💻 Code Integration

### 1. Dependencies

```bash
# requirements.txt
redis==5.0.1
valkey==5.0.1  # Backup option
```

### 2. Connection Code

```python
# app/core/valkey.py
try:
    import valkey
    VALKEY_AVAILABLE = True
except ImportError:
    import redis as valkey  # Fallback
    VALKEY_AVAILABLE = False

# Create connection
client = valkey.from_url(settings.REDIS_URL)
```

### 3. Usage Examples

```python
# Basic operations
await client.set("key", "value")
value = await client.get("key")

# Hash operations
await client.hset("user:123", mapping={"name": "John", "email": "john@example.com"})
user_data = await client.hgetall("user:123")

# Expiration
await client.setex("session:abc", 3600, "session_data")

# Lists
await client.lpush("queue", "task1", "task2")
task = await client.rpop("queue")
```

## 🧪 Testing Connection

Chạy test script:

```bash
cd backend
python test_db_connection.py
```

Expected output:
```
🔗 Testing Valkey connection...
✅ Valkey connected successfully!
Test data: Hello from Vietnamese Tax Filing API with Valkey!
🎉 Valkey connection test completed successfully!
```

## 🔄 Migration từ Redis

Nếu bạn đã có Redis code:

### ✅ Không cần thay đổi gì!

```python
# Code này vẫn hoạt động với Valkey
import redis
client = redis.from_url("redis://...")
```

### 🔧 Optional: Sử dụng Valkey library

```python
# Nếu muốn dùng Valkey library
import valkey
client = valkey.from_url("redis://...")
```

## 📊 Performance & Features

### Valkey vs Redis

| Feature | Valkey | Redis |
|---------|--------|-------|
| **Protocol** | ✅ Redis-compatible | ✅ Native |
| **Performance** | ✅ Same | ✅ Same |
| **License** | ✅ BSD-3-Clause | ❌ Dual license |
| **Open Source** | ✅ Fully open | ⚠️ Limited |
| **Community** | ✅ Linux Foundation | ⚠️ Redis Ltd |

### Use Cases trong Tax Filing API

1. **Session Storage**
   ```python
   # User sessions
   await client.hset(f"session:{session_id}", mapping=session_data)
   ```

2. **Caching**
   ```python
   # Cache tax calculations
   await client.setex(f"tax_calc:{user_id}", 3600, calculation_result)
   ```

3. **Rate Limiting**
   ```python
   # API rate limiting
   await client.incr(f"rate_limit:{ip}")
   await client.expire(f"rate_limit:{ip}", 60)
   ```

4. **Background Tasks (Celery)**
   ```python
   # Task queue
   celery_app = Celery(broker="redis://valkey-url")
   ```

5. **Real-time Features**
   ```python
   # Pub/Sub for notifications
   await client.publish("tax_updates", notification_data)
   ```

## 🔒 Security

### Connection Security

```python
# SSL connection (production)
client = valkey.from_url(
    "rediss://user:pass@host:6380",
    ssl_cert_reqs=None,
    ssl_check_hostname=False
)
```

### Data Encryption

```python
# Encrypt sensitive data before storing
import json
from cryptography.fernet import Fernet

key = Fernet.generate_key()
f = Fernet(key)

# Store encrypted
encrypted_data = f.encrypt(json.dumps(sensitive_data).encode())
await client.set("secure_key", encrypted_data)

# Retrieve and decrypt
encrypted = await client.get("secure_key")
decrypted_data = json.loads(f.decrypt(encrypted).decode())
```

## 🚀 Production Tips

### 1. Connection Pooling

```python
# Automatic connection pooling
client = valkey.from_url(
    settings.REDIS_URL,
    max_connections=20,
    retry_on_timeout=True,
    health_check_interval=30
)
```

### 2. Error Handling

```python
try:
    await client.set("key", "value")
except valkey.ConnectionError:
    logger.error("Valkey connection failed")
    # Fallback logic
except valkey.TimeoutError:
    logger.error("Valkey timeout")
    # Retry logic
```

### 3. Monitoring

```python
# Health check
async def health_check():
    try:
        await client.ping()
        return {"valkey": "healthy"}
    except:
        return {"valkey": "unhealthy"}
```

## 📝 Environment Template

```bash
# .env
DATABASE_URL=postgresql+asyncpg://tax_user:password@host/tax_filing_db
REDIS_URL=redis://red-xxxxx:6379
CELERY_BROKER_URL=redis://red-xxxxx:6379
CELERY_RESULT_BACKEND=redis://red-xxxxx:6379
```

## 🎉 Ready to Use!

Vietnamese Tax Filing API đã sẵn sàng sử dụng Valkey với:

- ✅ **Connection utilities** trong `app/core/valkey.py`
- ✅ **Caching system** cho performance
- ✅ **Session management** cho users
- ✅ **Rate limiting** cho security
- ✅ **Celery integration** cho background tasks
- ✅ **Testing scripts** để verify connection

**Valkey = Redis compatibility + Open source freedom!** 🚀
