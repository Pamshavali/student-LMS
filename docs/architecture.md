# Architecture & System Design
**Student Learning Management System (Student LMS)**

## 1. System Overview
The Student LMS is an enterprise-grade full-stack web application designed for universities and online academies. It provides an intuitive, responsive React single-page application (SPA) backed by a high-throughput, asynchronous FastAPI service connected directly to MySQL 8.0 through parameterized RAW SQL.

```
[ Client Browser (React + Vite) ]
                |
           REST / JSON (HTTPS / JWT Bearer)
                v
  [ FastAPI Web Server (Uvicorn) ]
   ├── Authentication & RBAC Dependencies
   ├── Centralized Exception & Validation Handlers
   ├── Business Logic Services (Raw SQL Queries)
   └── Thread-Safe Connection Pool (mysql.connector.pooling)
                |
         Parameterized SQL (%s)
                v
   [ MySQL 8.0 Relational Database (InnoDB) ]
   ├── Tables (Users, Categories, Courses, Enrollments, Content, Assignments, Submissions)
   ├── Foreign Keys (CASCADE / RESTRICT)
   └── Secondary B-Tree Indexes
```

---

## 2. Core Architectural Principles

### 1. RAW SQL Without ORM Overhead
- Eliminates the query-generation overhead, memory bloat, and "N+1 query problems" common to heavyweight ORMs.
- Demonstrates deep mastery of ANSI SQL, multi-table joins, subqueries, aggregations, and window functions.
- Prevents SQL Injection through parameter markers (`%s`), delegating escaping and type checking directly to the database driver.

### 2. Thread-Safe Connection Pooling
- Instead of allocating expensive new TCP sockets per request, database connections are managed via a pool (`MySQLConnectionPool`).
- Connections are leased per transaction scope, automatically committed on success, rolled back on exceptions, and returned cleanly to the pool.

### 3. Strict Layered Separation of Concerns
```
frontend/
└── React Components -> Custom Hooks -> Axios API Services

backend/
└── Routers (FastAPI) -> Auth/RBAC Dependencies -> Services (SQL Execution) -> Database Pool
```
- **Routers**: Validate request schema via Pydantic, enforce role checks, and serialize JSON responses.
- **Services**: Formulate explicit raw SQL queries, manage transaction lifecycles, and process relational datasets.
- **Database Module**: Handles connection leasing, cursor lifecycles, error translation, and pool health.

---

## 3. Authentication & Role-Based Access Control (RBAC)

### Token Issuance Flow
1. User submits credentials to `POST /api/auth/login`.
2. Backend queries user record with RAW SQL: `SELECT * FROM users WHERE email = %s`.
3. Verifies password against bcrypt hash using `bcrypt.checkpw()`.
4. Issues a cryptographically signed HMAC-SHA256 JWT containing:
   - `sub`: User ID
   - `email`: User email
   - `role`: `ADMIN`, `TEACHER`, or `STUDENT`
   - `exp`: 24-hour expiration timestamp
5. Frontend persists token in `localStorage` and automatically attaches it to subsequent requests via Axios request interceptors.

### Role Authorization Matrix

| Resource / Action | ADMIN | TEACHER | STUDENT | ANONYMOUS |
|---|:---:|:---:|:---:|:---:|
| Browse Published Courses | Yes | Yes | Yes | Yes |
| View Course Modules & Details | Yes | Yes | If Enrolled | Restricted |
| Register / Login | Yes | Yes | Yes | Yes |
| Create Course | Yes | Yes (Self) | No | No |
| Update Course | Yes | If Owner | No | No |
| Delete Course | Yes | If Owner | No | No |
| Publish / Archive Course | Yes | If Owner | No | No |
| Manage Categories | Yes | Read Only | Read Only | Read Only |
| Enroll in Courses | Yes | No | Yes | No |
| Submit Coursework | No | No | Yes (If Enrolled) | No |
| Grade Submissions | Yes | If Course Owner | No | No |
| Manage Users & Roles | Yes | No | No | No |
| Access Admin Telemetry | Yes | No | No | No |
