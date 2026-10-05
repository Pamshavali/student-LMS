from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.assignments.service import get_assignment_by_id
from app.common.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.database import execute_query, fetch_all, fetch_one


def submit_assignment(
    assignment_id: int,
    student_id: int,
    submission_text: Optional[str] = None,
    submission_url: Optional[str] = None,
) -> int:
    """
    Submits student work for an assignment using RAW SQL.
    - Validates active enrollment in the course.
    - Dynamically evaluates deadline to assign SUBMITTED or LATE status.
    - Manages existing submission update or new row insertion.
    """
    if not submission_text and not submission_url:
        raise BadRequestException("Please provide submission text or a project repository URL.")

    # 1. Fetch assignment details
    assignment = get_assignment_by_id(assignment_id)
    course_id = assignment["course_id"]

    # 2. Check active enrollment in course
    enrollment_query = """
        SELECT id FROM enrollments 
        WHERE student_id = %s AND course_id = %s AND status = 'ACTIVE';
    """
    enrollment = fetch_one(enrollment_query, (student_id, course_id))
    if not enrollment:
        raise ForbiddenException("You must be actively enrolled in the course to submit assignments.")

    # 3. Check deadline: compare against due_date
    now = datetime.now()
    due_date = assignment["due_date"]
    if isinstance(due_date, str):
        due_date = datetime.fromisoformat(due_date)

    # Normalize tzinfo if needed
    if due_date.tzinfo:
        now = datetime.now(timezone.utc)

    submission_status = "LATE" if now > due_date else "SUBMITTED"

    # 4. Check for existing submission (Enforces UNIQUE assignment_id, student_id constraint)
    existing_query = "SELECT id, status FROM submissions WHERE assignment_id = %s AND student_id = %s;"
    existing = fetch_one(existing_query, (assignment_id, student_id))

    if existing:
        if existing["status"] == "GRADED":
            raise BadRequestException("Cannot resubmit coursework that has already been graded.")

        update_query = """
            UPDATE submissions
            SET submission_text = %s, submission_url = %s, submitted_at = CURRENT_TIMESTAMP, status = %s
            WHERE id = %s;
        """
        execute_query(update_query, (submission_text, submission_url, submission_status, existing["id"]))
        return existing["id"]
    else:
        insert_query = """
            INSERT INTO submissions (assignment_id, student_id, submission_text, submission_url, status)
            VALUES (%s, %s, %s, %s, %s);
        """
        return execute_query(
            insert_query,
            (assignment_id, student_id, submission_text, submission_url, submission_status)
        )


def grade_submission(submission_id: int, marks: float, feedback: Optional[str] = None) -> Dict[str, Any]:
    """
    Grades a student submission using RAW SQL.
    Validates that awarded marks do not exceed maximum marks.
    """
    submission = get_submission_by_id(submission_id)
    max_marks = float(submission["max_marks"])

    if float(marks) > max_marks:
        raise BadRequestException(f"Awarded marks ({marks}) cannot exceed maximum allowed marks ({max_marks}).")

    if float(marks) < 0:
        raise BadRequestException("Awarded marks cannot be negative.")

    query = """
        UPDATE submissions
        SET marks = %s, feedback = %s, status = 'GRADED'
        WHERE id = %s;
    """
    execute_query(query, (marks, feedback.strip() if feedback else None, submission_id))
    return get_submission_by_id(submission_id)


def get_submission_by_id(submission_id: int) -> Dict[str, Any]:
    """
    Fetches submission record with student, assignment, and course metadata using RAW SQL.
    """
    query = """
        SELECT 
            s.id,
            s.assignment_id,
            s.student_id,
            s.submission_text,
            s.submission_url,
            s.submitted_at,
            s.marks,
            s.feedback,
            s.status,
            a.title AS assignment_title,
            a.max_marks,
            a.due_date,
            c.id AS course_id,
            c.title AS course_title,
            c.teacher_id,
            CONCAT(u.first_name, ' ', u.last_name) AS student_name,
            u.email AS student_email
        FROM submissions s
        INNER JOIN assignments a ON s.assignment_id = a.id
        INNER JOIN courses c ON a.course_id = c.id
        INNER JOIN users u ON s.student_id = u.id
        WHERE s.id = %s;
    """
    sub = fetch_one(query, (submission_id,))
    if not sub:
        raise NotFoundException(f"Submission with ID {submission_id} not found.")
    return sub


def list_submissions_for_assignment(assignment_id: int) -> List[Dict[str, Any]]:
    """
    Fetches all submissions for an assignment using RAW SQL.
    Uses idx_submissions_assignment.
    """
    get_assignment_by_id(assignment_id)
    query = """
        SELECT 
            s.id,
            s.assignment_id,
            s.student_id,
            s.submission_text,
            s.submission_url,
            s.submitted_at,
            s.marks,
            s.feedback,
            s.status,
            a.title AS assignment_title,
            a.max_marks,
            a.due_date,
            CONCAT(u.first_name, ' ', u.last_name) AS student_name,
            u.email AS student_email
        FROM submissions s
        INNER JOIN assignments a ON s.assignment_id = a.id
        INNER JOIN users u ON s.student_id = u.id
        WHERE s.assignment_id = %s
        ORDER BY s.submitted_at DESC;
    """
    return fetch_all(query, (assignment_id,))


def get_student_submissions(student_id: int) -> List[Dict[str, Any]]:
    """
    Fetches all assignment submissions made by a student using RAW SQL.
    Uses idx_submissions_student.
    """
    query = """
        SELECT 
            s.id,
            s.assignment_id,
            s.student_id,
            s.submission_text,
            s.submission_url,
            s.submitted_at,
            s.marks,
            s.feedback,
            s.status,
            a.title AS assignment_title,
            a.max_marks,
            a.due_date,
            c.id AS course_id,
            c.title AS course_title
        FROM submissions s
        INNER JOIN assignments a ON s.assignment_id = a.id
        INNER JOIN courses c ON a.course_id = c.id
        WHERE s.student_id = %s
        ORDER BY s.submitted_at DESC;
    """
    return fetch_all(query, (student_id,))
