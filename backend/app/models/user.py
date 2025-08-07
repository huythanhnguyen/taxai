"""
User model for Vietnamese Tax Filing System
"""

from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False, default="individual")  # individual, business, consultant, admin
    is_active = Column(Boolean, default=True)
    is_email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(255), nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    tax_declarations = relationship("TaxDeclaration", back_populates="user")
    ai_processing_logs = relationship("AIProcessingLog", back_populates="user")
    sessions = relationship("UserSession", back_populates="user")
    
    @property
    def full_name(self) -> str:
        """Get full name"""
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"


class UserProfile(Base):
    """User profile model with Vietnamese tax-specific fields"""
    __tablename__ = "user_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    taxpayer_id = Column(String(20), unique=True, nullable=True)  # Mã số thuế
    phone_number = Column(String(20), nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    occupation = Column(String(100), nullable=True)
    company = Column(String(200), nullable=True)
    preferred_language = Column(String(5), default="vi")
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="profile")
    addresses = relationship("Address", back_populates="user_profile")
    
    def __repr__(self):
        return f"<UserProfile(id={self.id}, taxpayer_id={self.taxpayer_id})>"


class Address(Base):
    """Address model for Vietnamese addresses"""
    __tablename__ = "addresses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_profile_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    type = Column(String(20), default="primary")  # primary, business, mailing
    street = Column(String(255), nullable=False)
    ward = Column(String(100), nullable=False)  # Phường/Xã
    district = Column(String(100), nullable=False)  # Quận/Huyện
    city = Column(String(100), nullable=False)  # Thành phố
    province = Column(String(100), nullable=False)  # Tỉnh/Thành phố
    postal_code = Column(String(10), nullable=True)
    country = Column(String(100), default="Vietnam")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user_profile = relationship("UserProfile", back_populates="addresses")
    
    @property
    def full_address(self) -> str:
        """Get full Vietnamese address"""
        return f"{self.street}, {self.ward}, {self.district}, {self.city}, {self.province}"
    
    def __repr__(self):
        return f"<Address(id={self.id}, type={self.type})>"


class UserSession(Base):
    """User session model for JWT token management"""
    __tablename__ = "user_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    refresh_token = Column(String(500), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    last_used_at = Column(DateTime, server_default=func.now())
    ip_address = Column(String(45), nullable=True)  # Support IPv6
    user_agent = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    
    def __repr__(self):
        return f"<UserSession(id={self.id}, user_id={self.user_id})>"
