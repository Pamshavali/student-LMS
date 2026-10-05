-- =============================================================================
-- STUDENT LEARNING MANAGEMENT SYSTEM (Student LMS)
-- Relational Database Schema (MySQL 8.0+)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS student_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_lms;

-- Disable foreign key checks during schema creation/reset
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS course_content;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores authentication, profile, and role-based permissions (ADMIN, TEACHER, STUDENT)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    role ENUM('ADMIN', 'TEACHER', 'STUDENT') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. CATEGORIES TABLE
-- Stores academic and subject categories for organizing courses
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. COURSES TABLE
-- Stores course offerings linked to a Category and a Teacher (User with role TEACHER)
-- -----------------------------------------------------------------------------
CREATE TABLE courses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    duration_hours INT NULL,
    level ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') NOT NULL DEFAULT 'BEGINNER',
    status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_courses_category 
        FOREIGN KEY (category_id) REFERENCES categories(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
    CONSTRAINT fk_courses_teacher 
        FOREIGN KEY (teacher_id) REFERENCES users(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. ENROLLMENTS TABLE
-- Manages student enrollment in courses with progress tracking
-- Enforces UNIQUE(student_id, course_id) to avoid duplicate enrollments
-- -----------------------------------------------------------------------------
CREATE TABLE enrollments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ACTIVE', 'COMPLETED', 'DROPPED') DEFAULT 'ACTIVE',
    progress DECIMAL(5,2) DEFAULT 0.00,
    
    CONSTRAINT uq_student_course UNIQUE (student_id, course_id),
    
    CONSTRAINT fk_enrollments_student 
        FOREIGN KEY (student_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    CONSTRAINT fk_enrollments_course 
        FOREIGN KEY (course_id) REFERENCES courses(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. COURSE_CONTENT TABLE
-- Stores syllabus modules, articles, video lectures, and learning resources
-- -----------------------------------------------------------------------------
CREATE TABLE course_content (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    content_type ENUM('VIDEO', 'DOCUMENT', 'ARTICLE', 'LINK') NOT NULL,
    content_url TEXT NULL,
    order_index INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_course_content_course 
        FOREIGN KEY (course_id) REFERENCES courses(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. ASSIGNMENTS TABLE
-- Stores coursework created by teachers for specific courses
-- -----------------------------------------------------------------------------
CREATE TABLE assignments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    due_date DATETIME NOT NULL,
    max_marks DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_assignments_course 
        FOREIGN KEY (course_id) REFERENCES courses(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. SUBMISSIONS TABLE
-- Stores student work, timestamps, grading marks, and teacher feedback
-- Enforces UNIQUE(assignment_id, student_id)
-- -----------------------------------------------------------------------------
CREATE TABLE submissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    assignment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    submission_text TEXT NULL,
    submission_url TEXT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    marks DECIMAL(5,2) NULL,
    feedback TEXT NULL,
    status ENUM('SUBMITTED', 'GRADED', 'LATE') DEFAULT 'SUBMITTED',
    
    CONSTRAINT uq_assignment_student UNIQUE (assignment_id, student_id),
    
    CONSTRAINT fk_submissions_assignment 
        FOREIGN KEY (assignment_id) REFERENCES assignments(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    CONSTRAINT fk_submissions_student 
        FOREIGN KEY (student_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PERFORMANCE INDEXES & EXPLANATIONS
-- =============================================================================

-- Optimizes filtering courses taught by a specific teacher (Teacher dashboard & course management)
CREATE INDEX idx_courses_teacher ON courses(teacher_id);

-- Speeds up category filtering when browsing courses by category
CREATE INDEX idx_courses_category ON courses(category_id);

-- Accelerates retrieving published courses vs draft courses in public catalogs
CREATE INDEX idx_courses_status ON courses(status);

-- Rapid lookup of a student's active enrollments in their student dashboard
CREATE INDEX idx_enrollments_student ON enrollments(student_id);

-- Rapid lookup of all students enrolled in a particular course for teachers/admins
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- Speeds up fetching syllabus items in order for a course
CREATE INDEX idx_content_course_order ON course_content(course_id, order_index);

-- Accelerates loading assignments belonging to a course
CREATE INDEX idx_assignments_course ON assignments(course_id);

-- Speeds up querying all submissions made by a student across assignments
CREATE INDEX idx_submissions_student ON submissions(student_id);

-- Accelerates fetching all student submissions for a specific assignment during grading
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
