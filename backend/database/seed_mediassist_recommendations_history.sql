-- Seeds the AI Analysis page's recommendations fallback (see
-- mediassist_service/app.py's recommendations_history route and
-- MediAssistChat.jsx's use of getRecommendationsHistory) so it has something
-- to show when the live LLM gateway call fails, without having to run a real
-- chat analysis first.
--
-- mediassist_recommendations.user_id is the plain numeric users.id
-- (mediassist_service decodes the frontend's signed "uid" token back into
-- this id before every query -- see app.py's _decode_user_id). Replace the
-- email below with the test account you want the fallback to show data for.

SET @user_id = (SELECT id FROM users WHERE email = 'PASTE_USER_EMAIL_HERE');
SET @session_id = 'seed-recommendations-history-demo';

INSERT INTO mediassist_recommendations (user_id, session_id, titre, detail, pourquoi, priorite, urgence, created_at) VALUES
(
  @user_id,
  @session_id,
  'Reduire votre apport en sodium',
  'Limitez les aliments transformes et le sel ajoute pendant deux semaines.',
  'Votre tension systolique (138 mmHg) est au-dessus de la normale.',
  'haute',
  'moderee',
  NOW()
),
(
  @user_id,
  @session_id,
  'Ameliorer votre hygiene de sommeil',
  'Visez 7 a 8 heures de sommeil regulier, sans ecrans avant le coucher.',
  'Vos episodes de fatigue coincident avec vos nuits de sommeil courtes signalees.',
  'moyenne',
  'moderee',
  NOW()
),
(
  @user_id,
  @session_id,
  'Surveiller votre hydratation quotidienne',
  'Buvez au moins 1,5 litre d''eau par jour, reparti tout au long de la journee.',
  'Une hydratation insuffisante peut aggraver les vertiges que vous avez signales.',
  'basse',
  'normale',
  NOW()
);
