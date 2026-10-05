from typing import Any, Dict, List
from app.common.exceptions import ConflictException, NotFoundException
from app.database import execute_query, fetch_all, fetch_one


def list_categories() -> List[Dict[str, Any]]:
    """
    Retrieves all categories with count of assigned courses using RAW SQL LEFT JOIN.
    """
    query = """
        SELECT 
            c.id, 
            c.name, 
            c.description, 
            c.created_at,
            COUNT(crs.id) AS total_courses
        FROM categories c
        LEFT JOIN courses crs ON c.id = crs.category_id
        GROUP BY c.id, c.name, c.description, c.created_at
        ORDER BY c.name ASC;
    """
    return fetch_all(query)


def get_category_by_id(category_id: int) -> Dict[str, Any]:
    """
    Fetches a single category with course count using RAW SQL.
    """
    query = """
        SELECT 
            c.id, 
            c.name, 
            c.description, 
            c.created_at,
            COUNT(crs.id) AS total_courses
        FROM categories c
        LEFT JOIN courses crs ON c.id = crs.category_id
        WHERE c.id = %s
        GROUP BY c.id, c.name, c.description, c.created_at;
    """
    cat = fetch_one(query, (category_id,))
    if not cat:
        raise NotFoundException(f"Category with ID {category_id} not found.")
    return cat


def create_category(name: str, description: str = None) -> int:
    """
    Creates a new category using RAW SQL after duplicate validation.
    """
    check_query = "SELECT id FROM categories WHERE name = %s;"
    if fetch_one(check_query, (name.strip(),)):
        raise ConflictException(f"A category named '{name}' already exists.")

    insert_query = "INSERT INTO categories (name, description) VALUES (%s, %s);"
    return execute_query(insert_query, (name.strip(), description.strip() if description else None))


def update_category(category_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Updates category attributes using RAW SQL.
    """
    get_category_by_id(category_id)

    set_clauses = []
    params = []

    if "name" in update_data and update_data["name"]:
        check_query = "SELECT id FROM categories WHERE name = %s AND id != %s;"
        if fetch_one(check_query, (update_data["name"].strip(), category_id)):
            raise ConflictException(f"Another category named '{update_data['name']}' already exists.")
        set_clauses.append("name = %s")
        params.append(update_data["name"].strip())

    if "description" in update_data:
        set_clauses.append("description = %s")
        params.append(update_data["description"].strip() if update_data["description"] else None)

    if set_clauses:
        params.append(category_id)
        update_query = f"UPDATE categories SET {', '.join(set_clauses)} WHERE id = %s;"
        execute_query(update_query, tuple(params))

    return get_category_by_id(category_id)


def delete_category(category_id: int) -> bool:
    """
    Deletes category using RAW SQL. Enforces constraint check against active courses.
    """
    get_category_by_id(category_id)

    # Check for linked courses to enforce RESTRICT integrity
    course_check = "SELECT COUNT(*) AS count FROM courses WHERE category_id = %s;"
    linked = fetch_one(course_check, (category_id,))
    if linked and linked["count"] > 0:
        raise ConflictException(
            f"Cannot delete category. There are {linked['count']} courses currently assigned to it."
        )

    delete_query = "DELETE FROM categories WHERE id = %s;"
    execute_query(delete_query, (category_id,))
    return True
