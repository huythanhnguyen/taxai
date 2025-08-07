"""
Authentication endpoints
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.security import create_access_token, create_refresh_token, verify_token, get_current_user
from app.core.config import settings
from app.crud.user import authenticate_user, create_user, get_user_by_email, change_password
from app.schemas.user import (
    LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse,
    UserCreate, UserResponse, PasswordResetRequest, PasswordResetConfirm,
    ChangePasswordRequest, EmailVerificationRequest
)
from app.models.user import User

router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Đăng ký tài khoản mới
    """
    # Check if user already exists
    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được sử dụng"
        )
    
    # Create new user
    user = await create_user(db, user_data)
    return user


@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Đăng nhập
    """
    user = await authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tài khoản đã bị vô hiệu hóa"
        )
    
    # Create tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user
    )


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Làm mới access token
    """
    payload = verify_token(refresh_data.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    
    return RefreshTokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Lấy thông tin người dùng hiện tại
    """
    return current_user


@router.post("/change-password")
async def change_user_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Đổi mật khẩu
    """
    success = await change_password(
        db, 
        str(current_user.id), 
        password_data.current_password, 
        password_data.new_password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không chính xác"
        )
    
    return {"message": "Đổi mật khẩu thành công"}


@router.post("/forgot-password")
async def forgot_password(
    reset_data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Yêu cầu đặt lại mật khẩu
    """
    user = await get_user_by_email(db, reset_data.email)
    if not user:
        # Don't reveal if email exists or not
        return {"message": "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu"}
    
    # TODO: Generate reset token and send email
    # For now, just return success message
    return {"message": "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu"}


@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Đặt lại mật khẩu
    """
    # TODO: Verify reset token and update password
    # For now, just return success message
    return {"message": "Đặt lại mật khẩu thành công"}


@router.post("/verify-email")
async def verify_email(
    verification_data: EmailVerificationRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Xác thực email
    """
    # TODO: Verify email token and update user
    # For now, just return success message
    return {"message": "Xác thực email thành công"}


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Đăng xuất
    """
    # TODO: Invalidate refresh token
    # For now, just return success message
    return {"message": "Đăng xuất thành công"}
