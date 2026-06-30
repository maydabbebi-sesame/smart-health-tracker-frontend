-- Seeds a handful of external_doctors rows (see
-- backend/database/migrations/004_add_external_doctors.sql) so the Doctor
-- Agent has scraped-style directory entries to recommend. source_url is
-- UNIQUE, so re-running this script is safe -- duplicates are skipped.

INSERT INTO external_doctors (source, source_url, name, specialization, location, phone, scraped_at, lat, lng)
VALUES
  ('med.tn', 'https://www.med.tn/medecin/amel-trabelsi-cardiologue-tunis', 'Dr. Amel Trabelsi', 'Cardiologie', 'Tunis', '+216 71 000 001', NOW(), 36.8065000, 10.1815000),
  ('med.tn', 'https://www.med.tn/medecin/karim-bouazizi-dermatologue-sousse', 'Dr. Karim Bouazizi', 'Dermatologie', 'Sousse', '+216 73 000 002', NOW(), 35.8254000, 10.6360000),
  ('med.tn', 'https://www.med.tn/medecin/sana-jaziri-pediatre-sfax', 'Dr. Sana Jaziri', 'Pediatrie', 'Sfax', '+216 74 000 003', NOW(), 34.7406000, 10.7603000),
  ('med.tn', 'https://www.med.tn/medecin/mehdi-gharbi-generaliste-ariana', 'Dr. Mehdi Gharbi', 'Medecine generale', 'Ariana', '+216 71 000 004', NOW(), 36.8625000, 10.1956000),
  ('med.tn', 'https://www.med.tn/medecin/lobna-khedher-gynecologue-nabeul', 'Dr. Lobna Khedher', 'Gynecologie', 'Nabeul', '+216 72 000 005', NOW(), 36.4561000, 10.7376000),
  ('med.tn', 'https://www.med.tn/medecin/walid-saidi-orthopediste-bizerte', 'Dr. Walid Saidi', 'Orthopedie', 'Bizerte', '+216 72 000 006 / +216 72 000 016', NOW(), 37.2746000, 9.8739000)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  specialization = VALUES(specialization),
  location = VALUES(location),
  phone = VALUES(phone),
  scraped_at = VALUES(scraped_at),
  lat = VALUES(lat),
  lng = VALUES(lng);
