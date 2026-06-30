-- Seeds a MediAssist assistant turn so the dashboard's "Recommandation IA"
-- card (see mediassist_service/app.py's latest_recommendation route) has
-- something to display without having to run a real chat analysis first.
--
-- mediassist_history.user_id is the plain numeric users.id (mediassist_service
-- decodes the frontend's signed "uid" token back into this id before every
-- query -- see app.py's _decode_user_id). Replace the email below with the
-- test account you want the dashboard card to show data for.

SET @user_id = (SELECT id FROM users WHERE email = 'PASTE_USER_EMAIL_HERE');
SET @session_id = 'seed-recommendations-demo';

INSERT INTO mediassist_history (user_id, session_id, role, content, created_at) VALUES
(
  @user_id,
  @session_id,
  'user',
  'Analyse mes donnees et donne-moi tes recommandations.',
  NOW()
),
(
  @user_id,
  @session_id,
  'assistant',
  '{"urgence":"moderee","alertes":[],"resume_situation":"Tension arterielle legerement elevee et qualite de sommeil a surveiller.","analyse":"Votre derniere mesure de tension arterielle (138/89 mmHg) associee a une frequence cardiaque de repos elevee (92 bpm) suggere un stress cardiovasculaire a surveiller. Vos episodes de fatigue recurrente pourraient etre lies a une qualite de sommeil insuffisante.","recommandations":[{"titre":"Reduire votre apport en sodium","detail":"Limitez les aliments transformes et le sel ajoute pendant deux semaines.","pourquoi":"Votre tension systolique (138 mmHg) est au-dessus de la normale.","priorite":"haute"},{"titre":"Ameliorer votre hygiene de sommeil","detail":"Visez 7 a 8 heures de sommeil regulier, sans ecrans avant le coucher.","pourquoi":"Vos episodes de fatigue coincident avec vos nuits de sommeil courtes signalees.","priorite":"moyenne"}],"orientation":{"niveau":"medecin_generaliste","specialite":null,"raison":"Suivi de la tension arterielle recommande dans les prochaines semaines.","delai":"deux semaines"},"disclaimer":"Ces informations sont indicatives et ne remplacent pas une consultation medicale."}',
  NOW()
);
