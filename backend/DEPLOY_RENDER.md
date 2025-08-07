# Hướng dẫn triển khai Vietnamese Tax Filing API trên Render.com

## Tổng quan

Render.com là platform cloud hiện đại, hỗ trợ tốt cho Python applications. Hướng dẫn này sẽ giúp bạn deploy FastAPI backend lên Render với PostgreSQL và Redis.

## Yêu cầu

- Tài khoản Render.com (miễn phí)
- GitHub repository chứa code
- Domain name (tùy chọn)

## Bước 1: Chuẩn bị code cho Render

### 1.1 Tạo file cấu hình Render

Tạo file `render.yaml` trong thư mục root:

```yaml
# render.yaml
databases:
  - name: tax-filing-db
    databaseName: tax_filing_db
    user: tax_user
    region: singapore

services:
  - type: redis
    name: tax-filing-redis
    region: singapore
    plan: starter
    maxmemoryPolicy: allkeys-lru

  - type: web
    name: tax-filing-api
    env: python
    region: singapore
    plan: starter
    buildCommand: "./build.sh"
    startCommand: "python run_server.py"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: ENVIRONMENT
        value: production
      - key: DEBUG
        value: false
      - key: DATABASE_URL
        fromDatabase:
          name: tax-filing-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: tax-filing-redis
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: ALLOWED_HOSTS
        value: '["https://tax-filing-api.onrender.com"]'

  - type: worker
    name: tax-filing-celery
    env: python
    region: singapore
    plan: starter
    buildCommand: "./build.sh"
    startCommand: "python run_celery.py"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: ENVIRONMENT
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: tax-filing-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: tax-filing-redis
          property: connectionString
      - key: CELERY_BROKER_URL
        fromService:
          type: redis
          name: tax-filing-redis
          property: connectionString
      - key: CELERY_RESULT_BACKEND
        fromService:
          type: redis
          name: tax-filing-redis
          property: connectionString
```

### 1.2 Tạo build script

Tạo file `build.sh`:

```bash
#!/usr/bin/env bash
# build.sh

set -o errexit  # exit on error

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations
python -c "
import asyncio
import sys
import os
sys.path.insert(0, os.getcwd())
from app.core.database import init_db
asyncio.run(init_db())
"

echo "Build completed successfully!"
```

### 1.3 Cập nhật requirements.txt cho Render

Cập nhật `requirements.txt` với các dependencies cần thiết cho production:

```txt
# Core FastAPI and async support
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6

# Database and ORM
sqlalchemy[asyncio]==2.0.23
psycopg2-binary==2.9.9  # PostgreSQL driver for Render
alembic==1.12.1
redis==5.0.1

# Authentication and security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4

# Google ADK and AI (when available)
google-cloud-aiplatform==1.38.1
google-auth==2.23.4

# Data validation and serialization
pydantic==2.5.0
pydantic-settings==2.1.0

# Background tasks
celery[redis]==5.3.4

# File processing
PyPDF2==3.0.1
Pillow==10.1.0
python-magic-bin==0.4.14  # For Windows compatibility

# HTTP clients
httpx==0.25.2
aiohttp==3.9.1

# Utilities
python-dotenv==1.0.0
email-validator==2.1.0

# Production server
gunicorn==21.2.0
```

### 1.4 Cập nhật cấu hình cho Render

Cập nhật `app/core/config.py`:

```python
"""
Application configuration settings for Render deployment
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Vietnamese Tax Filing API"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    
    # Database - Render provides this automatically
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://localhost/tax_filing_db")
    DATABASE_ECHO: bool = False
    
    # Redis - Render provides this automatically
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # CORS - Update with your frontend domain
    ALLOWED_HOSTS: List[str] = [
        "https://tax-filing-api.onrender.com",
        "https://your-frontend-domain.com",
        "http://localhost:3000"  # For development
    ]
    
    # Google Cloud / ADK
    GOOGLE_CLOUD_PROJECT: Optional[str] = os.getenv("GOOGLE_CLOUD_PROJECT")
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    GEMINI_MODEL: str = "gemini-2.5-flash-lite"
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "/tmp/uploads"  # Use /tmp on Render
    ALLOWED_FILE_TYPES: List[str] = ["pdf", "jpg", "jpeg", "png"]
    
    # Celery
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    
    # Vietnamese Tax Authority APIs
    TAX_AUTHORITY_BASE_URL: Optional[str] = os.getenv("TAX_AUTHORITY_BASE_URL")
    TAX_AUTHORITY_API_KEY: Optional[str] = os.getenv("TAX_AUTHORITY_API_KEY")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
```

### 1.5 Cập nhật server runner cho production

Cập nhật `run_server.py`:

```python
#!/usr/bin/env python3
"""
Production server runner for Vietnamese Tax Filing API on Render
"""

import uvicorn
import os
import sys
from pathlib import Path

# Add the app directory to Python path
app_dir = Path(__file__).parent
sys.path.insert(0, str(app_dir))

from app.core.config import settings

def main():
    """Run the FastAPI server on Render"""
    
    # Ensure required directories exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Get port from environment (Render sets this)
    port = int(os.environ.get("PORT", 8000))
    
    # Server configuration for Render
    config = {
        "app": "app.main:app",
        "host": "0.0.0.0",
        "port": port,
        "workers": 1,  # Render starter plan limitation
        "log_level": "info",
        "access_log": True,
    }
    
    print(f"Starting Vietnamese Tax Filing API Server on Render...")
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Port: {port}")
    print(f"Server will be available at: https://tax-filing-api.onrender.com")
    
    # Run the server
    uvicorn.run(**config)

if __name__ == "__main__":
    main()
```

### 1.6 Cập nhật database configuration

Cập nhật `app/core/database.py` để handle Render's PostgreSQL:

```python
"""
Database configuration for Render deployment
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import NullPool
import logging
import os

from app.core.config import settings

logger = logging.getLogger(__name__)

# Convert Render's DATABASE_URL if needed
database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)

# Create async engine for Render
engine = create_async_engine(
    database_url,
    echo=settings.DATABASE_ECHO,
    poolclass=NullPool,  # Render handles connection pooling
    future=True,
    connect_args={
        "server_settings": {
            "application_name": "tax_filing_api",
        }
    }
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for all models
Base = declarative_base()


async def get_db_session() -> AsyncSession:
    """Dependency to get database session"""
    async with async_session() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database on Render"""
    try:
        # Import all models to ensure they are registered
        from app.models import user, taxpayer, tax_declaration, ai_processing
        
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Database initialized successfully on Render")
    except Exception as e:
        logger.error(f"Error initializing database on Render: {e}")
        raise


async def close_db():
    """Close database connections"""
    await engine.dispose()
```

## Bước 2: Chuẩn bị GitHub Repository

### 2.1 Push code lên GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Vietnamese Tax Filing API for Render"

# Add remote repository
git remote add origin https://github.com/yourusername/vietnamese-tax-filing-api.git

# Push to GitHub
git push -u origin main
```

### 2.2 Tạo .gitignore

```gitignore
# .gitignore
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Environment variables
.env
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
logs/
*.log

# Database
*.db
*.sqlite

# Uploads
uploads/
!uploads/.gitkeep

# OS
.DS_Store
Thumbs.db

# Render
.render/
```

## Bước 3: Deploy trên Render.com

### 3.1 Tạo tài khoản Render

1. Truy cập [render.com](https://render.com)
2. Đăng ký tài khoản miễn phí
3. Connect với GitHub account

### 3.2 Deploy từ GitHub

#### Option 1: Sử dụng render.yaml (Recommended)

1. Trong Render Dashboard, click **"New +"**
2. Chọn **"Blueprint"**
3. Connect GitHub repository
4. Chọn repository chứa code
5. Render sẽ tự động đọc `render.yaml` và tạo các services

#### Option 2: Manual setup

1. **Tạo PostgreSQL Database:**
   - Click **"New +"** → **"PostgreSQL"**
   - Name: `tax-filing-db`
   - Database Name: `tax_filing_db`
   - User: `tax_user`
   - Region: Singapore (gần Việt Nam nhất)
   - Plan: Free

2. **Tạo Redis:**
   - Click **"New +"** → **"Redis"**
   - Name: `tax-filing-redis`
   - Region: Singapore
   - Plan: Starter (Free)

3. **Tạo Web Service:**
   - Click **"New +"** → **"Web Service"**
   - Connect GitHub repository
   - Name: `tax-filing-api`
   - Environment: Python 3
   - Region: Singapore
   - Branch: main
   - Build Command: `./build.sh`
   - Start Command: `python run_server.py`

4. **Tạo Background Worker:**
   - Click **"New +"** → **"Background Worker"**
   - Connect same repository
   - Name: `tax-filing-celery`
   - Environment: Python 3
   - Build Command: `./build.sh`
   - Start Command: `python run_celery.py`

### 3.3 Cấu hình Environment Variables

Trong Web Service settings, thêm các environment variables:

```bash
# Application
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=your-secret-key-here

# Database (auto-generated by Render)
DATABASE_URL=postgresql://user:pass@host:port/db

# Redis (auto-generated by Render)
REDIS_URL=redis://host:port

# CORS
ALLOWED_HOSTS=["https://tax-filing-api.onrender.com","https://your-frontend.com"]

# Google Cloud (optional)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/opt/render/project/src/credentials/service-account.json

# Vietnamese Tax Authority
TAX_AUTHORITY_BASE_URL=https://api.gdt.gov.vn
TAX_AUTHORITY_API_KEY=your-api-key
```

## Bước 4: Cấu hình Domain và SSL

### 4.1 Custom Domain (Optional)

1. Trong Web Service settings
2. Go to **"Settings"** → **"Custom Domains"**
3. Add your domain: `api.yourdomain.com`
4. Update DNS records:
   ```
   Type: CNAME
   Name: api
   Value: tax-filing-api.onrender.com
   ```

### 4.2 SSL Certificate

Render tự động cung cấp SSL certificate miễn phí cho tất cả domains.

## Bước 5: Monitoring và Logs

### 5.1 Xem Logs

1. Trong service dashboard
2. Click **"Logs"** tab
3. Real-time logs sẽ hiển thị

### 5.2 Health Checks

Render tự động health check endpoint `/health`:

```python
# Đã có trong app/main.py
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### 5.3 Metrics

1. Trong service dashboard
2. Click **"Metrics"** tab
3. Xem CPU, Memory, Response time

## Bước 6: Database Migrations

### 6.1 Chạy migrations

Migrations sẽ tự động chạy trong build script, nhưng bạn có thể chạy manual:

```bash
# Trong Render Shell
python -c "
import asyncio
from app.core.database import init_db
asyncio.run(init_db())
"
```

### 6.2 Alembic migrations (Advanced)

Nếu sử dụng Alembic:

```bash
# Trong build.sh
alembic upgrade head
```

## Bước 7: Testing trên Render

### 7.1 Test API endpoints

```bash
# Health check
curl https://tax-filing-api.onrender.com/health

# API documentation
curl https://tax-filing-api.onrender.com/api/docs

# Register user
curl -X POST https://tax-filing-api.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "first_name": "Test",
    "last_name": "User",
    "role": "individual"
  }'
```

### 7.2 Test database connection

Kiểm tra logs để đảm bảo database connection thành công.

## Bước 8: Scaling và Performance

### 8.1 Upgrade Plans

- **Starter Plan**: Free, 512MB RAM, 0.1 CPU
- **Standard Plan**: $7/month, 1GB RAM, 0.5 CPU
- **Pro Plan**: $25/month, 4GB RAM, 1 CPU

### 8.2 Auto-scaling

Render tự động scale based on traffic trong paid plans.

### 8.3 Performance optimization

```python
# Trong app/main.py
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

## Bước 9: Backup và Recovery

### 9.1 Database Backup

Render tự động backup PostgreSQL databases hàng ngày.

### 9.2 Manual Backup

```bash
# Download backup từ Render dashboard
# Database → Backups → Download
```

## Bước 10: CI/CD với GitHub Actions

Tạo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to Render
      run: |
        curl -X POST \
          -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
          -H "Content-Type: application/json" \
          -d '{"serviceId": "${{ secrets.RENDER_SERVICE_ID }}"}' \
          https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID }}/deploys
```

## Troubleshooting

### Common Issues

1. **Build fails:**
   ```bash
   # Check build logs
   # Ensure build.sh is executable
   chmod +x build.sh
   ```

2. **Database connection fails:**
   ```bash
   # Check DATABASE_URL format
   # Should be: postgresql+asyncpg://...
   ```

3. **Redis connection fails:**
   ```bash
   # Check REDIS_URL in environment variables
   # Ensure Redis service is running
   ```

4. **Import errors:**
   ```bash
   # Check requirements.txt
   # Ensure all dependencies are listed
   ```

### Performance Issues

1. **Slow response times:**
   - Upgrade to paid plan
   - Optimize database queries
   - Add caching

2. **Memory issues:**
   - Reduce worker processes
   - Optimize memory usage
   - Upgrade plan

## Cost Estimation

### Free Tier
- Web Service: Free (with limitations)
- PostgreSQL: Free (1GB storage)
- Redis: Free (25MB)

### Paid Plans
- Web Service: $7-25/month
- PostgreSQL: $7-90/month
- Redis: $3-45/month

## Security Best Practices

1. **Environment Variables:**
   - Never commit secrets to Git
   - Use Render's environment variables

2. **Database Security:**
   - Use strong passwords
   - Enable SSL connections

3. **API Security:**
   - Implement rate limiting
   - Use HTTPS only
   - Validate all inputs

## Conclusion

Render.com cung cấp platform tuyệt vời để deploy FastAPI applications với:

- ✅ Easy deployment từ GitHub
- ✅ Automatic SSL certificates
- ✅ Built-in PostgreSQL và Redis
- ✅ Auto-scaling
- ✅ Free tier available
- ✅ Great performance
- ✅ Excellent documentation

Vietnamese Tax Filing API của bạn sẽ chạy ổn định trên Render với minimal configuration! 🚀
