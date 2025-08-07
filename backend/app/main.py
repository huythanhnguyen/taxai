"""
Vietnamese Tax Filing PWA Backend
FastAPI Application with Google ADK Integration
"""

from fastapi import FastAPI, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
import uvicorn

from app.core.config import settings
from app.core.database import init_db
from app.core.valkey import test_valkey, close_valkey
from app.api.v1.api import api_router
from app.core.security import get_current_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    await init_db()
    
    # Test Valkey connection
    valkey_connected = await test_valkey()
    if valkey_connected:
        print("✅ Valkey connection established")
    else:
        print("⚠️ Valkey connection failed - some features may not work")
    
    yield
    
    # Shutdown
    await close_valkey()
    print("🔒 Valkey connections closed")


# FastAPI application with Vietnamese tax filing focus
app = FastAPI(
    title="Vietnamese Tax Filing API",
    description="API cho hệ thống kê khai thuế Việt Nam với AI hỗ trợ",
    version="2.0.0",
    docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan
)

# Security
security = HTTPBearer()

# Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Vietnamese Tax Filing PWA API",
        "version": "2.0.0",
        "status": "active"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development"
    )
