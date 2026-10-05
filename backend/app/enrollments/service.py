from typing import Any, Dict, List
from app.common.exceptions import BadRequestException, ConflictException, NotFoundException
from app.database import execute_query, fetch_all, fetch_one, get_db_connection


def enroll_student(student_id: int, course_id: int) -> int:
    """
    Enrolls a student in a course using an explicit ACID transaction.
    Guarantees atomic execution:
    1. Validates student existence and active state.
    2. Validates course existence and PUBLISHED status.
    3. Validates absence of prior enrollment (prevents duplicates).
    4. Inserts new enrollment with ACTIVE status and 0.00 progress.
    5. Issues explicit COMMIT on success, or ROLLBACK on any failure.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            # 1. Verify student exists and is active
            cursor.execute(
                "SELECT id, first_name, last_name, is_active, role FROM users WHERE id = %s;",
                (student_id,)
            )
            student = cursor.fetchone()
            if not student:
                raise NotFoundException(f"Student with ID {student_id} not found.")
            if not student.get("is_active"):
                raise BadRequestException("Cannot enroll inactive student account.")

            # 2. Verify course exists and is PUBLISHED
            cursor.execute(
                "SELECT id, title, status FROM courses WHERE id = %s;",
                (course_id,)
            )
            course = cursor.fetchone()
            if not course:
                raise NotFoundException(f"Course with ID {course_id} not found.")
            if course.get("status") != "PUBLISHED":
                raise BadRequestException("Enrollment is only allowed for PUBLISHED courses.")

            # 3. Check for existing enrollment (duplicate prevention)
            cursor.execute(
                "SELECT id FROM enrollments WHERE student_id = %s AND course_id = %s;",
                (student_id, course_id)
            )
            if cursor.fetchone():
                raise ConflictException("Student is already enrolled in this course.")

            # 4. Insert enrollment
            cursor.execute(
                """
                INSERT INTO enrollments (student_id, course_id, status, progress)
                VALUES (%s, %s, 'ACTIVE', 0.00);
                """,
                (student_id, course_id)
            )
            enrollment_id = cursor.lastrowid

            # 5. Atomic transaction commit
            conn.commit()
            return enrollment_id

        except Exception as exc:
            # Atomic transaction rollback on any failure
            conn.rollback()
            raise exc
        finally:
            cursor.close()


def get_enrollment_by_id(enrollment_id: int) -> Dict[str, Any]:
    """
    Fetches enrollment record by ID with joined course and user metadata.
    """
    query = """
        SELECT 
            e.id,
            e.student_id,
            e.course_id,
            e.enrollment_date,
            e.status,
            e.progress,
            c.title AS course_title,
            c.description AS course_description,
            CONCAT(tu.first_name, ' ', tu.last_name) AS teacher_name,
            CONCAT(su.first_name, ' ', su.last_name) AS student_name,
            su.email AS student_email
        FROM enrollments e
        INNER JOIN courses c ON e.course_id = c.id
        INNER JOIN users tu ON c.teacher_id = tu.id
        INNER JOIN users su ON e.student_id = su.id
        WHERE e.id = %s;
    """
    rec = fetch_one(query, (enrollment_id,))
    if not rec:
        raise NotFoundException(f"Enrollment record with ID {enrollment_id} not found.")
    return rec


def get_student_enrollments(student_id: int) -> List[Dict[str, Any]]:
    """
    Fetches all courses in which a specific student is enrolled using RAW SQL JOIN.
    """
    query = """
        SELECT 
            e.id,
            e.student_id,
            e.course_id,
            e.enrollment_date,
            e.status,
            e.progress,
            c.title AS course_title,
            c.description AS course_description,
            c.level AS course_level,
            c.duration_hours,
            cat.name AS category_name,
            CONCAT(tu.first_name, ' ', tu.last_name) AS teacher_name,
            tu.email AS teacher_email,
            (SELECT COUNT(*) FROM course_content cc WHERE cc.course_id = c.id) AS total_modules,
            (SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.id) AS total_assignments
        FROM enrollments e
        INNER JOIN courses c ON e.course_id = c.id
        INNER JOIN categories cat ON c.category_id = cat.id
        INNER JOIN users tu ON c.teacher_id = tu.id
        WHERE e.student_id = %s
        ORDER BY e.enrollment_date DESC;
    """
    return fetch_all(query, (student_id,))


def get_course_enrollments(course_id: int) -> List[Dict[str, Any]]:
    """
    Fetches all enrolled students for a given course using RAW SQL.
    """
    query = """
        SELECT 
            e.id,
            e.student_id,
            e.course_id,
            e.enrollment_date,
            e.status,
            e.progress,
            CONCAT(su.first_name, ' ', su.last_name) AS student_name,
            su.email AS student_email,
            su.phone AS student_phone
        FROM enrollments e
        INNER JOIN users su ON e.student_id = su.id
        WHERE e.course_id = %s
        ORDER BY e.enrollment_date DESC;
    """
    return fetch_all(query, (course_id,))


def update_enrollment_progress(enrollment_id: int, progress: float, status: str = None) -> Dict[str, Any]:
    """
    Updates student progress (bounded 0.00 to 100.00) and marks COMPLETED if 100%.
    """
    get_enrollment_by_id(enrollment_id)
    clamped_progress = min(100.0, max(0.0, float(progress)))

    new_status = status
    if not new_status:
        new_status = "COMPLETED" if clamped_progress >= 100.0 else "ACTIVE"

    query = "UPDATE enrollments SET progress = %s, status = %s WHERE id = %s;"
    execute_query(query, (clamped_progress, new_status, enrollment_id))
    return get_enrollment_by_id(enrollment_id)


def delete_enrollment(enrollment_id: int) -> bool:
    """
    Removes enrollment record using RAW SQL.
    """
    get_enrollment_by_id(enrollment_id)
    query = "DELETE FROM enrollments WHERE id = %s;"
    execute_query(query, (enrollment_id,))
    return True
