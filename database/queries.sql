-- =============================================================================
-- STUDENT LEARNING MANAGEMENT SYSTEM (Student LMS)
-- Essential Production RAW SQL Queries
-- Demonstrates multi-table JOINs, aggregations, subqueries, and window functions
-- =============================================================================

USE student_lms;

-- -----------------------------------------------------------------------------
-- 1. Find all courses with Category name and Teacher full name
-- Demonstrates INNER JOIN across 3 tables
-- -----------------------------------------------------------------------------
SELECT 
    c.id,
    c.title,
    c.description,
    c.duration_hours,
    c.level,
    c.status,
    cat.name AS category_name,
    CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
    u.email AS teacher_email,
    c.created_at
FROM courses c
INNER JOIN categories cat ON c.category_id = cat.id
INNER JOIN users u ON c.teacher_id = u.id
ORDER BY c.created_at DESC;

-- -----------------------------------------------------------------------------
-- 2. Find all published courses available for student enrollment
-- Uses index on status (idx_courses_status)
-- -----------------------------------------------------------------------------
SELECT 
    c.id,
    c.title,
    c.description,
    c.duration_hours,
    c.level,
    cat.name AS category_name,
    CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
    COUNT(e.id) AS total_enrolled_students
FROM courses c
INNER JOIN categories cat ON c.category_id = cat.id
INNER JOIN users u ON c.teacher_id = u.id
LEFT JOIN enrollments e ON c.id = e.course_id
WHERE c.status = 'PUBLISHED'
GROUP BY c.id, c.title, c.description, c.duration_hours, c.level, cat.name, teacher_name
ORDER BY c.title ASC;

-- -----------------------------------------------------------------------------
-- 3. Find courses filtered by category (parameterized: %s)
-- Uses idx_courses_category
-- -----------------------------------------------------------------------------
SELECT 
    c.id,
    c.title,
    c.level,
    c.duration_hours,
    cat.name AS category_name,
    CONCAT(u.first_name, ' ', u.last_name) AS teacher_name
FROM courses c
INNER JOIN categories cat ON c.category_id = cat.id
INNER JOIN users u ON c.teacher_id = u.id
WHERE c.category_id = 1 AND c.status = 'PUBLISHED'
ORDER BY c.created_at DESC;

-- -----------------------------------------------------------------------------
-- 4. Find all courses taught by a specific teacher (parameterized: %s)
-- Uses idx_courses_teacher
-- -----------------------------------------------------------------------------
SELECT 
    c.id,
    c.title,
    c.status,
    c.level,
    cat.name AS category_name,
    COUNT(DISTINCT e.student_id) AS enrolled_students,
    COUNT(DISTINCT a.id) AS total_assignments,
    c.created_at
FROM courses c
INNER JOIN categories cat ON c.category_id = cat.id
LEFT JOIN enrollments e ON c.id = e.course_id
LEFT JOIN assignments a ON c.id = a.course_id
WHERE c.teacher_id = 2
GROUP BY c.id, c.title, c.status, c.level, cat.name, c.created_at
ORDER BY c.created_at DESC;

-- -----------------------------------------------------------------------------
-- 5. Find all students enrolled in a specific course (parameterized: %s)
-- Uses idx_enrollments_course
-- -----------------------------------------------------------------------------
SELECT 
    u.id AS student_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    e.enrollment_date,
    e.status AS enrollment_status,
    e.progress
FROM enrollments e
INNER JOIN users u ON e.student_id = u.id
WHERE e.course_id = 1
ORDER BY e.enrollment_date ASC;

-- -----------------------------------------------------------------------------
-- 6. Find all courses enrolled by a specific student (parameterized: %s)
-- Uses idx_enrollments_student
-- -----------------------------------------------------------------------------
SELECT 
    c.id AS course_id,
    c.title,
    c.description,
    c.level,
    cat.name AS category_name,
    CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
    e.enrollment_date,
    e.status AS enrollment_status,
    e.progress
FROM enrollments e
INNER JOIN courses c ON e.course_id = c.id
INNER JOIN categories cat ON c.category_id = cat.id
INNER JOIN users u ON c.teacher_id = u.id
WHERE e.student_id = 4
ORDER BY e.enrollment_date DESC;

-- -----------------------------------------------------------------------------
-- 7. Find pending assignments for a student
-- Shows assignments in courses where student is actively enrolled, but not yet submitted
-- -----------------------------------------------------------------------------
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
INNER JOIN enrollments e ON c.id = e.course_id AND e.student_id = 4
INNER JOIN users u ON c.teacher_id = u.id
LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = 4
WHERE s.id IS NULL AND a.due_date >= NOW() AND e.status = 'ACTIVE'
ORDER BY a.due_date ASC;

-- -----------------------------------------------------------------------------
-- 8. Find all submissions for an assignment with Student details & Marks
-- Used by Teachers for grading
-- -----------------------------------------------------------------------------
SELECT 
    s.id AS submission_id,
    s.assignment_id,
    s.student_id,
    CONCAT(u.first_name, ' ', u.last_name) AS student_name,
    u.email AS student_email,
    s.submission_text,
    s.submission_url,
    s.submitted_at,
    s.marks,
    s.feedback,
    s.status,
    a.max_marks,
    a.due_date
FROM submissions s
INNER JOIN users u ON s.student_id = u.id
INNER JOIN assignments a ON s.assignment_id = a.id
WHERE s.assignment_id = 1
ORDER BY s.submitted_at ASC;

-- -----------------------------------------------------------------------------
-- 9. Calculate average grade for a student across all graded assignments
-- -----------------------------------------------------------------------------
SELECT 
    s.student_id,
    CONCAT(u.first_name, ' ', u.last_name) AS student_name,
    COUNT(s.id) AS graded_submissions_count,
    ROUND(AVG(s.marks), 2) AS average_marks,
    ROUND(AVG((s.marks / a.max_marks) * 100), 2) AS average_percentage
FROM submissions s
INNER JOIN users u ON s.student_id = u.id
INNER JOIN assignments a ON s.assignment_id = a.id
WHERE s.student_id = 4 AND s.status = 'GRADED'
GROUP BY s.student_id, student_name;

-- -----------------------------------------------------------------------------
-- 10. Calculate course progress dynamically
-- (Total content modules completed / Total content modules in course * 100)
-- -----------------------------------------------------------------------------
SELECT 
    e.course_id,
    e.student_id,
    e.progress AS recorded_progress,
    (SELECT COUNT(*) FROM course_content cc WHERE cc.course_id = e.course_id) AS total_modules
FROM enrollments e
WHERE e.student_id = 4 AND e.course_id = 1;

-- -----------------------------------------------------------------------------
-- 11. Count total students enrolled per course
-- Demonstrates LEFT JOIN and GROUP BY
-- -----------------------------------------------------------------------------
SELECT 
    c.id AS course_id,
    c.title AS course_title,
    c.status,
    COUNT(e.id) AS total_students
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
GROUP BY c.id, c.title, c.status
ORDER BY total_students DESC;

-- -----------------------------------------------------------------------------
-- 12. Count courses taught per teacher
-- -----------------------------------------------------------------------------
SELECT 
    u.id AS teacher_id,
    CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
    u.email,
    COUNT(c.id) AS total_courses,
    SUM(CASE WHEN c.status = 'PUBLISHED' THEN 1 ELSE 0 END) AS published_courses,
    SUM(CASE WHEN c.status = 'DRAFT' THEN 1 ELSE 0 END) AS draft_courses
FROM users u
LEFT JOIN courses c ON u.id = c.teacher_id
WHERE u.role = 'TEACHER'
GROUP BY u.id, teacher_name, u.email
ORDER BY total_courses DESC;

-- -----------------------------------------------------------------------------
-- 13. Top courses by enrollment (Leaderboard)
-- -----------------------------------------------------------------------------
SELECT 
    c.id,
    c.title,
    cat.name AS category_name,
    CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
    COUNT(e.id) AS enrollment_count
FROM courses c
INNER JOIN categories cat ON c.category_id = cat.id
INNER JOIN users u ON c.teacher_id = u.id
LEFT JOIN enrollments e ON c.id = e.course_id
WHERE c.status = 'PUBLISHED'
GROUP BY c.id, c.title, cat.name, teacher_name
ORDER BY enrollment_count DESC
LIMIT 5;

-- -----------------------------------------------------------------------------
-- 14. Find students with pending assignments (due within the next 7 days)
-- -----------------------------------------------------------------------------
SELECT 
    u.id AS student_id,
    CONCAT(u.first_name, ' ', u.last_name) AS student_name,
    u.email,
    a.title AS assignment_title,
    c.title AS course_title,
    a.due_date
FROM users u
INNER JOIN enrollments e ON u.id = e.student_id AND e.status = 'ACTIVE'
INNER JOIN courses c ON e.course_id = c.id
INNER JOIN assignments a ON c.id = a.course_id
LEFT JOIN submissions s ON a.id = s.assignment_id AND u.id = s.student_id
WHERE s.id IS NULL 
  AND a.due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
ORDER BY a.due_date ASC;
