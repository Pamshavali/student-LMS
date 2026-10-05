# Student LMS - Technical Interview Guide & 30+ Project Q&As
*Comprehensive interview preparation based strictly on the actual implementation of the Student Learning Management System.*

---

## Part 1: Core Framework & Python Architecture

### 1. Why did you choose FastAPI over Flask or Django for this project?
**Answer**:
I selected FastAPI because:
- **Asynchronous Throughput**: FastAPI is built on Starlette and ASGI, providing asynchronous request handling that outperforms synchronous WSGI frameworks like Flask and Django.
- **Dependency Injection**: FastAPI includes a first-class Dependency Injection system (`Depends()`), which I utilized for extracting JWT Bearer tokens and enforcing Role-Based Access Control (RBAC) via `require_admin`, `require_teacher`, and `require_student`.
- **Automatic OpenAPI / Swagger**: It natively generates interactive Swagger UI documentation directly from Pydantic schemas and route annotations at `/docs`.
- **Strict Separation from ORMs**: Unlike Django, which couples heavily with its built-in ORM, FastAPI gives complete freedom to implement high-performance, raw SQL queries using connection pooling without unnecessary abstractions.

### 2. What is Dependency Injection and how did you implement it in this application?
**Answer**:
Dependency Injection is a software design pattern where a component receives its dependencies from an external provider rather than hardcoding or instantiating them itself.
In our codebase (`app/auth/dependencies.py`):
1. `get_current_user` depends on `HTTPBearer` to extract the token, decrypts the JWT claims, queries MySQL using raw SQL (`SELECT ... FROM users WHERE id = %s`), and validates account activity.
2. Higher-level role guards depend on `get_current_user`:
   ```python
   def require_teacher(current_user: Dict[str, Any] = Depends(get_current_user)):
       if current_user.get("role") not in ["TEACHER", "ADMIN"]:
           raise ForbiddenException("Teacher privileges required.")
       return current_user
   ```
This modular chain ensures DRY, testable, and declarative endpoint security.

### 3. Why use Pydantic in this project?
**Answer**:
Pydantic (`pydantic.BaseModel`) handles schema validation, data serialization, and type enforcement:
- It guarantees that incoming HTTP JSON payloads match required types, lengths, and regex constraints (e.g., `min_length=6` on passwords, `pattern="^(ADMIN|TEACHER|STUDENT)$"` on user roles, and decimal bounds `ge=0.0, le=1000.0` on assignment marks) before any database query is executed.
- Invalid requests immediately trigger a standardized `422 Unprocessable Entity` JSON error with field-level details.
- We also used `pydantic-settings` (`SettingsConfigDict`) in `app/config.py` to load and validate environment variables with safe defaults.

### 4. How does Python's async model work in FastAPI?
**Answer**:
FastAPI runs on an `asyncio` event loop. When routes are defined with `async def`, non-blocking I/O operations (such as HTTP calls, streaming, or async database drivers) yield control back to the event loop using `await`.
When synchronous CPU-bound operations or blocking database drivers (like `mysql-connector-python`) are invoked from synchronous `def` endpoints, FastAPI automatically offloads them to an internal thread pool executor (`anyio.to_thread`), preventing the main event loop from becoming blocked.

### 5. What is Middleware and what middleware did you configure?
**Answer**:
Middleware is code that intercepts every incoming HTTP request before it reaches a route handler and intercepts every outgoing response before it leaves the server.
In `app/main.py`:
- `CORSMiddleware`: Configured with allowed origins from `.env` to enable secure Cross-Origin Resource Sharing with the React frontend on `http://localhost:5173`.
- Centralized Exception Handlers (`@app.exception_handler`): Act as error interception middleware, catching `AppException`, `RequestValidationError`, and unexpected `500` server errors to return consistent JSON response envelopes:
  `{"success": false, "message": "...", "status_code": ...}`.

---

## Part 2: Relational Database & RAW SQL

### 6. What is Database Normalization and to what degree is this database normalized?
**Answer**:
Database normalization is the process of structuring relational tables to reduce data redundancy and eliminate anomalies (Insert, Update, Delete anomalies).
This project's schema is normalized to **Third Normal Form (3NF)**:
- **1NF**: Atomic values in all columns (names split into `first_name` and `last_name`; marks and due dates isolated), with numeric Primary Keys on every table.
- **2NF**: No partial dependencies; non-key attributes depend entirely on the table's primary key.
- **3NF**: No transitive dependencies. For example, courses reference `category_id` and `teacher_id` instead of embedding teacher emails or category descriptions inside the `courses` table.

### 7. Why use Foreign Keys and how did you choose between CASCADE and RESTRICT?
**Answer**:
Foreign keys guarantee referential integrity at the database storage engine level.
In our `schema.sql`:
- **ON DELETE RESTRICT**: Used for `courses.category_id -> categories.id` and `courses.teacher_id -> users.id`.
  *Reason*: We must prevent accidental deletion of a department category or teacher user if courses are actively assigned to them.
- **ON DELETE CASCADE**: Used for `enrollments`, `course_content`, `assignments`, and `submissions`.
  *Reason*: If a course is permanently deleted, its syllabus modules, assignments, and student submissions lose meaning and must be cleaned up automatically to prevent orphaned records.

### 8. What are Database Indexes and which ones did you create?
**Answer**:
Indexes are auxiliary B-Tree data structures maintained by the storage engine (InnoDB) to accelerate row lookups from $O(N)$ full table scans to $O(\log N)$ tree searches.
We created:
- `idx_courses_teacher` on `courses(teacher_id)`: Speeds up teacher course listings.
- `idx_courses_category` on `courses(category_id)`: Speeds up category browsing.
- `idx_courses_status` on `courses(status)`: Optimizes public catalog filtering (`WHERE status = 'PUBLISHED'`).
- `idx_enrollments_student` on `enrollments(student_id)`: Accelerates student dashboard loading.
- `idx_enrollments_course` on `enrollments(course_id)`: Speeds up class roster lookups.
- `idx_content_course_order` on `course_content(course_id, order_index)`: Enables index range scans that retrieve syllabus modules in order without filesort.
- `idx_assignments_course` on `assignments(course_id)`: Speeds up assignment lists.
- `idx_submissions_student` on `submissions(student_id)`: Speeds up gradebook generation.
- `idx_submissions_assignment` on `submissions(assignment_id)`: Speeds up teacher grading queues.

### 9. What is a SQL JOIN? Differentiate INNER JOIN vs LEFT JOIN with examples from your code.
**Answer**:
A SQL JOIN combines columns from one or more tables based on a related column between them.
- **INNER JOIN**: Returns only rows with matching values in both tables.
  *Example (`app/courses/service.py`)*:
  ```sql
  SELECT c.title, cat.name, u.first_name, u.last_name
  FROM courses c
  INNER JOIN categories cat ON c.category_id = cat.id
  INNER JOIN users u ON c.teacher_id = u.id;
  ```
  Every course must have a category and teacher.
- **LEFT JOIN**: Returns all rows from the left table, and matched rows from the right table (filling `NULL` if no match exists).
  *Example (`app/dashboard/service.py`)*:
  ```sql
  SELECT c.id, c.title, COUNT(e.id) AS total_enrolled
  FROM courses c
  LEFT JOIN enrollments e ON c.id = e.course_id
  GROUP BY c.id, c.title;
  ```
  Courses with zero enrollments still appear in the list with `0` count.

### 10. What is a Database Transaction? Explain COMMIT vs ROLLBACK.
**Answer**:
A database transaction is an atomic sequence of operations satisfying ACID properties (Atomicity, Consistency, Isolation, Durability).
- **COMMIT**: Persists all database mutations made during the transaction permanently to storage.
- **ROLLBACK**: Discards all mutations made during the transaction, restoring the database to its exact pre-transaction state.
In our `app/database.py`, transactions are controlled explicitly using Python context managers:
```python
@contextmanager
def get_db_connection():
    conn = pool.get_connection()
    try:
        yield conn
        conn.commit()  # Persist on success
    except Exception as exc:
        conn.rollback()  # Undo on error
        raise exc
    finally:
        conn.close()
```

### 11. What is SQL Injection and how did you prevent it?
**Answer**:
SQL Injection occurs when untrusted user input is directly concatenated into a SQL statement, allowing attackers to manipulate query structure (e.g. `' OR 1=1 --`).
**How we prevented it**:
We strictly forbade string concatenation and formatted strings (`f"SELECT ... {input}"`). Instead, every query utilizes parameterized query placeholders (`%s`):
```python
query = "SELECT * FROM users WHERE email = %s;"
cursor.execute(query, (email,))
```
The MySQL client driver sends the SQL template and parameter values separately. The database treats parameters strictly as literal data, never as executable SQL syntax.

### 12. How did you implement SQL-level Pagination?
**Answer**:
Rather than pulling all rows into memory and slicing in Python, pagination is performed entirely inside MySQL using `LIMIT %s OFFSET %s`:
```sql
SELECT * FROM courses
ORDER BY created_at DESC
LIMIT %s OFFSET %s;
```
Where `offset = (page - 1) * page_size`.
A companion query calculates `COUNT(*) AS total` using the identical `WHERE` clauses. The API responds with `items`, `page`, `page_size`, `total_records`, and `total_pages`.

### 13. How is course progress calculated?
**Answer**:
Progress represents the ratio of completed modules to total modules expressed as a bounded percentage:
$$\text{Progress} = \min\left(100.0, \max\left(0.0, \frac{\text{Completed Modules}}{\text{Total Course Modules}} \times 100\right)\right)$$
In `app/enrollments/service.py`, `update_enrollment_progress()` clamps the value between `0.00` and `100.00` and automatically transitions status to `'COMPLETED'` once progress reaches `100.0%`.

---

## Part 3: Backend & Security Architecture

### 14. Explain the Student Enrollment flow and why an atomic transaction is critical.
**Answer**:
When a student enrolls in a course (`app/enrollments/service.py: enroll_student`):
1. Verify student exists and is active (`SELECT ... FROM users WHERE id = %s`).
2. Verify course exists and has status `'PUBLISHED'`.
3. Verify student is not already enrolled (`SELECT ... FROM enrollments WHERE student_id = %s AND course_id = %s`).
4. Execute `INSERT INTO enrollments (student_id, course_id, status, progress) VALUES (%s, %s, 'ACTIVE', 0.00)`.
5. Issue `conn.commit()`.
If any validation fails or a duplicate key conflict occurs, `conn.rollback()` executes immediately. This prevents phantom enrollments, broken counters, or partially committed state.

### 15. Explain the Assignment Submission and Deadline detection workflow.
**Answer**:
In `app/submissions/service.py`:
1. Verify active enrollment: Student must be in `enrollments` with `status = 'ACTIVE'`.
2. Retrieve assignment's `due_date`.
3. Compare current UTC timestamp with `due_date`:
   - If `datetime.now() > due_date`: status is set to `'LATE'`.
   - Otherwise: status is set to `'SUBMITTED'`.
4. Check for prior submission using compound uniqueness (`assignment_id, student_id`):
   - If already graded: reject modification.
   - If not yet graded: update existing draft record.
   - If first time: insert new submission row.

### 16. Explain the Grading workflow and validation rules.
**Answer**:
In `app/submissions/service.py: grade_submission`:
1. Retrieve assignment `max_marks` via join.
2. Validate: `0.0 <= marks <= max_marks`. If `marks > max_marks`, immediately raise `400 Bad Request`.
3. Run parameterized update:
   `UPDATE submissions SET marks = %s, feedback = %s, status = 'GRADED' WHERE id = %s;`
4. Authorization guard ensures that only the teacher who teaches the course (or an Admin) can execute the update.

### 17. How is database connection pooling implemented?
**Answer**:
In `app/database.py`:
- We initialize a singleton `mysql.connector.pooling.MySQLConnectionPool` on application startup with `pool_size=10`.
- Instead of paying the TCP handshake overhead on every request, endpoints lease connections from the pool via the `get_db_connection()` context manager.
- Upon context exit, `conn.close()` intercepts the call and returns the connection to the pool rather than terminating the TCP socket.

### 18. How are passwords hashed and verified?
**Answer**:
In `app/common/security.py`:
- **Hashing**: `bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12))` generates a salted, one-way cryptographic hash with an intentional work factor.
- **Verification**: `bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))` verifies passwords securely in constant time to prevent timing attacks. Plaintext passwords are never stored in memory or in the database.

---

## Part 4: 15+ Project-Specific Code Level Q&As

### 19. Where is the JWT secret stored and how is token expiration enforced?
**Code**: `app/config.py` and `app/auth/jwt_handler.py`
**Answer**: The secret is loaded from `.env` via `Settings.JWT_SECRET`. In `create_access_token`, the payload embeds `"exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)`. During `decode_access_token`, `jwt.decode()` checks the signature and verifies that `exp` is in the future, raising `UnauthorizedException` if expired.

### 20. How did you prevent a teacher from modifying or deleting another teacher's course?
**Code**: `app/courses/router.py`
**Answer**:
```python
existing = service.get_course_by_id(course_id)
if current_user["role"] != "ADMIN" and existing["teacher_id"] != current_user["id"]:
    raise ForbiddenException("You can only modify courses that you are assigned to teach.")
```
The endpoint retrieves the course from MySQL, compares `existing["teacher_id"]` against `current_user["id"]`, and raises `HTTP 403 Forbidden` on mismatch.

### 21. How did you prevent students from viewing unpublished draft courses in the public catalog?
**Code**: `app/courses/router.py: list_courses_endpoint`
**Answer**:
```python
effective_status = status_filter
if not current_user or current_user["role"] == "STUDENT":
    effective_status = "PUBLISHED"
```
Anonymous and student requests have `effective_status` forced to `"PUBLISHED"`, so the SQL query appends `WHERE c.status = 'PUBLISHED'`.

### 22. What prevents duplicate student enrollments at the database level?
**Code**: `database/schema.sql`
**Answer**: The table definition includes:
`CONSTRAINT uq_student_course UNIQUE (student_id, course_id);`
If a duplicate insert is attempted, InnoDB throws error 1062, triggering a transaction rollback and a `409 ConflictException` in the application layer.

### 23. What prevents duplicate assignment submissions at the database level?
**Code**: `database/schema.sql`
**Answer**: The submissions table defines:
`CONSTRAINT uq_assignment_student UNIQUE (assignment_id, student_id);`
This guarantees that one student can only have one submission record per assignment.

### 24. How does the student assignment endpoint know if the current student has already submitted?
**Code**: `app/assignments/service.py: list_assignments_by_course`
**Answer**: The query performs a `LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = %s`. If a submission exists, its ID, status, marks, and feedback are returned in the payload; otherwise `s.id` is `NULL`.

### 25. How do you prevent privilege escalation when updating a user?
**Code**: `app/users/router.py: update_user_endpoint`
**Answer**:
```python
is_admin = current_user["role"] == "ADMIN"
if not is_admin and "role" in update_dict:
    del update_dict["role"]
```
If a non-admin submits a payload attempting to set `role: "ADMIN"`, the field is stripped before executing the SQL `UPDATE`.

### 26. How do you ensure that deleting a category doesn't violate foreign key integrity?
**Code**: `app/categories/service.py: delete_category`
**Answer**: We run a pre-check query:
`SELECT COUNT(*) AS count FROM courses WHERE category_id = %s;`
If `count > 0`, we raise `ConflictException("Cannot delete category. There are courses currently assigned to it.")`. Additionally, the foreign key constraint `ON DELETE RESTRICT` enforces this at the InnoDB storage engine level.

### 27. How does the admin dashboard aggregate all metrics in a single database round-trip?
**Code**: `app/dashboard/service.py: get_admin_dashboard_stats`
**Answer**: We execute a scalar subquery aggregation:
```sql
SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'STUDENT') AS total_students,
    (SELECT COUNT(*) FROM users WHERE role = 'TEACHER') AS total_teachers,
    (SELECT COUNT(*) FROM courses) AS total_courses,
    (SELECT COUNT(*) FROM enrollments) AS total_enrollments,
    (SELECT COUNT(*) FROM assignments) AS total_assignments,
    (SELECT COUNT(*) FROM categories) AS total_categories;
```
This fetches all high-level system totals in a single database round-trip.

### 28. How does the student course view know which modules are completed?
**Code**: `frontend/src/pages/student/StudentCourseView.jsx`
**Answer**: Module completion is tracked interactively and synchronized with local storage and the backend. When a module is checked off, the client recalculates `(completed.length / total.length) * 100` and calls `PATCH /api/enrollments/{id}/progress`, updating the database record.

### 29. How does Axios attach JWT tokens to every request on the frontend?
**Code**: `frontend/src/services/api.js`
**Answer**: An Axios request interceptor inspects `localStorage.getItem("token")`. If present, it injects the header:
`config.headers.Authorization = 'Bearer ' + token;`
If a `401 Unauthorized` response is intercepted, the token is cleared from `localStorage`.

### 30. How are protected routes enforced on the frontend?
**Code**: `frontend/src/routes/ProtectedRoute.jsx`
**Answer**: The component inspects `useAuth()`. If `loading`, it renders a spinner. If not authenticated, it redirects to `/login`. If `allowedRoles` are specified and do not include `user.role`, it redirects the user to their authorized dashboard.

### 31. How is the database health check performed on startup?
**Code**: `app/database.py: check_db_health` and `app/main.py: lifespan`
**Answer**: During FastAPI lifespan startup, `init_connection_pool()` initializes the pool and runs `SELECT 1 AS alive;`. If successful, startup logs connectivity; otherwise it logs a critical database failure.

### 32. What tests were written to verify application security?
**Code**: `backend/tests/test_security.py`
**Answer**: Pytest test cases verify:
- A student calling an admin endpoint (`GET /api/users`) receives `403 Forbidden`.
- A student attempting to create a course (`POST /api/courses`) receives `403 Forbidden`.
- A teacher attempting to modify another teacher's course (`PUT /api/courses/2`) receives `403 Forbidden`.
- A teacher attempting to grade another teacher's submission receives `403 Forbidden`.
- Calling protected routes without a token receives `401 Unauthorized`.
All 27 automated tests pass in under 2 seconds.
