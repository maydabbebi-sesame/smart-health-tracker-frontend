-- Per-service MySQL accounts with table/column-level GRANTs.
-- All services still point at the same `smarthealth` schema/instance (see
-- the migration plan's "keep one shared DB for now" decision), but each
-- service now connects with its own narrowly-scoped user instead of the
-- single all-access `smarthealth` account every blueprint used to share --
-- so "no service reaches into another's tables" is enforced by MySQL
-- itself, not just by convention.
--
-- `users` is the one table genuinely co-owned: auth-service writes
-- credential/security fields (password, mfa_*, token_version, ...) and
-- users-service writes profile fields (name, phone, ...) and both can
-- create/delete rows (register vs. admin user management) -- a clean split
-- would need a separate auth/profile table, which is out of scope here.
-- Every other service only gets a column-level SELECT on `users` for the
-- two things it actually needs: the token_required revocation check
-- (is_active, token_version) and, where applicable, a name/email to put in
-- a notification.

CREATE USER IF NOT EXISTS 'auth_svc'@'%' IDENTIFIED BY 'auth_svc_pw_2026';
GRANT SELECT, INSERT, UPDATE, DELETE ON smarthealth.users TO 'auth_svc'@'%';

CREATE USER IF NOT EXISTS 'users_svc'@'%' IDENTIFIED BY 'users_svc_pw_2026';
GRANT SELECT, INSERT, UPDATE, DELETE ON smarthealth.users TO 'users_svc'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON smarthealth.medical_history TO 'users_svc'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON smarthealth.vaccinations TO 'users_svc'@'%';
GRANT SELECT ON smarthealth.translations TO 'users_svc'@'%';

CREATE USER IF NOT EXISTS 'healthdata_svc'@'%' IDENTIFIED BY 'healthdata_svc_pw_2026';
GRANT SELECT, INSERT, UPDATE, DELETE ON smarthealth.vitals TO 'healthdata_svc'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON smarthealth.forms TO 'healthdata_svc'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON smarthealth.alerts TO 'healthdata_svc'@'%';
GRANT SELECT (id, name, email, is_active, token_version) ON smarthealth.users TO 'healthdata_svc'@'%';

CREATE USER IF NOT EXISTS 'doctorsappt_svc'@'%' IDENTIFIED BY 'doctorsappt_svc_pw_2026';
GRANT SELECT, INSERT, UPDATE, DELETE ON smarthealth.external_doctors TO 'doctorsappt_svc'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON smarthealth.doctor_ratings TO 'doctorsappt_svc'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON smarthealth.appointments TO 'doctorsappt_svc'@'%';
GRANT SELECT, INSERT, UPDATE ON smarthealth.health_centers TO 'doctorsappt_svc'@'%';
GRANT SELECT (id, name, email, is_active, token_version) ON smarthealth.users TO 'doctorsappt_svc'@'%';

CREATE USER IF NOT EXISTS 'mediassist_svc'@'%' IDENTIFIED BY 'mediassist_svc_pw_2026';
GRANT SELECT, INSERT, UPDATE, DELETE ON smarthealth.mediassist_history TO 'mediassist_svc'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON smarthealth.mediassist_recommendations TO 'mediassist_svc'@'%';
GRANT SELECT (id, is_active, token_version) ON smarthealth.users TO 'mediassist_svc'@'%';

FLUSH PRIVILEGES;
