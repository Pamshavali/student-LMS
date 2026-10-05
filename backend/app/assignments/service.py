from datetime import datetime
from typing import Any, Dict, List, Optional
from app.common.exceptions import NotFoundException
from app.courses.service import get_course_by_id
from app.database import execute_query, fetch_all, fetch_one


def list_assignments_by_course(course_id: int, student_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Fetches all assignments for a course using RAW SQL.
    If student_id is provided, joins the student's submission record.
    Uses idx_assignments_course.
    """
    get_course_by_id(course_id)

    if student_id:
        query = """
            SELECT 
                a.id, 
                a.course_id, 
                c.title AS course_title,
                a.title, 
                a.description, 
                a.due_date, 
                a.max_marks, 
                a.created_at, 
                a.updated_at,
                s.id AS submission_id,
                s.submitted_at,
                s.marks,
                s.feedback,
                s.status AS submission_status,
                s.submission_text,
                s.submission_url
            FROM assignments a
            INNER JOIN courses c ON a.course_id = c.id
            LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = %s
            WHERE a.course_id = %s
            ORDER BY a.due_date ASC;
        """
        rows = fetch_all(query, (student_id, course_id))
        result = []
        for r in rows:
            sub = None
            if r.get("submission_id"):
                sub = {
                    "id": r["submission_id"],
                    "submitted_at": r["submitted_at"],
                    "marks": r["marks"],
                    "feedback": r["feedback"],
                    "status": r["submission_status"],
                    "submission_text": r["submission_text"],
                    "submission_url": r["submission_url"],
                }
            item = {
                "id": r["id"],
                "course_id": r["course_id"],
                "course_title": r["course_title"],
                "title": r["title"],
                "description": r["description"],
                "due_date": r["due_date"],
                "max_marks": r["max_marks"],
                "created_at": r["created_at"],
                "updated_at": r["updated_at"],
                "student_submission": sub,
            }
            result.append(item)
        return result
    else:
        query = """
            SELECT 
                a.id, 
                a.course_id, 
                c.title AS course_title,
                a.title, 
                a.description, 
                a.due_date, 
                a.max_marks, 
                a.created_at, 
                a.updated_at,
                (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) AS total_submissions,
                (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id AND s.status = 'GRADED') AS graded_submissions
            FROM assignments a
            INNER JOIN courses c ON a.course_id = c.id
            WHERE a.course_id = %s
            ORDER BY a.due_date ASC;
        """
        return fetch_all(query, (course_id,))


def get_assignment_by_id(assignment_id: int, student_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Fetches a single assignment by primary key using RAW SQL.
    """
    query = """
        SELECT 
            a.id, 
            a.course_id, 
            c.title AS course_title,
            c.teacher_id,
            a.title, 
            a.description, 
            a.due_date, 
            a.max_marks, 
            a.created_at, 
            a.updated_at,
            (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) AS total_submissions,
            (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id AND s.status = 'GRADED') AS graded_submissions
        FROM assignments a
        INNER JOIN courses c ON a.course_id = c.id
        WHERE a.id = %s;
    """
    rec = fetch_one(query, (assignment_id,))
    if not rec:
        raise NotFoundException(f"Assignment with ID {assignment_id} not found.")

    if student_id:
        sub_query = """
            SELECT id, submitted_at, marks, feedback, status, submission_text, submission_url
            FROM submissions
            WHERE assignment_id = %s AND student_id = %s;
        """
        rec["student_submission"] = fetch_one(sub_query, (assignment_id, student_id))
    else:
        rec["student_submission"] = None

    return rec


def create_assignment(
    course_id: int,
    title: str,
    description: str,
    due_date: datetime,
    max_marks: float,
) -> int:
    """
    Inserts a new assignment into the database using RAW SQL.
    """
    get_course_by_id(course_id)
    query = """
        INSERT INTO assignments (course_id, title, description, due_date, max_marks)
        VALUES (%s, %s, %s, %s, %s);
    """
    return execute_query(
        query,
        (course_id, title.strip(), description.strip(), due_date, max_marks)
    )


def update_assignment(assignment_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Updates assignment attributes using RAW SQL.
    """
    get_assignment_by_id(assignment_id)
    set_clauses = []
    params = []

    if "title" in update_data and update_data["title"] is not None:
        set_clauses.append("title = %s")
        params.append(update_data["title"].strip())

    if "description" in update_data and update_data["description"] is not None:
        set_clauses.append("description = %s")
        params.append(update_data["description"].strip())

    if "due_date" in update_data and update_data["due_date"] is not None:
        set_clauses.append("due_date = %s")
        params.append(update_data["due_date"])

    if "max_marks" in update_data and update_data["max_marks"] is not None:
        set_clauses.append("max_marks = %s")
        params.append(update_data["max_marks"])

    if set_clauses:
        params.append(assignment_id)
        query = f"UPDATE assignments SET {', '.join(set_clauses)} WHERE id = %s;"
        execute_query(query, tuple(params))

    return get_assignment_by_id(assignment_id)


def delete_assignment(assignment_id: int) -> bool:
    """
    Deletes assignment and cascades related submissions using RAW SQL.
    """
    get_assignment_by_id(assignment_id)
    query = "DELETE FROM assignments WHERE id = %s;"
    execute_query(query, (assignment_id,))
    return True
