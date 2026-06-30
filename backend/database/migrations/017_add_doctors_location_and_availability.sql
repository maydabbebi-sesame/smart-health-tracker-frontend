-- 017_add_doctors_location_and_availability.sql
-- The doctors table was created before location/availability were added to
-- schema_doctors.sql -- the live table is missing both columns even though
-- the schema file already declares them (confirmed via DESCRIBE doctors).
-- location is the free-text address/city shown in the doctor directory;
-- availability stores a JSON-encoded list of slots (see backend/api/doctors.py's
-- get_doctor_availability / add_doctor).

ALTER TABLE doctors ADD COLUMN location VARCHAR(255) DEFAULT '' AFTER specialization;
ALTER TABLE doctors ADD COLUMN availability TEXT DEFAULT NULL;
