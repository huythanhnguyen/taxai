"""
Tests for user management endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class TestUserEndpoints:
    """Test user management endpoints"""
    
    def test_get_users_as_admin(self, client: TestClient, test_admin_user: User, admin_auth_headers: dict):
        """Test getting users list as admin"""
        response = client.get("/api/v1/users/", headers=admin_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert "page" in data
        assert "size" in data
    
    def test_get_users_as_regular_user(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test getting users list as regular user (should fail)"""
        response = client.get("/api/v1/users/", headers=auth_headers)
        
        assert response.status_code == 403
    
    def test_get_user_self(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test getting own user info"""
        response = client.get(f"/api/v1/users/{test_user.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["first_name"] == test_user.first_name
    
    def test_get_user_other_as_regular_user(self, client: TestClient, test_user: User, test_admin_user: User, auth_headers: dict):
        """Test getting other user info as regular user (should fail)"""
        response = client.get(f"/api/v1/users/{test_admin_user.id}", headers=auth_headers)
        
        assert response.status_code == 403
    
    def test_get_user_other_as_admin(self, client: TestClient, test_user: User, test_admin_user: User, admin_auth_headers: dict):
        """Test getting other user info as admin"""
        response = client.get(f"/api/v1/users/{test_user.id}", headers=admin_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
    
    def test_get_nonexistent_user(self, client: TestClient, admin_auth_headers: dict):
        """Test getting nonexistent user"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/v1/users/{fake_id}", headers=admin_auth_headers)
        
        assert response.status_code == 404
    
    def test_update_user_self(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test updating own user info"""
        update_data = {
            "first_name": "Updated",
            "last_name": "Name"
        }
        
        response = client.put(f"/api/v1/users/{test_user.id}", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "Updated"
        assert data["last_name"] == "Name"
    
    def test_update_user_other_as_regular_user(self, client: TestClient, test_user: User, test_admin_user: User, auth_headers: dict):
        """Test updating other user as regular user (should fail)"""
        update_data = {
            "first_name": "Hacked"
        }
        
        response = client.put(f"/api/v1/users/{test_admin_user.id}", json=update_data, headers=auth_headers)
        
        assert response.status_code == 403
    
    def test_update_user_as_admin(self, client: TestClient, test_user: User, admin_auth_headers: dict):
        """Test updating user as admin"""
        update_data = {
            "first_name": "Admin Updated"
        }
        
        response = client.put(f"/api/v1/users/{test_user.id}", json=update_data, headers=admin_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "Admin Updated"
    
    def test_delete_user_as_admin(self, client: TestClient, test_user: User, admin_auth_headers: dict):
        """Test deleting user as admin"""
        response = client.delete(f"/api/v1/users/{test_user.id}", headers=admin_auth_headers)
        
        assert response.status_code == 200
        assert "Xóa tài khoản thành công" in response.json()["message"]
    
    def test_delete_user_as_regular_user(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test deleting user as regular user (should fail)"""
        response = client.delete(f"/api/v1/users/{test_user.id}", headers=auth_headers)
        
        assert response.status_code == 403


class TestUserProfileEndpoints:
    """Test user profile endpoints"""
    
    def test_create_user_profile(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test creating user profile"""
        profile_data = {
            "taxpayer_id": "0123456789",
            "phone_number": "0901234567",
            "occupation": "Software Engineer",
            "company": "Tech Company",
            "preferred_language": "vi"
        }
        
        response = client.post(f"/api/v1/users/{test_user.id}/profile", json=profile_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["taxpayer_id"] == profile_data["taxpayer_id"]
        assert data["phone_number"] == profile_data["phone_number"]
        assert data["occupation"] == profile_data["occupation"]
    
    def test_create_profile_for_other_user(self, client: TestClient, test_user: User, test_admin_user: User, auth_headers: dict):
        """Test creating profile for other user (should fail)"""
        profile_data = {
            "taxpayer_id": "0123456789"
        }
        
        response = client.post(f"/api/v1/users/{test_admin_user.id}/profile", json=profile_data, headers=auth_headers)
        
        assert response.status_code == 403
    
    def test_get_user_profile(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test getting user profile"""
        # First create a profile
        profile_data = {
            "taxpayer_id": "0123456789",
            "phone_number": "0901234567"
        }
        client.post(f"/api/v1/users/{test_user.id}/profile", json=profile_data, headers=auth_headers)
        
        # Then get it
        response = client.get(f"/api/v1/users/{test_user.id}/profile", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["taxpayer_id"] == profile_data["taxpayer_id"]
    
    def test_update_user_profile(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test updating user profile"""
        # First create a profile
        profile_data = {
            "taxpayer_id": "0123456789"
        }
        client.post(f"/api/v1/users/{test_user.id}/profile", json=profile_data, headers=auth_headers)
        
        # Then update it
        update_data = {
            "phone_number": "0987654321",
            "occupation": "Updated Occupation"
        }
        
        response = client.put(f"/api/v1/users/{test_user.id}/profile", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["phone_number"] == update_data["phone_number"]
        assert data["occupation"] == update_data["occupation"]


class TestAddressEndpoints:
    """Test address endpoints"""
    
    def test_create_user_address(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test creating user address"""
        # First create a profile
        profile_data = {"taxpayer_id": "0123456789"}
        client.post(f"/api/v1/users/{test_user.id}/profile", json=profile_data, headers=auth_headers)
        
        # Then create address
        address_data = {
            "type": "primary",
            "street": "123 Đường ABC",
            "ward": "Phường 1",
            "district": "Quận 1",
            "city": "TP.HCM",
            "province": "TP.HCM",
            "postal_code": "70000",
            "is_default": True
        }
        
        response = client.post(f"/api/v1/users/{test_user.id}/addresses", json=address_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["street"] == address_data["street"]
        assert data["ward"] == address_data["ward"]
        assert data["district"] == address_data["district"]
        assert data["is_default"] == True
    
    def test_get_user_addresses(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test getting user addresses"""
        # First create a profile
        profile_data = {"taxpayer_id": "0123456789"}
        client.post(f"/api/v1/users/{test_user.id}/profile", json=profile_data, headers=auth_headers)
        
        # Create an address
        address_data = {
            "street": "123 Đường ABC",
            "ward": "Phường 1",
            "district": "Quận 1",
            "city": "TP.HCM",
            "province": "TP.HCM"
        }
        client.post(f"/api/v1/users/{test_user.id}/addresses", json=address_data, headers=auth_headers)
        
        # Get addresses
        response = client.get(f"/api/v1/users/{test_user.id}/addresses", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]["street"] == address_data["street"]
    
    def test_create_address_without_profile(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test creating address without profile (should fail)"""
        address_data = {
            "street": "123 Đường ABC",
            "ward": "Phường 1",
            "district": "Quận 1",
            "city": "TP.HCM",
            "province": "TP.HCM"
        }
        
        response = client.post(f"/api/v1/users/{test_user.id}/addresses", json=address_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "Vui lòng tạo hồ sơ người dùng trước" in response.json()["detail"]
