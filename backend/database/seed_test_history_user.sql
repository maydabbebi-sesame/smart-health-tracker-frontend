-- Test user for the Historique medical feature.
-- Email: history.test@example.com / Password: Test1234!
-- Already verified (is_verified = 1) so login works immediately, no email step needed.

INSERT INTO users (name, email, password, role, is_verified)
VALUES (
  'History Test',
  'history.test@example.com',
  'scrypt:32768:8:1$iCsyKdJSR8LMzMyJ$1a157fc4a2df05db7283b6f4e8e4b8cca7ae833f024f231b1548ab0b0a62fb65a0ac82ea1945990f4704d0940d7d4b88300766dc9e6f0c3562d275f2e56ae1fc',
  'user',
  1
);

SET @uid = LAST_INSERT_ID();

-- Aujourd'hui (visible dans Semaine / Mois / 3 mois)
INSERT INTO vitals (user_id, heart_rate, systolic_bp, diastolic_bp, temperature, oxygen_saturation,
                     respiratory_rate, weight, symptoms, pain_intensity, general_state, recorded_at)
VALUES (@uid, 78, 120, 80, 37.0, 98, 16, 70.5, 'Fatigue legere', 2, 'Bon', NOW());

-- Il y a 3 jours (visible dans Semaine / Mois / 3 mois)
INSERT INTO vitals (user_id, heart_rate, systolic_bp, diastolic_bp, temperature, oxygen_saturation,
                     respiratory_rate, weight, symptoms, pain_intensity, general_state, recorded_at)
VALUES (@uid, 88, 135, 88, 37.8, 96, 18, 71.0, 'Maux de tete, Vertiges', 5, 'Moyen', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- Il y a 20 jours (visible dans Mois / 3 mois, PAS dans Semaine)
INSERT INTO vitals (user_id, heart_rate, systolic_bp, diastolic_bp, temperature, oxygen_saturation,
                     respiratory_rate, weight, symptoms, pain_intensity, general_state, recorded_at)
VALUES (@uid, 95, 142, 91, 38.2, 94, 20, 72.3, 'Fievre, Toux', 6, 'Mauvais', DATE_SUB(NOW(), INTERVAL 20 DAY));

-- Il y a 60 jours (visible dans 3 mois SEULEMENT)
INSERT INTO vitals (user_id, heart_rate, systolic_bp, diastolic_bp, temperature, oxygen_saturation,
                     respiratory_rate, weight, symptoms, pain_intensity, general_state, recorded_at)
VALUES (@uid, 72, 118, 76, 36.6, 99, 14, 69.8, NULL, NULL, 'Bon', DATE_SUB(NOW(), INTERVAL 60 DAY));

-- Il y a 150 jours (INVISIBLE dans tous les filtres -- sert a tester le cas "aucune donnee")
INSERT INTO vitals (user_id, heart_rate, systolic_bp, diastolic_bp, temperature, oxygen_saturation,
                     respiratory_rate, weight, symptoms, pain_intensity, general_state, recorded_at)
VALUES (@uid, 80, 122, 79, 36.9, 97, 15, 70.0, 'Controle de routine', 1, 'Bon', DATE_SUB(NOW(), INTERVAL 150 DAY));
