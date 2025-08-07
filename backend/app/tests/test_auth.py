"""
Tests for authentication endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_register_user(self, client: TestClient):
        """Test user registration"""
        user_data = {
            "email": "newuser@example.com",
            "password": "NewPassword123",
            "first_name": "New",
            "last_name": "User",
            "role": "individual"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["first_name"] == user_data["first_name"]
        assert data["last_name"] == user_data["last_name"]
        assert data["role"] == user_data["role"]
        assert "password" not in data
    
    def test_register_duplicate_email(self, client: TestClient, test_user: User):
        """Test registration with duplicate email"""
        user_data = {
            "email": test_user.email,
            "password": "NewPassword123",
            "first_name": "New",
            "last_name": "User",
            "role": "individual"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "Email đã được sử dụng" in response.json()["detail"]
    
    def test_register_invalid_password(self, client: TestClient):
        """Test registration with invalid password"""
        user_data = {
            "email": "newuser@example.com",
            "password": "weak",  # Too weak
            "first_name": "New",
            "last_name": "User",
            "role": "individual"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 422
    
    def test_login_success(self, client: TestClient, test_user: User):
        """Test successful login"""
        login_data = {
            "email": test_user.email,
            "password": "TestPassword123"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
        assert data["user"]["email"] == test_user.email
    
    def test_login_invalid_credentials(self, client: TestClient, test_user: User):
        """Test login with invalid credentials"""
        login_data = {
            "email": test_user.email,
            "password": "WrongPassword"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        assert "Email hoặc mật khẩu không chính xác" in response.json()["detail"]
    
    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with nonexistent user"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "SomePassword123"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        assert "Email hoặc mật khẩu không chính xác" in response.json()["detail"]
    
    def test_get_current_user(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test getting current user info"""
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["first_name"] == test_user.first_name
        assert data["last_name"] == test_user.last_name
    
    def test_get_current_user_unauthorized(self, client: TestClient):
        """Test getting current user without authentication"""
        response = client.get("/api/v1/auth/me")
        
        assert response.status_code == 403
    
    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 401
    
    def test_change_password_success(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test successful password change"""
        password_data = {
            "current_password": "TestPassword123",
            "new_password": "NewPassword456"
        }
        
        response = client.post("/api/v1/auth/change-password", json=password_data, headers=auth_headers)
        
        assert response.status_code == 200
        assert "Đổi mật khẩu thành công" in response.json()["message"]
    
    def test_change_password_wrong_current(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test password change with wrong current password"""
        password_data = {
            "current_password": "WrongPassword",
            "new_password": "NewPassword456"
        }
        
        response = client.post("/api/v1/auth/change-password", json=password_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "Mật khẩu hiện tại không chính xác" in response.json()["detail"]
    
    def test_change_password_unauthorized(self, client: TestClient):
        """Test password change without authentication"""
        password_data = {
            "current_password": "TestPassword123",
            "new_password": "NewPassword456"
        }
        
        response = client.post("/api/v1/auth/change-password", json=password_data)
        
        assert response.status_code == 403
    
    def test_forgot_password(self, client: TestClient, test_user: User):
        """Test forgot password request"""
        reset_data = {
            "email": test_user.email
        }
        
        response = client.post("/api/v1/auth/forgot-password", json=reset_data)
        
        assert response.status_code == 200
        assert "Nếu email tồn tại" in response.json()["message"]
    
    def test_forgot_password_nonexistent_email(self, client: TestClient):
        """Test forgot password with nonexistent email"""
        reset_data = {
            "email": "nonexistent@example.com"
        }
        
        response = client.post("/api/v1/auth/forgot-password", json=reset_data)
        
        # Should return same message for security
        assert response.status_code == 200
        assert "Nếu email tồn tại" in response.json()["message"]
    
    def test_logout(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test logout"""
        response = client.post("/api/v1/auth/logout", headers=auth_headers)
        
        assert response.status_code == 200
        assert "Đăng xuất thành công" in response.json()["message"]
    
    def test_logout_unauthorized(self, client: TestClient):
        """Test logout without authentication"""
        response = client.post("/api/v1/auth/logout")
        
        assert response.status_code == 403
