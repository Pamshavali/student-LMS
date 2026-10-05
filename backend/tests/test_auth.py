import uuid
import pytest
from fastapi.testclient import TestClient


def test_register_user_success(client: TestClient):
    unique_email = f"test.user.{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "first_name": "Test",
        "last_name": "Applicant",
        "email": unique_email,
        "password": "SecurePassword123!",
        "role": "STUDENT",
        "phone": "+1-555-9999",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == unique_email
    assert data["data"]["user"]["role"] == "STUDENT"


def test_register_duplicate_email(client: TestClient):
    # admin@lms.com already exists in seed data
    payload = {
        "first_name": "Duplicate",
        "last_name": "Admin",
        "email": "admin@lms.com",
        "password": "Password123!",
        "role": "STUDENT",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 409
    data = response.json()
    assert data["success"] is False
    assert "already exists" in data["message"].lower()


def test_login_success(client: TestClient):
    # Using seed student account
    payload = {
        "email": "student@lms.com",
        "password": "Password123!",
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == "student@lms.com"
    assert data["data"]["user"]["role"] == "STUDENT"


def test_login_invalid_password(client: TestClient):
    payload = {
        "email": "student@lms.com",
        "password": "CompletelyWrongPassword!",
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert "invalid email or password" in data["message"].lower()


def test_login_nonexistent_email(client: TestClient):
    payload = {
        "email": "nonexistent.user.random@lms.com",
        "password": "Password123!",
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False


def test_auth_me_endpoint_valid_token(client: TestClient, student_headers: dict):
    response = client.get("/api/auth/me", headers=student_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "student@lms.com"
    assert data["data"]["role"] == "STUDENT"


def test_auth_me_endpoint_missing_token(client: TestClient):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False


def test_auth_me_endpoint_invalid_token(client: TestClient):
    bad_headers = {"Authorization": "Bearer totally_bogus_token_gibberish"}
    response = client.get("/api/auth/me", headers=bad_headers)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
