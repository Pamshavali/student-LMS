import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.assignments.router import router as assignments_router
from app.auth.auth import router as auth_router
from app.categories.router import router as categories_router
from app.common.exceptions import AppException
from app.common.responses import error_response, success_response
from app.config import settings
from app.content.router import router as content_router
from app.courses.router import router as courses_router
from app.dashboard.router import router as dashboard_router
from app.database import check_db_health, init_connection_pool
from app.enrollments.router import router as enrollments_router
from app.submissions.router import router as submissions_router
from app.users.router import router as users_router

logger = logging.getLogger("student_lms.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Initializes database connection pool and verifies connectivity on startup.
    """
    logger.info("Initializing Student LMS application...")
    try:
        init_connection_pool()
        if check_db_health():
            logger.info("MySQL Database connection verified and healthy.")
        else:
            logger.error("Database health check did not return expected value.")
    except Exception as e:
        logger.critical("Failed to connect to MySQL on application startup: %s", e)
    yield
    logger.info("Shutting down Student LMS application.")


app = FastAPI(
    title="Student Learning Management System (Student LMS) API",
    description="""
    ## Production-Style Student Learning Management System API
    Built with **Python 3.11+**, **FastAPI**, **MySQL 8+**, and **RAW SQL**.
    
    ### Key Architectural Highlights:
    * **Zero ORM Overhead**: All database queries are executed using parameterized RAW SQL (`%s`) preventing SQL injection.
    * **ACID Transactions**: Transaction-managed workflows (e.g. atomic enrollments and grading).
    * **Role-Based Access Control (RBAC)**: Enforced across `ADMIN`, `TEACHER`, and `STUDENT` roles.
    * **Normalized MySQL Schema**: Normalized 3NF architecture with foreign keys, ON DELETE cascades, and B-Tree indexes.
    * **JWT Authentication**: Cryptographically signed bearer tokens with bcrypt password hashing.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# -----------------------------------------------------------------------------
# CORS CONFIGURATION
# -----------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# CENTRALIZED ERROR HANDLERS (Section 18)
# Returns consistent JSON payload: { success: false, message: ..., status_code: ... }
# -----------------------------------------------------------------------------
@app.exception_handler(AppException)
async def custom_app_exception_handler(_: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(
            message=exc.message,
            status_code=exc.status_code,
            errors=exc.errors
        ),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    error_details = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err["loc"] if loc != "body"])
        error_details.append({"field": field, "message": err["msg"]})
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response(
            message="Validation error in request payload.",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            errors=error_details,
        ),
    )


@app.exception_handler(Exception)
async def global_exception_handler(_: Request, exc: Exception):
    logger.exception("Unhandled Server Exception: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response(
            message="An unexpected internal server error occurred.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        ),
    )


# -----------------------------------------------------------------------------
# SYSTEM HEALTH & ROOT ENDPOINTS
# -----------------------------------------------------------------------------
@app.get("/", tags=["Health"])
def root():
    return success_response(
        data={"app": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/docs"},
        message="Welcome to the Student Learning Management System API."
    )


@app.get("/api/health", tags=["Health"])
def health_check():
    db_alive = check_db_health()
    return success_response(
        data={"status": "healthy" if db_alive else "degraded", "database": "connected" if db_alive else "disconnected"},
        message="System health status retrieved."
    )


# -----------------------------------------------------------------------------
# MOUNT ROUTERS
# -----------------------------------------------------------------------------
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(users_router, prefix=settings.API_PREFIX)
app.include_router(categories_router, prefix=settings.API_PREFIX)
app.include_router(courses_router, prefix=settings.API_PREFIX)
app.include_router(enrollments_router, prefix=settings.API_PREFIX)
app.include_router(content_router, prefix=settings.API_PREFIX)
app.include_router(assignments_router, prefix=settings.API_PREFIX)
app.include_router(submissions_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX)
