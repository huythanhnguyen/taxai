"""
User management endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.security import get_current_user, check_user_role
from app.crud.user import (
    get_users, get_user_by_id, update_user, delete_user,
    get_user_profile, create_user_profile, update_user_profile,
    get_user_addresses, create_user_address, update_user_address, delete_user_address
)
from app.schemas.user import (
    UserResponse, UserUpdate, UserListResponse,
    UserProfileResponse, UserProfileCreate, UserProfileUpdate,
    AddressResponse, AddressCreate, AddressUpdate
)
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=UserListResponse)
async def get_users_list(
    skip: int = Query(0, ge=0, description="Số bản ghi bỏ qua"),
    limit: int = Query(100, ge=1, le=1000, description="Số bản ghi tối đa"),
    role: Optional[str] = Query(None, description="Lọc theo vai trò"),
    is_active: Optional[bool] = Query(None, description="Lọc theo trạng thái hoạt động"),
    current_user: User = Depends(check_user_role(["admin", "consultant"])),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Lấy danh sách người dùng (chỉ admin và consultant)
    """
    users = await get_users(db, skip=skip, limit=limit, role=role, is_active=is_active)
    
    # Get total count (simplified - in production, you'd want a separate count query)
    total = len(users)
    
    return UserListResponse(
        users=users,
        total=total,
        page=skip // limit + 1,
        size=limit
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Lấy thông tin người dùng theo ID
    """
    # Users can only view their own profile unless they're admin/consultant
    if str(current_user.id) != user_id and current_user.role not in ["admin", "consultant"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập"
        )
    
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng"
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user_info(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Cập nhật thông tin người dùng
    """
    # Users can only update their own profile unless they're admin
    if str(current_user.id) != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập"
        )
    
    user = await update_user(db, user_id, user_update)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng"
        )
    
    return user


@router.delete("/{user_id}")
async def delete_user_account(
    user_id: str,
    current_user: User = Depends(check_user_role(["admin"])),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Xóa tài khoản người dùng (chỉ admin)
    """
    success = await delete_user(db, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng"
        )
    
    return {"message": "Xóa tài khoản thành công"}


# User Profile endpoints
@router.get("/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile_info(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Lấy thông tin hồ sơ người dùng
    """
    # Users can only view their own profile unless they're admin/consultant
    if str(current_user.id) != user_id and current_user.role not in ["admin", "consultant"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập"
        )
    
    profile = await get_user_profile(db, user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hồ sơ người dùng"
        )
    
    return profile


@router.post("/{user_id}/profile", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_user_profile_info(
    user_id: str,
    profile_data: UserProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Tạo hồ sơ người dùng
    """
    # Users can only create their own profile
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập"
        )
    
    # Check if profile already exists
    existing_profile = await get_user_profile(db, user_id)
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hồ sơ người dùng đã tồn tại"
        )
    
    profile = await create_user_profile(db, user_id, profile_data)
    return profile


@router.put("/{user_id}/profile", response_model=UserProfileResponse)
async def update_user_profile_info(
    user_id: str,
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Cập nhật hồ sơ người dùng
    """
    # Users can only update their own profile
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập"
        )
    
    profile = await update_user_profile(db, user_id, profile_update)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hồ sơ người dùng"
        )
    
    return profile


# Address endpoints
@router.get("/{user_id}/addresses", response_model=List[AddressResponse])
async def get_user_addresses_list(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Lấy danh sách địa chỉ của người dùng
    """
    # Users can only view their own addresses unless they're admin/consultant
    if str(current_user.id) != user_id and current_user.role not in ["admin", "consultant"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập"
        )
    
    addresses = await get_user_addresses(db, user_id)
    return addresses


@router.post("/{user_id}/addresses", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
async def create_user_address_info(
    user_id: str,
    address_data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Tạo địa chỉ mới cho người dùng
    """
    # Users can only create their own addresses
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập"
        )
    
    address = await create_user_address(db, user_id, address_data)
    if not address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể tạo địa chỉ. Vui lòng tạo hồ sơ người dùng trước."
        )
    
    return address


@router.put("/{user_id}/addresses/{address_id}", response_model=AddressResponse)
async def update_user_address_info(
    user_id: str,
    address_id: str,
    address_update: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Cập nhật địa chỉ của người dùng
    """
    # Users can only update their own addresses
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập"
        )
    
    address = await update_user_address(db, user_id, address_id, address_update)
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy địa chỉ"
        )
    
    return address


@router.delete("/{user_id}/addresses/{address_id}")
async def delete_user_address_info(
    user_id: str,
    address_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Xóa địa chỉ của người dùng
    """
    # Users can only delete their own addresses
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập"
        )
    
    success = await delete_user_address(db, user_id, address_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy địa chỉ"
        )
    
    return {"message": "Xóa địa chỉ thành công"}
