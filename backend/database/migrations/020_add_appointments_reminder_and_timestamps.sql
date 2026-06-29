-- 020_add_appointments_reminder_and_timestamps.sql
-- The live appointments table predates reminder_days/reminder_sent/
-- created_at/updated_at being added to schema_appointments.sql (same drift
-- pattern fixed for doctors.location/availability in migration 017) --
-- confirmed missing via DESCRIBE appointments. add_appointment,
-- update_appointment and send_appointment_reminders all read/write these
-- columns, so appointment creation fails without them.

ALTER TABLE appointments ADD COLUMN reminder_days INT NOT NULL DEFAULT 1;
ALTER TABLE appointments ADD COLUMN reminder_sent TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE appointments ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE appointments ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
