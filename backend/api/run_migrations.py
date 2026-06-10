import os
from pathlib import Path
from datetime import datetime, timezone

import mysql.connector
from database import get_db_connection
from logger import get_logger

logger = get_logger(__name__)


MIGRATIONS_DIR = Path(__file__).resolve().parents[1] / "database" / "migrations"


def ensure_migrations_table(conn):
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            applied_at DATETIME NOT NULL
        )
        """
    )
    conn.commit()
    cursor.close()


def applied_migrations(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM migrations")
    rows = cursor.fetchall()
    cursor.close()
    return {r[0] for r in rows}


def apply_migration(conn, path: Path):
    sql = path.read_text(encoding="utf-8")
    cursor = conn.cursor()
    statements = [stmt.strip() for stmt in sql.split(";") if stmt.strip()]
    for stmt in statements:
        try:
            cursor.execute(stmt)
        except mysql.connector.errors.ProgrammingError as exc:
            # Ignore duplicate-column or duplicate-table errors when migrations are re-run
            if exc.errno in (1050, 1060):
                continue
            raise
    conn.commit()
    cursor.execute("INSERT INTO migrations (name, applied_at) VALUES (%s, %s)", (path.name, datetime.now(timezone.utc)))
    conn.commit()
    cursor.close()


if __name__ == "__main__":
    conn = get_db_connection()
    try:
        ensure_migrations_table(conn)
        applied = applied_migrations(conn)
        for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
            if path.name in applied:
                logger.info("Skipping already applied migration %s", path.name)
                continue
            logger.info("Applying migration %s", path.name)
            try:
                apply_migration(conn, path)
                logger.info("Applied migration %s", path.name)
            except Exception:
                logger.exception("Failed to apply migration %s", path.name)
                raise
    finally:
        conn.close()
        logger.info("Migration run completed")
