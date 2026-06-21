-- 011_add_user_health_and_prefs_fields.sql
-- Migration: add a static "current profile" health snapshot (separate from the
-- time-series vitals table) plus a notifications preference, to users.
--
-- One ALTER TABLE statement per column on purpose: run_migrations.py only
-- skips duplicate-column errors (1060) per individual statement. A single
-- combined ALTER TABLE with multiple ADD COLUMN clauses fails atomically if
-- any one column already exists, silently dropping the others too.

ALTER TABLE users ADD COLUMN age INT DEFAULT NULL;
ALTER TABLE users ADD COLUMN weight FLOAT DEFAULT NULL;
ALTER TABLE users ADD COLUMN height INT DEFAULT NULL;
ALTER TABLE users ADD COLUMN blood_group VARCHAR(10) DEFAULT NULL;
ALTER TABLE users ADD COLUMN notifications_enabled TINYINT(1) NOT NULL DEFAULT 1;
