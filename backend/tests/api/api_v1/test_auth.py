import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_user(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/users/",
        json={"email": "testuser_auth@lifeos.com", "password": "secure123", "full_name": "Test User"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser_auth@lifeos.com"
    assert "id" in data

@pytest.mark.asyncio
async def test_login_and_refresh_cookies(async_client: AsyncClient):
    # Setup user
    await async_client.post(
        "/api/v1/users/",
        json={"email": "cookie_test@lifeos.com", "password": "secure123", "full_name": "Test User Cookie"}
    )
    
    # Login to hit access-token route
    response = await async_client.post(
        "/api/v1/login/access-token",
        data={"username": "cookie_test@lifeos.com", "password": "secure123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    
    # Assert HttpOnly refresh cookie is set on response headers
    cookies = response.cookies
    assert "refresh_token" in cookies
    
    # Hit the refresh endpoint using the newly set cookie context
    refresh_response = await async_client.post("/api/v1/login/refresh")
    assert refresh_response.status_code == 200
    refresh_data = refresh_response.json()
    assert "access_token" in refresh_data
    assert refresh_data["access_token"] != data["access_token"]
    
    # Log out
    logout_response = await async_client.post("/api/v1/login/logout")
    assert logout_response.status_code == 200
    # Cookie should be unset/expired
    
    # Invalid refresh check
    fail_refresh = await async_client.post("/api/v1/login/refresh")
    assert fail_refresh.status_code == 401
