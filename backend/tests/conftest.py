import os
import sys
from typing import Dict, Generator
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.auth.jwt_handler import create_access_token
from app.database import execute_query, fetch_one, init_connection_pool
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def setup_database_pool():
    """Ensures database connection pool is initialized once per test session."""
    init_connection_pool()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Provides a TestClient connected to the FastAPI app."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def admin_headers() -> Dict[str, str]:
    """Generates valid JWT bearer headers for Eleanor Vance (ADMIN, id=1)."""
    token = create_access_token({"user_id": 1, "email": "admin@lms.com", "role": "ADMIN"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def teacher_headers() -> Dict[str, str]:
    """Generates valid JWT bearer headers for Alan Turing (TEACHER, id=2)."""
    token = create_access_token({"user_id": 2, "email": "teacher@lms.com", "role": "TEACHER"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_teacher_headers() -> Dict[str, str]:
    """Generates valid JWT bearer headers for Ada Lovelace (TEACHER, id=3)."""
    token = create_access_token({"user_id": 3, "email": "ada.teacher@lms.com", "role": "TEACHER"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def student_headers() -> Dict[str, str]:
    """Generates valid JWT bearer headers for Alex Johnson (STUDENT, id=4)."""
    token = create_access_token({"user_id": 4, "email": "student@lms.com", "role": "STUDENT"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_student_headers() -> Dict[str, str]:
    """Generates valid JWT bearer headers for Marcus Miller (STUDENT, id=6)."""
    token = create_access_token({"user_id": 6, "email": "marcus.student@lms.com", "role": "STUDENT"})
    return {"Authorization": f"Bearer {token}"}
