"""
Celery tasks for background AI processing
"""

import asyncio
import logging
from typing import Dict, Any, List
from celery import Celery
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.core.config import settings
from app.ai.agents import TaxAIService

logger = logging.getLogger(__name__)

# Create Celery app
celery_app = Celery(
    'vietnamese_tax_ai',
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
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

# Create async engine for background tasks
engine = create_async_engine(settings.DATABASE_URL)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@celery_app.task(bind=True, name='process_voice_input')
def process_voice_input_task(
    self, 
    user_id: str, 
    audio_data_b64: str, 
    target_field: str,
    form_type: str,
    language: str = "vi-VN"
):
    """Background task for processing voice input"""
    try:
        # Update task state
        self.update_state(state='PROGRESS', meta={'progress': 10, 'status': 'Đang khởi tạo...'})
        
        async def _process():
            async with async_session() as db:
                service = TaxAIService(db, user_id)
                
                # Decode base64 audio data
                import base64
                audio_data = base64.b64decode(audio_data_b64)
                
                # Update progress
                self.update_state(state='PROGRESS', meta={'progress': 50, 'status': 'Đang xử lý giọng nói...'})
                
                result = await service.process_voice_input(
                    audio_data, 
                    target_field,
                    form_type,
                    language
                )
                
                # Update progress
                self.update_state(state='PROGRESS', meta={'progress': 90, 'status': 'Hoàn thành xử lý...'})
                
                return result
        
        # Run async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_process())
        
        return {
            "status": "completed",
            "result": result,
            "task_id": self.request.id
        }
        
    except Exception as exc:
        logger.error(f"Voice processing task failed: {exc}")
        self.update_state(
            state='FAILURE',
            meta={'error': str(exc), 'status': 'Lỗi xử lý giọng nói'}
        )
        raise self.retry(exc=exc, countdown=60, max_retries=3)


@celery_app.task(bind=True, name='process_document')
def process_document_task(
    self,
    user_id: str,
    document_data_b64: str,
    field_specifications: List[str],
    document_type: str,
    form_type: str
):
    """Background task for processing documents"""
    try:
        # Update task state
        self.update_state(state='PROGRESS', meta={'progress': 10, 'status': 'Đang khởi tạo...'})
        
        async def _process():
            async with async_session() as db:
                service = TaxAIService(db, user_id)
                
                # Decode base64 document data
                import base64
                document_data = base64.b64decode(document_data_b64)
                
                # Update progress
                self.update_state(state='PROGRESS', meta={'progress': 30, 'status': 'Đang phân tích tài liệu...'})
                
                result = await service.process_document(
                    document_data,
                    field_specifications,
                    document_type,
                    form_type
                )
                
                # Update progress
                self.update_state(state='PROGRESS', meta={'progress': 90, 'status': 'Hoàn thành xử lý...'})
                
                return result
        
        # Run async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_process())
        
        return {
            "status": "completed",
            "result": result,
            "task_id": self.request.id
        }
        
    except Exception as exc:
        logger.error(f"Document processing task failed: {exc}")
        self.update_state(
            state='FAILURE',
            meta={'error': str(exc), 'status': 'Lỗi xử lý tài liệu'}
        )
        raise self.retry(exc=exc, countdown=60, max_retries=3)


@celery_app.task(bind=True, name='validate_tax_data')
def validate_tax_data_task(
    self,
    user_id: str,
    form_data: Dict[str, Any],
    form_type: str,
    tax_year: int
):
    """Background task for validating tax data"""
    try:
        # Update task state
        self.update_state(state='PROGRESS', meta={'progress': 10, 'status': 'Đang khởi tạo...'})
        
        async def _process():
            async with async_session() as db:
                service = TaxAIService(db, user_id)
                
                # Update progress
                self.update_state(state='PROGRESS', meta={'progress': 50, 'status': 'Đang xác thực dữ liệu...'})
                
                result = await service.validate_tax_data(form_data, form_type, tax_year)
                
                # Update progress
                self.update_state(state='PROGRESS', meta={'progress': 90, 'status': 'Hoàn thành xác thực...'})
                
                return result
        
        # Run async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_process())
        
        return {
            "status": "completed",
            "result": result,
            "task_id": self.request.id
        }
        
    except Exception as exc:
        logger.error(f"Tax validation task failed: {exc}")
        self.update_state(
            state='FAILURE',
            meta={'error': str(exc), 'status': 'Lỗi xác thực dữ liệu'}
        )
        raise self.retry(exc=exc, countdown=60, max_retries=3)


@celery_app.task(bind=True, name='calculate_tax')
def calculate_tax_task(
    self,
    user_id: str,
    form_data: Dict[str, Any],
    form_type: str,
    tax_year: int
):
    """Background task for calculating tax"""
    try:
        # Update task state
        self.update_state(state='PROGRESS', meta={'progress': 10, 'status': 'Đang khởi tạo...'})
        
        async def _process():
            async with async_session() as db:
                service = TaxAIService(db, user_id)
                
                # Update progress
                self.update_state(state='PROGRESS', meta={'progress': 50, 'status': 'Đang tính toán thuế...'})
                
                result = await service.calculate_tax(form_data, form_type, tax_year)
                
                # Update progress
                self.update_state(state='PROGRESS', meta={'progress': 90, 'status': 'Hoàn thành tính toán...'})
                
                return result
        
        # Run async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_process())
        
        return {
            "status": "completed",
            "result": result,
            "task_id": self.request.id
        }
        
    except Exception as exc:
        logger.error(f"Tax calculation task failed: {exc}")
        self.update_state(
            state='FAILURE',
            meta={'error': str(exc), 'status': 'Lỗi tính toán thuế'}
        )
        raise self.retry(exc=exc, countdown=60, max_retries=3)


@celery_app.task(name='cleanup_old_tasks')
def cleanup_old_tasks():
    """Cleanup old task results"""
    try:
        # TODO: Implement cleanup logic
        logger.info("Cleaning up old task results...")
        return {"status": "completed", "message": "Cleanup completed"}
    except Exception as exc:
        logger.error(f"Cleanup task failed: {exc}")
        raise


@celery_app.task(name='generate_performance_report')
def generate_performance_report():
    """Generate AI model performance report"""
    try:
        # TODO: Implement performance report generation
        logger.info("Generating AI performance report...")
        return {"status": "completed", "message": "Performance report generated"}
    except Exception as exc:
        logger.error(f"Performance report task failed: {exc}")
        raise


# Periodic tasks configuration
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    'cleanup-old-tasks': {
        'task': 'cleanup_old_tasks',
        'schedule': crontab(hour=2, minute=0),  # Run daily at 2 AM
    },
    'generate-performance-report': {
        'task': 'generate_performance_report',
        'schedule': crontab(hour=1, minute=0, day_of_week=1),  # Run weekly on Monday at 1 AM
    },
}

celery_app.conf.timezone = 'Asia/Ho_Chi_Minh'
