# Seeding the Dockerized MySQL container

The repo's migration history (`backend/database/schema_*.sql` +
`migrations/*.sql`) isn't a clean linear replay from an empty database --
some `schema_*.sql` baseline files declare foreign keys to tables that are
only created by a *later-numbered* migration (e.g. `schema_appointments.sql`
references `external_doctors`, which migration `004` creates), and at least
one migration (`016_mediassist_history_user_id.sql`) re-declares and then
alters a table a `schema_*.sql` file also creates. Replaying every file in
numeric order against a brand-new empty database is not guaranteed to work,
and there's no way to verify it inside this sandbox (no Docker available
here).

Instead, this directory seeds the Dockerized `mysql` service from a **dump of
your already-working local database** -- the standard, safe pattern for
containerizing an existing app's database, and the one MySQL's own Docker
image supports natively via `docker-entrypoint-initdb.d`.

## One-time setup

1. Make sure your local MySQL (the one `backend/api/.env` already points at)
   is fully migrated: `cd backend/api && python run_migrations.py`.
2. Dump it:
   ```bash
   mysqldump -u smarthealth -p smarthealth > backend/database/docker-init/01-dump.sql
   ```
3. That file is git-ignored (`backend/database/docker-init/*dump*.sql`) since
   it contains real user data -- it stays local, never committed.
4. `docker compose up` will then run `01-dump.sql` (your data) followed by
   `02-create-service-db-users.sql` (the per-service MySQL accounts +
   GRANTs, same as `migrations/026_create_service_db_users.sql`) the first
   time the `mysql` volume is created.

If you'd rather start from an empty database, write your own `01-dump.sql`
that runs `schema_*.sql` and `migrations/*.sql` in an order you've verified
works, or seed it by hand after `docker compose up` instead.
