# Student LMS - Backend Service

High-performance, production-style Student Learning Management System backend built with **Python 3.11+**, **FastAPI**, **MySQL 8+**, and **parameterized RAW SQL**.

## Key Design Principles
- **Strictly No ORM**: Eliminates Django ORM, SQLAlchemy, and Prisma abstractions. All database queries are explicitly written in raw SQL with `%s` parameter substitution to guarantee 100% immunity to SQL injection.
- **Connection Pooling**: Managed connection leasing through `mysql.connector.pooling.MySQLConnectionPool` with automatic transaction management (commit on success, rollback on error).
- **Atomic ACID Transactions**: Multi-step workflows such as student course enrollment and grading are wrapped in strict transactional scopes.
- **Role-Based Access Control (RBAC)**: Secure JWT Bearer tokens carrying user roles (`ADMIN`, `TEACHER`, `STUDENT`) verified in backend FastAPI dependencies.
- **Normalized Relational Schema**: 3NF schema with foreign key constraints, `ON DELETE CASCADE` and `ON DELETE RESTRICT` semantics, and indexes.

## Architecture & Directory Structure
```
backend/
├── app/
│   ├── main.py            # App initialization, CORS, centralized exception handlers
│   ├── config.py          # Pydantic BaseSettings environment loader
│   ├── database.py        # Connection pooling, transaction context, raw SQL helpers
│   ├── auth/              # JWT issuance, bcrypt hashing, FastAPI dependencies
│   ├── users/             # User management service, schemas, and router
│   ├── categories/        # Course categories service, schemas, and router
│   ├── courses/           # Course catalog, search, pagination, and router
│   ├── enrollments/       # Student enrollment, transactions, and progress router
│   ├── content/           # Syllabus modules, video/doc resources, and router
│   ├── assignments/       # Coursework management, deadline validation, and router
│   ├── submissions/       # Student submissions, late calculation, and grading router
│   ├── dashboard/         # Aggregated metrics for Admin, Teacher, and Student
│   └── common/            # Custom exceptions, standard response envelopes, bcrypt
├── tests/                 # Comprehensive pytest test suite (27+ tests)
├── requirements.txt       # Production dependencies
├── .env.example           # Environment template
└── .env                   # Active environment configuration
```

## Running the Backend

### 1. Prerequisites
- Python 3.11+
- MySQL 8.0+ running on `localhost:3306`

### 2. Environment Setup
Create and activate a virtual environment:
```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Initialize Database
Create database and apply schema and seed data:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS student_lms;"
mysql -u root -p student_lms < ../database/schema.sql
mysql -u root -p student_lms < ../database/seed.sql
```

### 4. Start Development Server
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Root: `http://127.0.0.1:8000/`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc Documentation: `http://127.0.0.1:8000/redoc`

### 5. Run Test Suite
```bash
pytest tests -v
```
