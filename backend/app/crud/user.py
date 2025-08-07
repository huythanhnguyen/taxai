"""
CRUD operations for User models
"""

from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
import uuid

from app.models.user import User, UserProfile, Address
from app.schemas.user import UserCreate, UserUpdate, UserProfileCreate, UserProfileUpdate, AddressCreate, AddressUpdate
from app.core.security import get_password_hash, verify_password


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    """Get user by ID"""
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile).selectinload(UserProfile.addresses))
        .where(User.id == user_id)
    )
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get user by email"""
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile).selectinload(UserProfile.addresses))
        .where(User.email == email)
    )
    return result.scalar_one_or_none()


async def get_users(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 100,
    role: Optional[str] = None,
    is_active: Optional[bool] = None
) -> List[User]:
    """Get users with pagination and filters"""
    query = select(User).options(selectinload(User.profile))
    
    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def create_user(db: AsyncSession, user: UserCreate) -> User:
    """Create new user"""
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def update_user(db: AsyncSession, user_id: str, user_update: UserUpdate) -> Optional[User]:
    """Update user"""
    update_data = user_update.dict(exclude_unset=True)
    if not update_data:
        return await get_user_by_id(db, user_id)
    
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(**update_data)
    )
    await db.commit()
    return await get_user_by_id(db, user_id)


async def delete_user(db: AsyncSession, user_id: str) -> bool:
    """Delete user (soft delete by setting is_active=False)"""
    result = await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(is_active=False)
    )
    await db.commit()
    return result.rowcount > 0


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    """Authenticate user"""
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def change_password(db: AsyncSession, user_id: str, current_password: str, new_password: str) -> bool:
    """Change user password"""
    user = await get_user_by_id(db, user_id)
    if not user:
        return False
    
    if not verify_password(current_password, user.password_hash):
        return False
    
    new_hashed_password = get_password_hash(new_password)
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(password_hash=new_hashed_password)
    )
    await db.commit()
    return True


# User Profile CRUD operations
async def get_user_profile(db: AsyncSession, user_id: str) -> Optional[UserProfile]:
    """Get user profile"""
    result = await db.execute(
        select(UserProfile)
        .options(selectinload(UserProfile.addresses))
        .where(UserProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_user_profile(db: AsyncSession, user_id: str, profile: UserProfileCreate) -> UserProfile:
    """Create user profile"""
    db_profile = UserProfile(
        user_id=user_id,
        **profile.dict()
    )
    db.add(db_profile)
    await db.commit()
    await db.refresh(db_profile)
    return db_profile


async def update_user_profile(db: AsyncSession, user_id: str, profile_update: UserProfileUpdate) -> Optional[UserProfile]:
    """Update user profile"""
    update_data = profile_update.dict(exclude_unset=True)
    if not update_data:
        return await get_user_profile(db, user_id)
    
    await db.execute(
        update(UserProfile)
        .where(UserProfile.user_id == user_id)
        .values(**update_data)
    )
    await db.commit()
    return await get_user_profile(db, user_id)


# Address CRUD operations
async def get_user_addresses(db: AsyncSession, user_id: str) -> List[Address]:
    """Get user addresses"""
    # First get the user profile
    profile = await get_user_profile(db, user_id)
    if not profile:
        return []
    
    result = await db.execute(
        select(Address)
        .where(Address.user_profile_id == profile.id)
        .order_by(Address.is_default.desc(), Address.created_at)
    )
    return result.scalars().all()


async def create_user_address(db: AsyncSession, user_id: str, address: AddressCreate) -> Optional[Address]:
    """Create user address"""
    profile = await get_user_profile(db, user_id)
    if not profile:
        return None
    
    # If this is set as default, unset other default addresses
    if address.is_default:
        await db.execute(
            update(Address)
            .where(Address.user_profile_id == profile.id)
            .values(is_default=False)
        )
    
    db_address = Address(
        user_profile_id=profile.id,
        **address.dict()
    )
    db.add(db_address)
    await db.commit()
    await db.refresh(db_address)
    return db_address


async def update_user_address(db: AsyncSession, user_id: str, address_id: str, address_update: AddressUpdate) -> Optional[Address]:
    """Update user address"""
    profile = await get_user_profile(db, user_id)
    if not profile:
        return None
    
    update_data = address_update.dict(exclude_unset=True)
    if not update_data:
        return None
    
    # If setting as default, unset other default addresses
    if update_data.get('is_default'):
        await db.execute(
            update(Address)
            .where(Address.user_profile_id == profile.id)
            .where(Address.id != address_id)
            .values(is_default=False)
        )
    
    await db.execute(
        update(Address)
        .where(Address.id == address_id)
        .where(Address.user_profile_id == profile.id)
        .values(**update_data)
    )
    await db.commit()
    
    result = await db.execute(
        select(Address)
        .where(Address.id == address_id)
        .where(Address.user_profile_id == profile.id)
    )
    return result.scalar_one_or_none()


async def delete_user_address(db: AsyncSession, user_id: str, address_id: str) -> bool:
    """Delete user address"""
    profile = await get_user_profile(db, user_id)
    if not profile:
        return False
    
    result = await db.execute(
        delete(Address)
        .where(Address.id == address_id)
        .where(Address.user_profile_id == profile.id)
    )
    await db.commit()
    return result.rowcount > 0
