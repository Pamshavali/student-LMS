-- =============================================================================
-- STUDENT LEARNING MANAGEMENT SYSTEM (Student LMS)
-- Seed Data (MySQL 8.0+)
-- Demo Password for all accounts: Password123!
-- =============================================================================

USE student_lms;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE submissions;
TRUNCATE TABLE assignments;
TRUNCATE TABLE course_content;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE courses;
TRUNCATE TABLE categories;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- USERS SEED (Admin, Teachers, Students)
-- Bcrypt Hash for 'Password123!': $2b$12$oqX/T168MR3bB2TQDTIu5u4u0WjZMTXHw9JnxZAk3IthqNO13t.HO
-- -----------------------------------------------------------------------------
INSERT INTO users (id, first_name, last_name, email, password_hash, phone, role, is_active) VALUES
(1, 'Eleanor', 'Vance', 'admin@lms.com', '$2b$12$oqX/T168MR3bB2TQDTIu5u4u0WjZMTXHw9JnxZAk3IthqNO13t.HO', '+1-555-0101', 'ADMIN', TRUE),
(2, 'Alan', 'Turing', 'teacher@lms.com', '$2b$12$oqX/T168MR3bB2TQDTIu5u4u0WjZMTXHw9JnxZAk3IthqNO13t.HO', '+1-555-0102', 'TEACHER', TRUE),
(3, 'Ada', 'Lovelace', 'ada.teacher@lms.com', '$2b$12$oqX/T168MR3bB2TQDTIu5u4u0WjZMTXHw9JnxZAk3IthqNO13t.HO', '+1-555-0103', 'TEACHER', TRUE),
(4, 'Alex', 'Johnson', 'student@lms.com', '$2b$12$oqX/T168MR3bB2TQDTIu5u4u0WjZMTXHw9JnxZAk3IthqNO13t.HO', '+1-555-0104', 'STUDENT', TRUE),
(5, 'Sophia', 'Chen', 'sophia.student@lms.com', '$2b$12$oqX/T168MR3bB2TQDTIu5u4u0WjZMTXHw9JnxZAk3IthqNO13t.HO', '+1-555-0105', 'STUDENT', TRUE),
(6, 'Marcus', 'Miller', 'marcus.student@lms.com', '$2b$12$oqX/T168MR3bB2TQDTIu5u4u0WjZMTXHw9JnxZAk3IthqNO13t.HO', '+1-555-0106', 'STUDENT', TRUE);

-- -----------------------------------------------------------------------------
-- CATEGORIES SEED
-- -----------------------------------------------------------------------------
INSERT INTO categories (id, name, description) VALUES
(1, 'Computer Science', 'Foundations of computer science, relational databases, data structures, and algorithms.'),
(2, 'Software Engineering', 'Full-stack web application development, microservices, API design, and system architecture.'),
(3, 'Data Science & AI', 'Machine learning, statistical analysis, data pipelines, and artificial intelligence systems.'),
(4, 'Cloud & DevOps', 'Containerization, orchestration, continuous delivery pipelines, and cloud infrastructure.');

-- -----------------------------------------------------------------------------
-- COURSES SEED (6 realistic courses)
-- -----------------------------------------------------------------------------
INSERT INTO courses (id, title, description, category_id, teacher_id, duration_hours, level, status) VALUES
(1, 'Relational Database Engineering & RAW SQL Mastery', 'Deep dive into MySQL relational architecture, raw SQL queries, complex multi-table joins, ACID transactions, and index query execution plan tuning.', 1, 2, 45, 'INTERMEDIATE', 'PUBLISHED'),
(2, 'Full-Stack Modern Web Applications with React & FastAPI', 'Architect resilient web applications with modern React on the frontend and high-performance asynchronous FastAPI backends.', 2, 3, 50, 'INTERMEDIATE', 'PUBLISHED'),
(3, 'Advanced Algorithms, Complexity, & System Performance', 'Analyze algorithmic complexities, dynamic programming, graph theory, and concurrent system performance bottlenecks.', 1, 2, 40, 'ADVANCED', 'PUBLISHED'),
(4, 'Applied Machine Learning Systems & Model Deployment', 'End-to-end practical machine learning workflows from data exploration and feature engineering to production deployment.', 3, 3, 42, 'ADVANCED', 'PUBLISHED'),
(5, 'Cloud Infrastructure & Container Orchestration', 'Master containerization with Docker, orchestration with Kubernetes, and enterprise microservices deployment.', 4, 2, 36, 'BEGINNER', 'PUBLISHED'),
(6, 'System Security & Cryptographic Protocols (Work in Progress)', 'Foundations of zero-trust security, asymmetric encryption, JWT token management, and threat modeling.', 1, 3, 30, 'ADVANCED', 'DRAFT');

-- -----------------------------------------------------------------------------
-- COURSE CONTENT SEED
-- -----------------------------------------------------------------------------
INSERT INTO course_content (course_id, title, description, content_type, content_url, order_index) VALUES
-- Course 1 Content
(1, 'Module 1: Relational Modeling & Normal Forms (1NF to BCNF)', 'Understanding functional dependencies, entity-relationship diagrams, and eliminating data redundancy.', 'ARTICLE', 'https://example.com/lms/docs/sql-normalization', 1),
(1, 'Module 2: Advanced JOINs & Aggregations', 'In-depth review of INNER, LEFT, RIGHT JOINs, GROUP BY, and HAVING clauses.', 'VIDEO', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 2),
(1, 'Module 3: Indexing Strategies & EXPLAIN Query Plans', 'B-Tree indexes, composite indexes, query cardinality, and eliminating table scans.', 'DOCUMENT', 'https://example.com/lms/docs/mysql-indexes.pdf', 3),
(1, 'Module 4: ACID Transactions & Concurrency Control', 'Isolation levels (Read Committed, Repeatable Read, Serializable) and deadlock mitigation.', 'ARTICLE', 'https://example.com/lms/docs/acid-transactions', 4),

-- Course 2 Content
(2, 'Module 1: FastAPI Architecture & Dependency Injection', 'Structuring production FastAPI applications with route separation and dependency providers.', 'ARTICLE', 'https://example.com/lms/docs/fastapi-arch', 1),
(2, 'Module 2: JWT Authentication & Role-Based Authorization', 'Implementing cryptographically signed bearer tokens and role guards.', 'VIDEO', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 2),
(2, 'Module 3: React 18 State Management & Custom Hooks', 'Context API, modular hooks, Axios interceptors, and optimistic UI updates.', 'DOCUMENT', 'https://example.com/lms/docs/react-hooks.pdf', 3),

-- Course 3 Content
(3, 'Module 1: Graph Traversal & Shortest Path Algorithms', 'Dijkstra, Bellman-Ford, A*, and topological sorting in network routing.', 'ARTICLE', 'https://example.com/lms/docs/graph-algorithms', 1),
(3, 'Module 2: Dynamic Programming & Optimal Substructure', 'Memoization vs tabulation, knapsack problems, and state transitions.', 'VIDEO', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 2);

-- -----------------------------------------------------------------------------
-- ASSIGNMENTS SEED
-- -----------------------------------------------------------------------------
INSERT INTO assignments (id, course_id, title, description, due_date, max_marks) VALUES
(1, 1, 'Assignment 1: Complex Multi-Table JOIN & Query Optimization', 'Write raw SQL queries that join 4 tables, perform conditional aggregations, and optimize the execution plan using appropriate B-tree indexes.', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY), 100.00),
(2, 1, 'Assignment 2: ACID Transaction Script with Rollback Guard', 'Develop a Python script utilizing raw SQL transactions to transfer course credits with automatic rollback on validation error.', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 14 DAY), 100.00),
(3, 2, 'Assignment 1: Secure Authentication Microservice with PyJWT', 'Implement user registration, bcrypt password hashing, and role-based route access controls in FastAPI.', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 DAY), 100.00),
(4, 3, 'Assignment 1: Min-Heap Implementation for Priority Queues', 'Implement a memory-efficient binary heap in Python and analyze amortized time complexity.', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 10 DAY), 100.00);

-- -----------------------------------------------------------------------------
-- ENROLLMENTS SEED
-- -----------------------------------------------------------------------------
INSERT INTO enrollments (id, student_id, course_id, enrollment_date, status, progress) VALUES
(1, 4, 1, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 10 DAY), 'ACTIVE', 50.00),
(2, 4, 2, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 DAY), 'ACTIVE', 33.33),
(3, 5, 1, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 8 DAY), 'ACTIVE', 75.00),
(4, 5, 3, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY), 'ACTIVE', 0.00),
(5, 6, 2, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 12 DAY), 'COMPLETED', 100.00);

-- -----------------------------------------------------------------------------
-- SUBMISSIONS & GRADING SEED
-- -----------------------------------------------------------------------------
INSERT INTO submissions (id, assignment_id, student_id, submission_text, submission_url, submitted_at, marks, feedback, status) VALUES
(1, 1, 4, 'Submitted SQL query solution with EXPLAIN output and composite index creation script on (student_id, course_id).', 'https://github.com/alex-student/sql-assignment-1', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY), 94.50, 'Outstanding work! The execution plan cleanly leverages index range scans and the query cost is reduced by 85%.', 'GRADED'),
(2, 1, 5, 'Attached normalized database migration script and query benchmark report using sysbench.', 'https://github.com/sophia-student/mysql-opt-report', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 89.00, 'Very good relational structure. Consider adding an index on the status column to further accelerate the filter condition.', 'GRADED'),
(3, 3, 4, 'Implemented JWT token refresh logic and secure HTTP-only cookie parsing with FastAPI security dependencies.', 'https://github.com/alex-student/fastapi-auth-demo', CURRENT_TIMESTAMP, NULL, NULL, 'SUBMITTED');
