# Student LMS - REST API Specification

All endpoints are hosted at `/api` and return standardized JSON envelopes.

## Response Envelopes

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "status_code": 200,
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "status_code": 200,
  "data": {
    "items": [ ... ],
    "page": 1,
    "page_size": 10,
    "total_records": 48,
    "total_pages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Resource not found",
  "status_code": 404,
  "errors": null
}
```

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Creates a student or teacher account.
- **Request Body**:
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "role": "STUDENT",
    "phone": "+1-555-0199"
  }
  ```
- **Responses**: `201 Created`, `409 Conflict` (Duplicate email), `422 Unprocessable Entity`.

### `POST /api/auth/login`
Authenticates user and returns JWT bearer token.
- **Request Body**:
  ```json
  {
    "email": "student@lms.com",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": 4,
      "first_name": "Alex",
      "last_name": "Johnson",
      "email": "student@lms.com",
      "role": "STUDENT"
    }
  }
  ```

### `GET /api/auth/me`
Returns current authenticated user profile. Requires Bearer Token.

---

## 2. Courses (`/api/courses`)

### `GET /api/courses`
Lists courses with SQL filtering and pagination.
- **Query Parameters**:
  - `search` (string): substring search on title or description
  - `category_id` (integer)
  - `level` (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`)
  - `status` (`DRAFT`, `PUBLISHED`, `ARCHIVED`)
  - `sort_by` (`newest`, `oldest`, `title`, `duration`)
  - `page` (integer, default 1)
  - `page_size` (integer, default 10)

### `GET /api/courses/{course_id}`
Returns detailed course information, syllabus modules, and enrolled student counts.

### `POST /api/courses`
Creates a course. Authorized to `TEACHER` and `ADMIN`.

### `PUT /api/courses/{course_id}`
Updates course attributes. Authorized to Course Owner or `ADMIN`.

### `PATCH /api/courses/{course_id}/publish`
Updates publication status. Authorized to Course Owner or `ADMIN`.

### `DELETE /api/courses/{course_id}`
Deletes course and associated modules/assignments. Authorized to Course Owner or `ADMIN`.

---

## 3. Enrollments (`/api/enrollments`)

### `POST /api/enrollments`
Enrolls student in course atomically within an ACID transaction.
- **Request Body**: `{"course_id": 1}`
- **Responses**: `201 Created`, `409 Conflict` (Duplicate enrollment).

### `GET /api/enrollments/my-courses`
Retrieves all courses currently enrolled by authenticated student.

### `GET /api/enrollments/course/{course_id}`
Returns roster of enrolled students. Authorized to Course Teacher or `ADMIN`.

### `PATCH /api/enrollments/{id}/progress`
Updates student progress (0.00% to 100.00%).

### `DELETE /api/enrollments/{id}`
Drops an enrollment. Authorized to Student or `ADMIN`.

---

## 4. Course Content & Syllabus (`/api/courses/{id}/content`, `/api/content/{id}`)

### `GET /api/courses/{course_id}/content`
Returns ordered syllabus modules.

### `POST /api/courses/{course_id}/content`
Adds lecture, article, video, or link module. Authorized to Teacher or `ADMIN`.

### `PUT /api/content/{id}` & `DELETE /api/content/{id}`
Modifies or removes syllabus module. Authorized to Teacher or `ADMIN`.

---

## 5. Coursework & Assignments (`/api/courses/{id}/assignments`, `/api/assignments/{id}`)

### `POST /api/courses/{course_id}/assignments`
Creates assignment with deadline and max marks.

### `GET /api/courses/{course_id}/assignments`
Lists coursework. When called by a student, embeds their submission status and grade.

### `PUT /api/assignments/{id}` & `DELETE /api/assignments/{id}`
Modifies or deletes coursework. Authorized to Course Teacher or `ADMIN`.

---

## 6. Submissions & Grading (`/api/assignments/{id}/submissions`, `/api/submissions/...`)

### `POST /api/assignments/{assignment_id}/submissions`
Submits student work. Evaluates submission time against deadline to set `SUBMITTED` or `LATE`.

### `GET /api/assignments/{assignment_id}/submissions`
Returns all student submissions for grading. Authorized to Course Teacher or `ADMIN`.

### `GET /api/submissions/my-submissions`
Student grade book and submission history.

### `PUT /api/submissions/{id}/grade`
Awards marks and feedback. Enforces `marks <= max_marks`.

---

## 7. Telemetry & Dashboards (`/api/dashboard`)

### `GET /api/dashboard/admin`
System-wide metrics: user counts, enrollment totals, course counts, recent registrations.

### `GET /api/dashboard/teacher`
Teacher metrics: assigned courses, student counts, pending submissions to grade, average grade.

### `GET /api/dashboard/student`
Student metrics: enrolled courses, course progress, pending deadlines, recent grades.
