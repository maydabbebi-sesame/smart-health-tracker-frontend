-- Copy every platform doctor into external_doctors (source='platform') and
-- repoint the appointments that referenced doctors.id at the new row, via
-- the email these doctors share (doctors.email is UNIQUE NOT NULL on both
-- sides, so it is a safe join key now while both tables still exist).
INSERT INTO external_doctors (source, name, email, specialization, location, phone, bio, availability, scraped_at)
SELECT 'platform', d.name, d.email, d.specialization, d.location, d.phone, d.bio, d.availability, NOW()
FROM doctors d
WHERE NOT EXISTS (
    SELECT 1 FROM external_doctors e WHERE e.email = d.email
);

UPDATE appointments a
JOIN doctors d ON a.doctor_id = d.id
JOIN external_doctors e ON e.email = d.email
SET a.external_doctor_id = e.id,
    a.doctor_source = 'platform'
WHERE a.doctor_id IS NOT NULL;
