-- Alerts are stored as free-text title/message (see backend/api/alerts.py
-- insert_alert), not translation keys, so the dashboard now looks them up by
-- their literal (English) text and falls back to the raw text if unknown.
-- Seed translations for known seeded/demo alert content.
INSERT INTO translations (`key`, locale, value) VALUES
('Appointment Reminder', 'fr', 'Rappel de rendez-vous'),
('Appointment Reminder', 'en', 'Appointment Reminder'),
('Your appointment is scheduled for tomorrow.', 'fr', 'Votre rendez-vous est prévu pour demain.'),
('Your appointment is scheduled for tomorrow.', 'en', 'Your appointment is scheduled for tomorrow.');
