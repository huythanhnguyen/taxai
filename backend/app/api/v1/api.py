"""
Main API router for v1
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, tax_forms, ai_processing

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(tax_forms.router, prefix="/tax-forms", tags=["tax-forms"])
api_router.include_router(ai_processing.router, prefix="/ai", tags=["ai-processing"])
