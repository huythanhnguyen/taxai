#!/usr/bin/env python3
"""
Production server runner for Vietnamese Tax Filing API
Run this script directly on server without Docker
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
    os.makedirs("logs", exist_ok=True)
    
    # Get port from environment (Render sets this)
    port = int(os.environ.get("PORT", 8000))
    
    # Server configuration for Render
    config = {
        "app": "app.main:app",
        "host": "0.0.0.0",
        "port": port,
        "reload": False,  # Never reload in production
        "workers": 1,  # Render starter plan limitation
        "log_level": "info",
        "access_log": True,
        "log_config": {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
                "access": {
                    "format": "%(asctime)s - %(client_addr)s - %(request_line)s - %(status_code)s",
                },
            },
            "handlers": {
                "default": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
                "access": {
                    "formatter": "access",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
                "file": {
                    "formatter": "default",
                    "class": "logging.handlers.RotatingFileHandler",
                    "filename": "logs/api.log",
                    "maxBytes": 50 * 1024 * 1024,  # 50MB
                    "backupCount": 10,
                },
            },
            "loggers": {
                "uvicorn": {"handlers": ["default", "file"], "level": "INFO"},
                "uvicorn.error": {"level": "INFO"},
                "uvicorn.access": {"handlers": ["access", "file"], "level": "INFO", "propagate": False},
                "app": {"handlers": ["default", "file"], "level": "INFO"},
            },
        }
    }
    
    print(f"Starting Vietnamese Tax Filing API Server on Render...")
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Port: {port}")
    print(f"Server will be available at: https://tax-filing-api.onrender.com")
    print(f"API Documentation: https://tax-filing-api.onrender.com/api/docs")
    
    # Run the server
    uvicorn.run(**config)

if __name__ == "__main__":
    main()
