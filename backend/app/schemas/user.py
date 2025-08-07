"""
Pydantic schemas for User models
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid


class UserRole(str, Enum):
    """User roles enum"""
    INDIVIDUAL = "individual"
    BUSINESS = "business"
    CONSULTANT = "consultant"
    ADMIN = "admin"


class AddressType(str, Enum):
    """Address types enum"""
    PRIMARY = "primary"
    BUSINESS = "business"
    MAILING = "mailing"


# Base schemas
class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole = UserRole.INDIVIDUAL


class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserUpdate(BaseModel):
    """User update schema"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    role: Optional[UserRole] = None


class UserProfileBase(BaseModel):
    """Base user profile schema"""
    taxpayer_id: Optional[str] = Field(None, regex=r"^\d{10,13}$", description="Mã số thuế")
    phone_number: Optional[str] = Field(None, regex=r"^[0-9+\-\s()]+$")
    date_of_birth: Optional[datetime] = None
    occupation: Optional[str] = Field(None, max_length=100)
    company: Optional[str] = Field(None, max_length=200)
    preferred_language: str = Field(default="vi", regex=r"^(vi|en)$")


class UserProfileCreate(UserProfileBase):
    """User profile creation schema"""
    pass


class UserProfileUpdate(UserProfileBase):
    """User profile update schema"""
    two_factor_enabled: Optional[bool] = None


class AddressBase(BaseModel):
    """Base address schema"""
    type: AddressType = AddressType.PRIMARY
    street: str = Field(..., min_length=1, max_length=255)
    ward: str = Field(..., min_length=1, max_length=100, description="Phường/Xã")
    district: str = Field(..., min_length=1, max_length=100, description="Quận/Huyện")
    city: str = Field(..., min_length=1, max_length=100, description="Thành phố")
    province: str = Field(..., min_length=1, max_length=100, description="Tỉnh/Thành phố")
    postal_code: Optional[str] = Field(None, max_length=10)
    country: str = Field(default="Vietnam", max_length=100)
    is_default: bool = False


class AddressCreate(AddressBase):
    """Address creation schema"""
    pass


class AddressUpdate(AddressBase):
    """Address update schema"""
    street: Optional[str] = Field(None, min_length=1, max_length=255)
    ward: Optional[str] = Field(None, min_length=1, max_length=100)
    district: Optional[str] = Field(None, min_length=1, max_length=100)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    province: Optional[str] = Field(None, min_length=1, max_length=100)


# Response schemas
class AddressResponse(AddressBase):
    """Address response schema"""
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserProfileResponse(UserProfileBase):
    """User profile response schema"""
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    addresses: List[AddressResponse] = []
    
    class Config:
        from_attributes = True


class UserResponse(UserBase):
    """User response schema"""
    id: uuid.UUID
    is_active: bool
    is_email_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    profile: Optional[UserProfileResponse] = None
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """User list response schema"""
    users: List[UserResponse]
    total: int
    page: int
    size: int


# Authentication schemas
class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Login response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema"""
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    """Refresh token response schema"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class PasswordResetRequest(BaseModel):
    """Password reset request schema"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @validator('new_password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class ChangePasswordRequest(BaseModel):
    """Change password request schema"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @validator('new_password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class EmailVerificationRequest(BaseModel):
    """Email verification request schema"""
    token: str


# Two-factor authentication schemas
class TwoFactorSetupResponse(BaseModel):
    """Two-factor setup response schema"""
    secret: str
    qr_code_url: str
    backup_codes: List[str]


class TwoFactorVerifyRequest(BaseModel):
    """Two-factor verification request schema"""
    code: str = Field(..., regex=r"^\d{6}$")


class TwoFactorLoginRequest(LoginRequest):
    """Two-factor login request schema"""
    two_factor_code: Optional[str] = Field(None, regex=r"^\d{6}$")
