#!/usr/bin/env python3
"""
Celery worker runner for Vietnamese Tax Filing API
Run this script to start Celery workers for background AI processing
"""

import os
import sys
from pathlib import Path

# Add the app directory to Python path
app_dir = Path(__file__).parent
sys.path.insert(0, str(app_dir))

from celery import Celery
from app.core.config import settings

# Create Celery app with Valkey backend
celery_app = Celery(
    'vietnamese_tax_ai',
    broker=settings.CELERY_BROKER_URL,  # Valkey URL
    backend=settings.CELERY_RESULT_BACKEND,  # Valkey URL
    include=['app.ai.tasks']  # Include AI processing tasks
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Ho_Chi_Minh',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    result_expires=3600,  # 1 hour
)

def main():
    """Run Celery worker"""
    
    print("Starting Vietnamese Tax Filing Celery Worker...")
    print(f"Broker: {settings.CELERY_BROKER_URL}")
    print(f"Backend: {settings.CELERY_RESULT_BACKEND}")
    
    # Start worker
    celery_app.worker_main([
        'worker',
        '--loglevel=info',
        '--concurrency=2',
        '--max-tasks-per-child=1000',
        '--time-limit=1800',  # 30 minutes
        '--soft-time-limit=1500',  # 25 minutes
    ])

if __name__ == "__main__":
    main()
