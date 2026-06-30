-- Replace the "Confidentiality" preferences card with a health summary card
-- (BMI + blood group) computed from the patient's profile data.
INSERT INTO translations (`key`, locale, value) VALUES
('profile.preferences.healthSummaryTitle', 'fr', 'Résumé santé'),
('profile.preferences.healthSummaryTitle', 'en', 'Health summary'),
('profile.preferences.healthSummaryText', 'fr', 'IMC estimé : {{bmi}} - Groupe sanguin : {{bloodGroup}}.'),
('profile.preferences.healthSummaryText', 'en', 'Estimated BMI: {{bmi}} - Blood group: {{bloodGroup}}.'),
('profile.preferences.healthSummaryEmpty', 'fr', 'Complétez votre poids et votre taille pour afficher votre IMC.'),
('profile.preferences.healthSummaryEmpty', 'en', 'Complete your weight and height to display your BMI.');
