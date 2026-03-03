import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_toggle_task_completion(async_client: AsyncClient):
    # Setup test user context
    await async_client.post(
        "/api/v1/users/",
        json={"email": "task_test@lifeos.com", "password": "secure123", "full_name": "Task User"}
    )
    
    login_response = await async_client.post(
        "/api/v1/login/access-token",
        data={"username": "task_test@lifeos.com", "password": "secure123"}
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create task
    create_resp = await async_client.post(
        "/api/v1/tasks/",
        json={"task_name": "Toggle Me", "status": "pending", "priority": "medium"},
        headers=headers
    )
    assert create_resp.status_code == 200
    task_id = create_resp.json()["id"]

    # Toggle to complete
    put_resp = await async_client.put(
        f"/api/v1/tasks/{task_id}",
        json={"status": "completed"},
        headers=headers
    )
    assert put_resp.status_code == 200
    updated_task = put_resp.json()
    assert updated_task["status"] == "completed"
    assert updated_task["completed_at"] is not None

    # Toggle back to pending
    put_resp2 = await async_client.put(
        f"/api/v1/tasks/{task_id}",
        json={"status": "pending"},
        headers=headers
    )
    assert put_resp2.status_code == 200
    updated_task2 = put_resp2.json()
    assert updated_task2["status"] == "pending"
    assert updated_task2["completed_at"] is None
