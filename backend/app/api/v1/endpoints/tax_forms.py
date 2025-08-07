"""
Tax forms endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/")
async def get_tax_forms(
    skip: int = Query(0, ge=0, description="Số bản ghi bỏ qua"),
    limit: int = Query(100, ge=1, le=1000, description="Số bản ghi tối đa"),
    form_type: Optional[str] = Query(None, description="Loại tờ khai"),
    tax_year: Optional[int] = Query(None, description="Năm thuế"),
    status: Optional[str] = Query(None, description="Trạng thái"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Lấy danh sách tờ khai thuế của người dùng
    """
    # TODO: Implement tax forms retrieval
    return {
        "message": "Danh sách tờ khai thuế",
        "forms": [],
        "total": 0,
        "page": skip // limit + 1,
        "size": limit
    }


@router.post("/")
async def create_tax_form(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Tạo tờ khai thuế mới
    """
    # TODO: Implement tax form creation
    return {"message": "Tạo tờ khai thuế thành công"}


@router.get("/{form_id}")
async def get_tax_form(
    form_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Lấy thông tin tờ khai thuế theo ID
    """
    # TODO: Implement tax form retrieval by ID
    return {"message": f"Thông tin tờ khai thuế {form_id}"}


@router.put("/{form_id}")
async def update_tax_form(
    form_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Cập nhật tờ khai thuế
    """
    # TODO: Implement tax form update
    return {"message": f"Cập nhật tờ khai thuế {form_id} thành công"}


@router.delete("/{form_id}")
async def delete_tax_form(
    form_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Xóa tờ khai thuế
    """
    # TODO: Implement tax form deletion
    return {"message": f"Xóa tờ khai thuế {form_id} thành công"}


@router.post("/{form_id}/submit")
async def submit_tax_form(
    form_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Nộp tờ khai thuế
    """
    # TODO: Implement tax form submission
    return {"message": f"Nộp tờ khai thuế {form_id} thành công"}


@router.get("/{form_id}/pdf")
async def generate_tax_form_pdf(
    form_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Tạo file PDF cho tờ khai thuế
    """
    # TODO: Implement PDF generation
    return {"message": f"Tạo PDF cho tờ khai thuế {form_id}"}


@router.get("/templates/")
async def get_tax_form_templates(
    form_type: Optional[str] = Query(None, description="Loại tờ khai"),
    year: Optional[int] = Query(None, description="Năm"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Lấy danh sách mẫu tờ khai thuế
    """
    # TODO: Implement template retrieval
    return {
        "message": "Danh sách mẫu tờ khai thuế",
        "templates": []
    }


@router.get("/templates/{template_id}")
async def get_tax_form_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Lấy mẫu tờ khai thuế theo ID
    """
    # TODO: Implement template retrieval by ID
    return {"message": f"Mẫu tờ khai thuế {template_id}"}


@router.post("/{form_id}/attachments")
async def upload_tax_form_attachment(
    form_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Tải lên tài liệu đính kèm cho tờ khai thuế
    """
    # TODO: Implement file upload
    return {"message": f"Tải lên tài liệu đính kèm cho tờ khai thuế {form_id} thành công"}


@router.get("/{form_id}/attachments")
async def get_tax_form_attachments(
    form_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Lấy danh sách tài liệu đính kèm của tờ khai thuế
    """
    # TODO: Implement attachments retrieval
    return {
        "message": f"Danh sách tài liệu đính kèm của tờ khai thuế {form_id}",
        "attachments": []
    }
