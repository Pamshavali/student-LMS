from typing import Any, Dict, List, Optional
from app.common.exceptions import NotFoundException
from app.courses.service import get_course_by_id
from app.database import execute_query, fetch_all, fetch_one


def list_content_by_course(course_id: int) -> List[Dict[str, Any]]:
    """
    Fetches all content modules for a course ordered by order_index using RAW SQL.
    Uses idx_content_course_order.
    """
    get_course_by_id(course_id)
    query = """
        SELECT id, course_id, title, description, content_type, content_url, order_index, created_at
        FROM course_content
        WHERE course_id = %s
        ORDER BY order_index ASC, id ASC;
    """
    return fetch_all(query, (course_id,))


def get_content_by_id(content_id: int) -> Dict[str, Any]:
    """
    Fetches content module by ID using RAW SQL.
    """
    query = """
        SELECT cc.id, cc.course_id, cc.title, cc.description, cc.content_type, cc.content_url, cc.order_index, cc.created_at,
               c.teacher_id, c.title AS course_title
        FROM course_content cc
        INNER JOIN courses c ON cc.course_id = c.id
        WHERE cc.id = %s;
    """
    res = fetch_one(query, (content_id,))
    if not res:
        raise NotFoundException(f"Content module with ID {content_id} not found.")
    return res


def create_content(
    course_id: int,
    title: str,
    description: Optional[str],
    content_type: str,
    content_url: Optional[str],
    order_index: int = 1,
) -> int:
    """
    Inserts a new content module for a course using RAW SQL.
    """
    get_course_by_id(course_id)
    query = """
        INSERT INTO course_content (course_id, title, description, content_type, content_url, order_index)
        VALUES (%s, %s, %s, %s, %s, %s);
    """
    return execute_query(
        query,
        (course_id, title.strip(), description.strip() if description else None, content_type, content_url, order_index)
    )


def update_content(content_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Updates content attributes using RAW SQL.
    """
    get_content_by_id(content_id)
    set_clauses = []
    params = []

    if "title" in update_data and update_data["title"] is not None:
        set_clauses.append("title = %s")
        params.append(update_data["title"].strip())

    if "description" in update_data:
        set_clauses.append("description = %s")
        params.append(update_data["description"].strip() if update_data["description"] else None)

    if "content_type" in update_data and update_data["content_type"]:
        set_clauses.append("content_type = %s")
        params.append(update_data["content_type"])

    if "content_url" in update_data:
        set_clauses.append("content_url = %s")
        params.append(update_data["content_url"])

    if "order_index" in update_data and update_data["order_index"] is not None:
        set_clauses.append("order_index = %s")
        params.append(update_data["order_index"])

    if set_clauses:
        params.append(content_id)
        query = f"UPDATE course_content SET {', '.join(set_clauses)} WHERE id = %s;"
        execute_query(query, tuple(params))

    return get_content_by_id(content_id)


def delete_content(content_id: int) -> bool:
    """
    Deletes content module by ID using RAW SQL.
    """
    get_content_by_id(content_id)
    query = "DELETE FROM course_content WHERE id = %s;"
    execute_query(query, (content_id,))
    return True
