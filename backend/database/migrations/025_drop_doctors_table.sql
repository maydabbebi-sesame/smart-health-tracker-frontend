-- All doctors now live in external_doctors (see migration 024), so
-- appointments only ever needs the one FK. Drop the platform-only
-- doctor_id/doctor_source columns and promote external_doctor_id to be
-- "the" doctor_id, then drop the now-unused doctors table.
ALTER TABLE appointments DROP FOREIGN KEY appointments_ibfk_2;
ALTER TABLE appointments DROP COLUMN doctor_id;
ALTER TABLE appointments CHANGE COLUMN external_doctor_id doctor_id INT NOT NULL;
ALTER TABLE appointments DROP COLUMN doctor_source;
ALTER TABLE appointments CHANGE COLUMN external_doctor_name doctor_name VARCHAR(255) NULL;
ALTER TABLE appointments CHANGE COLUMN external_doctor_specialization doctor_specialization VARCHAR(255) NULL;
ALTER TABLE appointments CHANGE COLUMN external_doctor_location doctor_location VARCHAR(255) NULL;

DROP TABLE doctors;
