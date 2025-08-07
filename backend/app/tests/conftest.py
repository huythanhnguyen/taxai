"""
Pytest configuration and fixtures for Vietnamese Tax Filing API tests
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db_session, Base
from app.core.security import create_access_token
from app.models.user import User, UserProfile
from app.crud.user import create_user
from app.schemas.user import UserCreate

# Test database URL (in-memory SQLite for testing)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Create test session factory
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    async with TestSessionLocal() as session:
        yield session
    
    # Drop all tables after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def client(db_session: AsyncSession) -> TestClient:
    """Create a test client with database dependency override."""
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db_session] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Clean up
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user_data = UserCreate(
        email="test@example.com",
        password="TestPassword123",
        first_name="Test",
        last_name="User",
        role="individual"
    )
    user = await create_user(db_session, user_data)
    return user


@pytest.fixture
async def test_admin_user(db_session: AsyncSession) -> User:
    """Create a test admin user."""
    user_data = UserCreate(
        email="admin@example.com",
        password="AdminPassword123",
        first_name="Admin",
        last_name="User",
        role="admin"
    )
    user = await create_user(db_session, user_data)
    return user


@pytest.fixture
def test_user_token(test_user: User) -> str:
    """Create access token for test user."""
    return create_access_token(data={"sub": str(test_user.id)})


@pytest.fixture
def test_admin_token(test_admin_user: User) -> str:
    """Create access token for test admin user."""
    return create_access_token(data={"sub": str(test_admin_user.id)})


@pytest.fixture
def auth_headers(test_user_token: str) -> dict:
    """Create authorization headers for test user."""
    return {"Authorization": f"Bearer {test_user_token}"}


@pytest.fixture
def admin_auth_headers(test_admin_token: str) -> dict:
    """Create authorization headers for test admin user."""
    return {"Authorization": f"Bearer {test_admin_token}"}


@pytest.fixture
def sample_tax_form_data() -> dict:
    """Sample tax form data for testing."""
    return {
        "form_type": "PIT",
        "tax_year": 2024,
        "tax_period_type": "ANNUAL",
        "period_start_date": "2024-01-01T00:00:00",
        "period_end_date": "2024-12-31T23:59:59",
        "taxpayer_info": {
            "tax_id": "0123456789",
            "name": "Nguyễn Văn A",
            "address": "123 Đường ABC, Phường XYZ, Quận 1, TP.HCM",
            "phone_number": "0901234567",
            "email": "nguyenvana@example.com"
        },
        "income_details": [
            {
                "income_type": "SALARY",
                "description": "Lương cơ bản",
                "amount": "120000000",
                "tax_withheld": "2000000",
                "source": "Công ty ABC"
            }
        ],
        "deduction_details": [
            {
                "deduction_type": "PERSONAL",
                "description": "Giảm trừ bản thân",
                "amount": "11000000"
            }
        ]
    }


@pytest.fixture
def sample_voice_data() -> bytes:
    """Sample voice data for testing."""
    # This would be actual audio data in a real test
    return b"fake_audio_data_for_testing"


@pytest.fixture
def sample_document_data() -> bytes:
    """Sample document data for testing."""
    # This would be actual PDF/image data in a real test
    return b"fake_document_data_for_testing"


@pytest.fixture
def mock_ai_response() -> dict:
    """Mock AI processing response."""
    return {
        "success": True,
        "transcribed_text": "Mười triệu đồng",
        "extracted_value": "10000000",
        "confidence_score": 95.0,
        "processing_time_ms": 1500
    }
