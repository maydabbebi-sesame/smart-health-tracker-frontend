-- Seeds a doctor and a couple of upcoming appointments so the dashboard's
-- "Prochains rendez-vous" card (see src/services/dashboardService.js) has
-- something to display. All doctors live in external_doctors --
-- appointments.doctor_id is a foreign key into it, so a doctor row has to
-- exist first.
--
-- Replace the email below with the test account you want the dashboard to
-- show appointments for.

SET @user_id = (SELECT id FROM users WHERE email = 'PASTE_USER_EMAIL_HERE');

INSERT INTO external_doctors (source, name, specialization, location, email, phone, bio, availability, scraped_at)
VALUES (
  'platform',
  'Dr. Amel Trabelsi',
  'Cardiologie',
  'Tunis',
  'amel.trabelsi@example.com',
  '+216 71 000 000',
  'Cardiologue avec 12 ans d''experience, specialisee dans le suivi de l''hypertension.',
  '["Lundi 09:00-12:00","Mercredi 14:00-17:00","Vendredi 09:00-12:00"]',
  NOW()
)
ON DUPLICATE KEY UPDATE id = id;

SET @doctor_id = (SELECT id FROM external_doctors WHERE email = 'amel.trabelsi@example.com');

-- Dans 3 jours, statut "scheduled" (en attente de confirmation)
INSERT INTO appointments (user_id, doctor_id, appointment_date, appointment_time, reason, status)
VALUES (@user_id, @doctor_id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:30:00', 'Controle de tension arterielle', 'scheduled');

-- Dans 10 jours, statut "confirmed"
INSERT INTO appointments (user_id, doctor_id, appointment_date, appointment_time, reason, status)
VALUES (@user_id, @doctor_id, DATE_ADD(CURDATE(), INTERVAL 10 DAY), '15:00:00', 'Suivi cardiologique de routine', 'confirmed');
