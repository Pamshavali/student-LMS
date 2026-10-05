from typing import Any, Dict
from app.database import fetch_all, fetch_one


def get_admin_dashboard_stats() -> Dict[str, Any]:
    """
    Computes system-wide administrative statistics using RAW SQL aggregations.
    """
    counts_query = """
        SELECT
            (SELECT COUNT(*) FROM users WHERE role = 'STUDENT') AS total_students,
            (SELECT COUNT(*) FROM users WHERE role = 'TEACHER') AS total_teachers,
            (SELECT COUNT(*) FROM courses) AS total_courses,
            (SELECT COUNT(*) FROM courses WHERE status = 'PUBLISHED') AS published_courses,
            (SELECT COUNT(*) FROM enrollments) AS total_enrollments,
            (SELECT COUNT(*) FROM assignments) AS total_assignments,
            (SELECT COUNT(*) FROM submissions) AS total_submissions,
            (SELECT COUNT(*) FROM categories) AS total_categories;
    """
    counts = fetch_one(counts_query) or {}

    # Recent 5 user registrations
    recent_users_query = """
        SELECT id, first_name, last_name, email, role, is_active, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 5;
    """
    recent_users = fetch_all(recent_users_query)

    # Top 5 most enrolled courses
    top_courses_query = """
        SELECT 
            c.id, 
            c.title, 
            c.status,
            cat.name AS category_name,
            CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
            COUNT(e.id) AS enrollment_count
        FROM courses c
        INNER JOIN categories cat ON c.category_id = cat.id
        INNER JOIN users u ON c.teacher_id = u.id
        LEFT JOIN enrollments e ON c.id = e.course_id
        GROUP BY c.id, c.title, c.status, cat.name, teacher_name
        ORDER BY enrollment_count DESC
        LIMIT 5;
    """
    top_courses = fetch_all(top_courses_query)

    # Category course distribution
    category_distribution_query = """
        SELECT cat.name AS category_name, COUNT(c.id) AS course_count
        FROM categories cat
        LEFT JOIN courses c ON cat.id = c.category_id
        GROUP BY cat.id, cat.name
        ORDER BY course_count DESC;
    """
    category_distribution = fetch_all(category_distribution_query)

    return {
        "stats": counts,
        "recent_users": recent_users,
        "top_courses": top_courses,
        "category_distribution": category_distribution,
    }


def get_teacher_dashboard_stats(teacher_id: int) -> Dict[str, Any]:
    """
    Computes teacher-specific dashboard metrics using RAW SQL.
    """
    stats_query = """
        SELECT
            (SELECT COUNT(*) FROM courses WHERE teacher_id = %s) AS total_courses,
            (SELECT COUNT(DISTINCT e.student_id) 
             FROM courses c 
             INNER JOIN enrollments e ON c.id = e.course_id 
             WHERE c.teacher_id = %s) AS total_students,
            (SELECT COUNT(*) 
             FROM assignments a 
             INNER JOIN courses c ON a.course_id = c.id 
             WHERE c.teacher_id = %s) AS total_assignments,
            (SELECT COUNT(*) 
             FROM submissions s 
             INNER JOIN assignments a ON s.assignment_id = a.id 
             INNER JOIN courses c ON a.course_id = c.id 
             WHERE c.teacher_id = %s AND s.status IN ('SUBMITTED', 'LATE')) AS pending_submissions,
            (SELECT ROUND(AVG((s.marks / a.max_marks) * 100), 2)
             FROM submissions s 
             INNER JOIN assignments a ON s.assignment_id = a.id 
             INNER JOIN courses c ON a.course_id = c.id 
             WHERE c.teacher_id = %s AND s.status = 'GRADED') AS average_student_grade;
    """
    stats = fetch_one(stats_query, (teacher_id, teacher_id, teacher_id, teacher_id, teacher_id)) or {}

    # Recent submissions requiring grading or recently graded
    recent_submissions_query = """
        SELECT 
            s.id,
            s.assignment_id,
            s.student_id,
            s.status,
            s.submitted_at,
            s.marks,
            a.max_marks,
            a.title AS assignment_title,
            c.title AS course_title,
            CONCAT(u.first_name, ' ', u.last_name) AS student_name,
            u.email AS student_email
        FROM submissions s
        INNER JOIN assignments a ON s.assignment_id = a.id
        INNER JOIN courses c ON a.course_id = c.id
        INNER JOIN users u ON s.student_id = u.id
        WHERE c.teacher_id = %s
        ORDER BY s.submitted_at DESC
        LIMIT 5;
    """
    recent_submissions = fetch_all(recent_submissions_query, (teacher_id,))

    # Teacher courses with student counts
    teacher_courses_query = """
        SELECT 
            c.id, 
            c.title, 
            c.status, 
            c.level,
            cat.name AS category_name,
            COUNT(DISTINCT e.student_id) AS enrolled_students,
            COUNT(DISTINCT a.id) AS assignments_count
        FROM courses c
        INNER JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN enrollments e ON c.id = e.course_id
        LEFT JOIN assignments a ON c.id = a.course_id
        WHERE c.teacher_id = %s
        GROUP BY c.id, c.title, c.status, c.level, cat.name
        ORDER BY c.created_at DESC;
    """
    teacher_courses = fetch_all(teacher_courses_query, (teacher_id,))

    return {
        "stats": stats,
        "recent_submissions": recent_submissions,
        "courses": teacher_courses,
    }


def get_student_dashboard_stats(student_id: int) -> Dict[str, Any]:
    """
    Computes student-specific dashboard metrics, pending work, and course progress using RAW SQL.
    """
    stats_query = """
        SELECT
            (SELECT COUNT(*) FROM enrollments WHERE student_id = %s) AS total_enrolled_courses,
            (SELECT COUNT(*) FROM enrollments WHERE student_id = %s AND status = 'ACTIVE') AS active_courses,
            (SELECT COUNT(*) FROM enrollments WHERE student_id = %s AND status = 'COMPLETED') AS completed_courses,
            (SELECT ROUND(AVG((s.marks / a.max_marks) * 100), 2)
             FROM submissions s
             INNER JOIN assignments a ON s.assignment_id = a.id
             WHERE s.student_id = %s AND s.status = 'GRADED') AS average_grade;
    """
    stats = fetch_one(stats_query, (student_id, student_id, student_id, student_id)) or {}

    # Pending assignments for courses student is enrolled in
    pending_assignments_query = """
        SELECT 
            a.id AS assignment_id,
            a.title AS assignment_title,
            a.due_date,
            a.max_marks,
            c.id AS course_id,
            c.title AS course_title,
            CONCAT(u.first_name, ' ', u.last_name) AS teacher_name
        FROM assignments a
        INNER JOIN courses c ON a.course_id = c.id
        INNER JOIN enrollments e ON c.id = e.course_id AND e.student_id = %s AND e.status = 'ACTIVE'
        INNER JOIN users u ON c.teacher_id = u.id
        LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = %s
        WHERE s.id IS NULL
        ORDER BY a.due_date ASC
        LIMIT 5;
    """
    pending_assignments = fetch_all(pending_assignments_query, (student_id, student_id))
    stats["pending_assignments_count"] = len(pending_assignments)

    # Active courses with student's recorded progress
    enrolled_courses_query = """
        SELECT 
            c.id AS course_id,
            c.title AS course_title,
            c.level,
            e.status AS enrollment_status,
            e.progress,
            e.enrollment_date,
            CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
            (SELECT COUNT(*) FROM course_content cc WHERE cc.course_id = c.id) AS total_modules
        FROM enrollments e
        INNER JOIN courses c ON e.course_id = c.id
        INNER JOIN users u ON c.teacher_id = u.id
        WHERE e.student_id = %s
        ORDER BY e.enrollment_date DESC
        LIMIT 5;
    """
    recent_courses = fetch_all(enrolled_courses_query, (student_id,))

    # Recent grades
    recent_grades_query = """
        SELECT 
            s.id AS submission_id,
            s.marks,
            s.feedback,
            s.submitted_at,
            a.title AS assignment_title,
            a.max_marks,
            c.title AS course_title
        FROM submissions s
        INNER JOIN assignments a ON s.assignment_id = a.id
        INNER JOIN courses c ON a.course_id = c.id
        WHERE s.student_id = %s AND s.status = 'GRADED'
        ORDER BY s.submitted_at DESC
        LIMIT 5;
    """
    recent_grades = fetch_all(recent_grades_query, (student_id,))

    return {
        "stats": stats,
        "recent_courses": recent_courses,
        "pending_assignments": pending_assignments,
        "recent_grades": recent_grades,
    }
