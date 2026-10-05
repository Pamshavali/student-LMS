from typing import Any, Dict, List, Optional, Tuple
from app.common.exceptions import BadRequestException, NotFoundException
from app.database import execute_query, fetch_all, fetch_one


def list_courses(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    level: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "newest",
    page: int = 1,
    page_size: int = 10,
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Retrieves paginated courses using RAW SQL with database-level search, filtering, and joins.
    """
    conditions = ["1=1"]
    params: List[Any] = []

    if search:
        conditions.append("(c.title LIKE %s OR c.description LIKE %s)")
        term = f"%{search.strip()}%"
        params.extend([term, term])

    if category_id:
        conditions.append("c.category_id = %s")
        params.append(category_id)

    if teacher_id:
        conditions.append("c.teacher_id = %s")
        params.append(teacher_id)

    if level:
        conditions.append("c.level = %s")
        params.append(level)

    if status:
        conditions.append("c.status = %s")
        params.append(status)

    where_clause = " AND ".join(conditions)

    # 1. Total matching count
    count_query = f"""
        SELECT COUNT(*) AS total
        FROM courses c
        INNER JOIN categories cat ON c.category_id = cat.id
        INNER JOIN users u ON c.teacher_id = u.id
        WHERE {where_clause};
    """
    count_res = fetch_one(count_query, tuple(params))
    total = count_res["total"] if count_res else 0

    # 2. Sorting options
    sort_expressions = {
        "newest": "c.created_at DESC",
        "oldest": "c.created_at ASC",
        "title": "c.title ASC",
        "duration": "c.duration_hours DESC",
    }
    order_expr = sort_expressions.get(sort_by, "c.created_at DESC")

    # 3. Paginated query with correlated counts
    offset = (page - 1) * page_size
    query = f"""
        SELECT 
            c.id, 
            c.title, 
            c.description, 
            c.category_id, 
            c.teacher_id, 
            c.duration_hours, 
            c.level, 
            c.status, 
            c.created_at, 
            c.updated_at,
            cat.name AS category_name,
            CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
            u.email AS teacher_email,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS total_enrolled,
            (SELECT COUNT(*) FROM course_content cc WHERE cc.course_id = c.id) AS total_modules,
            (SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.id) AS total_assignments
        FROM courses c
        INNER JOIN categories cat ON c.category_id = cat.id
        INNER JOIN users u ON c.teacher_id = u.id
        WHERE {where_clause}
        ORDER BY {order_expr}
        LIMIT %s OFFSET %s;
    """
    data_params = list(params) + [page_size, offset]
    courses = fetch_all(query, tuple(data_params))

    return courses, total


def get_course_by_id(course_id: int) -> Dict[str, Any]:
    """
    Fetches full course details with category and teacher joins using RAW SQL.
    """
    query = """
        SELECT 
            c.id, 
            c.title, 
            c.description, 
            c.category_id, 
            c.teacher_id, 
            c.duration_hours, 
            c.level, 
            c.status, 
            c.created_at, 
            c.updated_at,
            cat.name AS category_name,
            CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
            u.email AS teacher_email,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS total_enrolled,
            (SELECT COUNT(*) FROM course_content cc WHERE cc.course_id = c.id) AS total_modules,
            (SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.id) AS total_assignments
        FROM courses c
        INNER JOIN categories cat ON c.category_id = cat.id
        INNER JOIN users u ON c.teacher_id = u.id
        WHERE c.id = %s;
    """
    course = fetch_one(query, (course_id,))
    if not course:
        raise NotFoundException(f"Course with ID {course_id} not found.")
    return course


def create_course(
    title: str,
    description: str,
    category_id: int,
    teacher_id: int,
    duration_hours: Optional[int] = None,
    level: str = "BEGINNER",
    status: str = "DRAFT",
) -> int:
    """
    Validates category and teacher existence and inserts course record using RAW SQL.
    """
    # Verify category exists
    cat_query = "SELECT id FROM categories WHERE id = %s;"
    if not fetch_one(cat_query, (category_id,)):
        raise NotFoundException(f"Category ID {category_id} does not exist.")

    # Verify teacher exists and has TEACHER or ADMIN role
    teacher_query = "SELECT id, role FROM users WHERE id = %s AND is_active = TRUE;"
    teacher = fetch_one(teacher_query, (teacher_id,))
    if not teacher:
        raise NotFoundException(f"User ID {teacher_id} does not exist or is inactive.")
    if teacher["role"] not in ["TEACHER", "ADMIN"]:
        raise BadRequestException(f"User ID {teacher_id} does not have teacher privileges.")

    insert_query = """
        INSERT INTO courses (title, description, category_id, teacher_id, duration_hours, level, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s);
    """
    return execute_query(
        insert_query,
        (title.strip(), description.strip(), category_id, teacher_id, duration_hours, level, status)
    )


def update_course(course_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Updates course attributes dynamically using parameterized RAW SQL.
    """
    get_course_by_id(course_id)

    set_clauses = []
    params: List[Any] = []

    if "title" in update_data and update_data["title"] is not None:
        set_clauses.append("title = %s")
        params.append(update_data["title"].strip())

    if "description" in update_data and update_data["description"] is not None:
        set_clauses.append("description = %s")
        params.append(update_data["description"].strip())

    if "category_id" in update_data and update_data["category_id"] is not None:
        cat_check = "SELECT id FROM categories WHERE id = %s;"
        if not fetch_one(cat_check, (update_data["category_id"],)):
            raise NotFoundException(f"Category ID {update_data['category_id']} does not exist.")
        set_clauses.append("category_id = %s")
        params.append(update_data["category_id"])

    if "teacher_id" in update_data and update_data["teacher_id"] is not None:
        teacher_check = "SELECT id, role FROM users WHERE id = %s AND is_active = TRUE;"
        teacher = fetch_one(teacher_check, (update_data["teacher_id"],))
        if not teacher or teacher["role"] not in ["TEACHER", "ADMIN"]:
            raise BadRequestException("Target teacher is invalid or inactive.")
        set_clauses.append("teacher_id = %s")
        params.append(update_data["teacher_id"])

    if "duration_hours" in update_data:
        set_clauses.append("duration_hours = %s")
        params.append(update_data["duration_hours"])

    if "level" in update_data and update_data["level"]:
        set_clauses.append("level = %s")
        params.append(update_data["level"])

    if "status" in update_data and update_data["status"]:
        set_clauses.append("status = %s")
        params.append(update_data["status"])

    if set_clauses:
        params.append(course_id)
        update_query = f"UPDATE courses SET {', '.join(set_clauses)} WHERE id = %s;"
        execute_query(update_query, tuple(params))

    return get_course_by_id(course_id)


def set_course_status(course_id: int, status: str) -> Dict[str, Any]:
    """
    Updates the publish status of a course using RAW SQL.
    """
    get_course_by_id(course_id)
    query = "UPDATE courses SET status = %s WHERE id = %s;"
    execute_query(query, (status, course_id))
    return get_course_by_id(course_id)


def delete_course(course_id: int) -> bool:
    """
    Deletes course and cascades associated child records (content, assignments, enrollments).
    """
    get_course_by_id(course_id)
    query = "DELETE FROM courses WHERE id = %s;"
    execute_query(query, (course_id,))
    return True
