from typing import Any, Dict, List, Optional, Tuple
from app.common.exceptions import ConflictException, NotFoundException
from app.common.security import hash_password
from app.database import execute_query, fetch_all, fetch_one


def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    page_size: int = 10,
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Retrieves paginated users filtered by role, status, and search keywords using RAW SQL.
    """
    conditions = ["1=1"]
    params: List[Any] = []

    if role:
        conditions.append("role = %s")
        params.append(role)

    if is_active is not None:
        conditions.append("is_active = %s")
        params.append(is_active)

    if search:
        conditions.append("(first_name LIKE %s OR last_name LIKE %s OR email LIKE %s)")
        term = f"%{search.strip()}%"
        params.extend([term, term, term])

    where_clause = " AND ".join(conditions)

    # 1. Count total matching rows
    count_query = f"SELECT COUNT(*) AS total FROM users WHERE {where_clause};"
    count_res = fetch_one(count_query, tuple(params))
    total = count_res["total"] if count_res else 0

    # 2. Fetch paginated records using LIMIT and OFFSET
    offset = (page - 1) * page_size
    query = f"""
        SELECT id, first_name, last_name, email, role, phone, is_active, created_at, updated_at
        FROM users
        WHERE {where_clause}
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s;
    """
    data_params = list(params) + [page_size, offset]
    records = fetch_all(query, tuple(data_params))

    return records, total


def get_user_by_id(user_id: int) -> Dict[str, Any]:
    """
    Fetches a single user by primary key using RAW SQL.
    """
    query = """
        SELECT id, first_name, last_name, email, role, phone, is_active, created_at, updated_at
        FROM users
        WHERE id = %s;
    """
    user = fetch_one(query, (user_id,))
    if not user:
        raise NotFoundException(f"User with ID {user_id} not found.")
    return user


def create_user(
    first_name: str,
    last_name: str,
    email: str,
    plain_password: str,
    role: str,
    phone: Optional[str] = None
) -> int:
    """
    Creates a new user record with bcrypt password hashing using RAW SQL.
    """
    check_query = "SELECT id FROM users WHERE email = %s;"
    if fetch_one(check_query, (email.lower().strip(),)):
        raise ConflictException(f"User with email '{email}' already exists.")

    hashed_pw = hash_password(plain_password)
    insert_query = """
        INSERT INTO users (first_name, last_name, email, password_hash, phone, role, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, TRUE);
    """
    return execute_query(
        insert_query,
        (first_name.strip(), last_name.strip(), email.lower().strip(), hashed_pw, phone, role)
    )


def update_user(user_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Dynamically builds and executes a parameterized RAW SQL UPDATE statement.
    """
    # Verify user exists
    get_user_by_id(user_id)

    set_clauses = []
    params: List[Any] = []

    if "first_name" in update_data and update_data["first_name"] is not None:
        set_clauses.append("first_name = %s")
        params.append(update_data["first_name"].strip())

    if "last_name" in update_data and update_data["last_name"] is not None:
        set_clauses.append("last_name = %s")
        params.append(update_data["last_name"].strip())

    if "phone" in update_data:
        set_clauses.append("phone = %s")
        params.append(update_data["phone"].strip() if update_data["phone"] else None)

    if "password" in update_data and update_data["password"]:
        set_clauses.append("password_hash = %s")
        params.append(hash_password(update_data["password"]))

    if "role" in update_data and update_data["role"]:
        set_clauses.append("role = %s")
        params.append(update_data["role"])

    if set_clauses:
        params.append(user_id)
        update_query = f"UPDATE users SET {', '.join(set_clauses)} WHERE id = %s;"
        execute_query(update_query, tuple(params))

    return get_user_by_id(user_id)


def set_user_status(user_id: int, is_active: bool) -> Dict[str, Any]:
    """
    Toggles user active state (activation/deactivation) using RAW SQL.
    """
    get_user_by_id(user_id)
    query = "UPDATE users SET is_active = %s WHERE id = %s;"
    execute_query(query, (is_active, user_id))
    return get_user_by_id(user_id)


def delete_user(user_id: int) -> bool:
    """
    Deletes user by primary key using RAW SQL.
    """
    get_user_by_id(user_id)
    query = "DELETE FROM users WHERE id = %s;"
    execute_query(query, (user_id,))
    return True
