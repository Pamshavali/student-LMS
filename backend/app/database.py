import logging
from contextlib import contextmanager
from typing import Any, Dict, Generator, List, Optional, Tuple

import mysql.connector
from mysql.connector import Error, errorcode, pooling
from app.config import settings

logger = logging.getLogger("student_lms.database")
logging.basicConfig(level=logging.INFO)

# Global Connection Pool reference
_pool: Optional[pooling.MySQLConnectionPool] = None


def init_connection_pool() -> pooling.MySQLConnectionPool:
    """
    Initializes a thread-safe MySQL connection pool using mysql.connector.pooling.
    This prevents creating unmanaged individual connections per request.
    """
    global _pool
    if _pool is None:
        try:
            logger.info("Initializing MySQL Connection Pool: %s (Size: %d)", settings.DB_POOL_NAME, settings.DB_POOL_SIZE)
            _pool = pooling.MySQLConnectionPool(
                pool_name=settings.DB_POOL_NAME,
                pool_size=settings.DB_POOL_SIZE,
                pool_reset_session=True,
                host=settings.DB_HOST,
                port=settings.DB_PORT,
                user=settings.DB_USER,
                password=settings.DB_PASSWORD,
                database=settings.DB_NAME,
                autocommit=False,  # Enforce explicit transaction control
            )
            logger.info("MySQL Connection Pool initialized successfully.")
        except Error as err:
            logger.critical("Failed to initialize MySQL Connection Pool: %s", err)
            raise
    return _pool


def get_pool() -> pooling.MySQLConnectionPool:
    global _pool
    if _pool is None:
        return init_connection_pool()
    return _pool


@contextmanager
def get_db_connection() -> Generator[mysql.connector.connection.MySQLConnection, None, None]:
    """
    Context manager that leases a connection from the pool.
    Commits on successful completion; rolls back on unhandled exceptions;
    and ensures the connection is returned to the pool in the finally block.
    """
    pool = get_pool()
    conn = None
    try:
        conn = pool.get_connection()
        yield conn
        conn.commit()
    except Exception as exc:
        if conn and conn.is_connected():
            conn.rollback()
            logger.warning("Database transaction rolled back due to error: %s", exc)
        raise exc
    finally:
        if conn and conn.is_connected():
            conn.close()


@contextmanager
def get_db_cursor(dictionary: bool = True) -> Generator[Tuple[Any, Any], None, None]:
    """
    Context manager providing both the managed connection and an active cursor.
    Defaults to dictionary=True so rows can be serialized cleanly into Pydantic models.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor(dictionary=dictionary)
        try:
            yield conn, cursor
        finally:
            cursor.close()


# -----------------------------------------------------------------------------
# RAW SQL QUERY EXECUTION HELPERS
# Every query uses parameter markers (%s) to guarantee SQL injection immunity.
# -----------------------------------------------------------------------------

def fetch_one(query: str, params: Optional[Tuple[Any, ...]] = None) -> Optional[Dict[str, Any]]:
    """
    Executes a RAW SQL query and fetches a single record as a dictionary.
    """
    with get_db_cursor(dictionary=True) as (_, cursor):
        cursor.execute(query, params or ())
        row = cursor.fetchone()
        return dict(row) if row else None


def fetch_all(query: str, params: Optional[Tuple[Any, ...]] = None) -> List[Dict[str, Any]]:
    """
    Executes a RAW SQL query and fetches all matching records as a list of dictionaries.
    """
    with get_db_cursor(dictionary=True) as (_, cursor):
        cursor.execute(query, params or ())
        rows = cursor.fetchall()
        return [dict(r) for r in rows] if rows else []


def execute_query(query: str, params: Optional[Tuple[Any, ...]] = None) -> int:
    """
    Executes an INSERT, UPDATE, or DELETE raw SQL statement.
    Returns the lastrowid (for INSERT) or rowcount (for UPDATE/DELETE).
    """
    with get_db_cursor(dictionary=True) as (conn, cursor):
        cursor.execute(query, params or ())
        if cursor.lastrowid:
            return cursor.lastrowid
        return cursor.rowcount


def check_db_health() -> bool:
    """
    Quick ping used in health checks and startup validation.
    """
    try:
        row = fetch_one("SELECT 1 AS alive;")
        return bool(row and row.get("alive") == 1)
    except Exception as e:
        logger.error("Database health check failed: %s", e)
        return False
