-- 019_add_external_doctor_to_appointments.sql
-- Lets a patient book an appointment with a scraped external_doctors entry
-- (no platform account, so no doctor_id/email to FK against). doctor_id
-- becomes nullable and a parallel external_doctor_id + name/specialization/
-- location snapshot is stored instead, so the appointment stays displayable
-- even if the scraped row later changes or disappears.

ALTER TABLE appointments MODIFY COLUMN doctor_id INT NULL;

ALTER TABLE appointments ADD COLUMN external_doctor_id INT NULL AFTER doctor_id;
ALTER TABLE appointments ADD COLUMN doctor_source VARCHAR(20) NOT NULL DEFAULT 'platform' AFTER external_doctor_id;
ALTER TABLE appointments ADD COLUMN external_doctor_name VARCHAR(255) NULL AFTER doctor_source;
ALTER TABLE appointments ADD COLUMN external_doctor_specialization VARCHAR(255) NULL AFTER external_doctor_name;
ALTER TABLE appointments ADD COLUMN external_doctor_location VARCHAR(255) NULL AFTER external_doctor_specialization;

ALTER TABLE appointments
    ADD CONSTRAINT fk_appointments_external_doctor
    FOREIGN KEY (external_doctor_id) REFERENCES external_doctors(id);
