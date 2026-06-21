-- 013_add_user_status_and_audit_fields.sql
-- Migration: add account status (enable/disable), token versioning (used to
-- force-invalidate a user's existing sessions when an admin regenerates their
-- token or disables their account), and a created_at audit column needed by
-- the admin user-management UI.
--
-- One ALTER TABLE statement per column on purpose: run_migrations.py only
-- skips duplicate-column errors (1060) per individual statement. A single
-- combined ALTER TABLE with multiple ADD COLUMN clauses fails atomically if
-- any one column already exists, silently dropping the others too.

ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
