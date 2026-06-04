// ── IMC ───────────────────────────────────────────────────────────────────────
function calcIMC(weight, height) {
  if (!weight || !height) return { imc: 'N/R', categorie: 'Non renseigne' }
  const v = Number(weight) / (Number(height) / 100) ** 2
  let categorie
  if (v < 18.5)      categorie = 'Insuffisance ponderale'
  else if (v < 25)   categorie = 'Poids normal'
  else if (v < 30)   categorie = 'Surpoids'
  else if (v < 35)   categorie = 'Obesite classe I'
  else if (v < 40)   categorie = 'Obesite classe II'
  else               categorie = 'Obesite classe III'
  return { imc: v.toFixed(1), categorie }
}

// ── Catégorie tension ─────────────────────────────────────────────────────────
function categorieTension(sys, dia) {
  if (!sys || !dia) return 'Non mesuree'
  const s = Number(sys), d = Number(dia)
  if (s >= 180 || d >= 120) return 'HTA grade 3 - crise hypertensive'
  if (s >= 140 || d >= 90)  return 'HTA grade 2'
  if (s >= 130 || d >= 80)  return 'HTA grade 1'
  if (s >= 120)             return 'Tension elevee'
  return 'Normale'
}

// ── Remplacement des placeholders ─────────────────────────────────────────────
function fillTemplate(template, vars) {
  let result = template
  for (const [key, val] of Object.entries(vars)) {
    result = result.replaceAll(key, val ?? 'N/R')
  }
  return result
}

// ── Construction des variables patient ───────────────────────────────────────
function buildVars(p) {
  const { imc, categorie: categorieImc } = calcIMC(p.weight, p.height)
  const catTension = categorieTension(p.bloodPressureSys, p.bloodPressureDia)

  const allergies = p.hasDrugAllergies === 'Oui'
    ? (p.drugAllergies || 'Non precisees')
    : 'Aucune allergie connue'

  const medicaments = p.hasCurrentMedications === 'Oui'
    ? (p.currentMedications || 'Non precises')
    : 'Aucun traitement en cours'

  const complements = p.hasSupplements === 'Oui'
    ? (p.supplements || 'Non precises')
    : 'Aucun'

  const tabac = p.tobacco === 'Oui'
    ? `Oui (${p.tobaccoQuantity || 'quantite non precisee'})`
    : 'Non'

  const alcool = p.alcohol === 'Oui'
    ? `Oui (${p.alcoholQuantity || 'frequence non precisee'})`
    : 'Non'

  const allSymptoms = [
    ...(p.symptoms || []),
    ...(p.otherSymptoms ? [p.otherSymptoms] : []),
  ].join(', ') || 'Non renseignes'

  return {
    '{allergies}':           allergies,
    '{medicaments}':         medicaments,
    '{complements}':         complements,
    '{observance}':          p.treatmentAdherence || 'Non renseignee',
    '{maladies_chroniques}': p.chronicDiseases?.join(', ') || 'Aucune',
    '{antecedents_familiaux}': p.familyHistory?.length ? p.familyHistory.join(', ') : 'Non renseignes',
    '{tabac}':               tabac,
    '{alcool}':              alcool,
    '{age}':                 String(p.age || 'N/R'),
    '{sexe}':                p.biologicalSex || 'N/R',
    '{poids}':               String(p.weight || 'N/R'),
    '{taille}':              String(p.height || 'N/R'),
    '{imc}':                 imc,
    '{categorie_imc}':       categorieImc,
    '{grossesse}':           p.pregnancyStatus || 'N/A',
    '{tension_sys}':         String(p.bloodPressureSys || 'N/R'),
    '{tension_dia}':         String(p.bloodPressureDia || 'N/R'),
    '{categorie_tension}':   catTension,
    '{fc}':                  String(p.heartRate || 'N/R'),
    '{spo2}':                String(p.spo2 || 'N/R'),
    '{temperature}':         String(p.temperature || 'N/R'),
    '{glycemie}':            p.glycemia ? String(p.glycemia) : 'N/R',
    '{variation_poids}':     p.weightVariation || 'Non renseignee',
    '{symptomes}':           allSymptoms,
    '{intensite}':           String(p.painIntensity ?? 'N/R'),
    '{duree}':               p.symptomDuration || 'Non renseignee',
    '{localisation}':        p.painLocation?.join(', ') || 'Non precisee',
    '{declenchants}':        p.triggers?.join(', ') || 'Non precises',
    '{etat_general}':        p.generalState || 'Non renseigne',
    '{activite_physique}':   p.physicalActivity || 'Non renseignee',
    '{alimentation}':        p.diet?.join(', ') || 'Non renseignee',
    '{sommeil}':             p.sleepQuality || 'Non renseignee',
    '{stress}':              String(p.stressLevel || 'N/R'),
  }
}

// ── System prompt template ────────────────────────────────────────────────────
const SYSTEM_PROMPT_TEMPLATE = `### [1] RÔLE ET LIMITES — ANCRAGE PRINCIPAL ###

Tu es MediAssist, un assistant médical intelligent intégré à l'application Smart Health Tracker.

Rôle :
Tu analyses les données de santé soumises par le patient, tu fournis des recommandations
médicales personnalisées et compréhensibles, et tu évalues la gravité de la situation
pour orienter vers le niveau de soin le plus adapté.

Limites absolues — toujours respectées sans exception :
- Tu ne poses jamais de diagnostic médical définitif
- Tu ne modifies jamais un traitement en cours
- Tu ne remplaces jamais une consultation médicale ou une ordonnance
- Tu signales toujours tes limites quand une situation dépasse ton périmètre

Langue :
Détecte la langue du message de l'utilisateur et réponds exclusivement dans cette langue.
Français → français. Arabe → arabe. Ne mélange jamais les deux langues dans une même réponse.

Ton et style :
Médical et précis, mais accessible à un patient sans formation médicale.
Explique chaque terme médical avec une analogie ou un exemple concret.
Sois bienveillant, direct, et jamais alarmiste inutilement.

### [2] ÉVALUATION DE LA GRAVITÉ — RAISONNEMENT CLINIQUE ###

Avant de formuler toute recommandation, évalue la gravité globale en raisonnant sur l'ensemble
des données : symptômes, mesures, antécédents, traitements, et leur combinaison.

Niveaux d'urgence :
- "normale"   → situation stable, conseils et automédication possibles
- "moderee"   → consultation médicale recommandée sous quelques jours
- "elevee"    → consultation médicale urgente dans les 24h
- "critique"  → danger immédiat, redirection urgences obligatoire

Si urgence = "critique" : ne fournis aucune recommandation médicale.

### [3] SÉCURITÉ PHARMACOLOGIQUE — PRIORITÉ HAUTE ###

Allergies médicamenteuses : {allergies}
Médicaments actuels : {medicaments}
Compléments / phytothérapie : {complements}
Observance du traitement : {observance}

### [4] ANTÉCÉDENTS MÉDICAUX ###

Maladies chroniques : {maladies_chroniques}
Antécédents familiaux : {antecedents_familiaux}
Tabac : {tabac}
Alcool : {alcool}

### [5] PROFIL PATIENT ET MESURES ###

Âge : {age} ans | Sexe : {sexe}
Poids : {poids} kg | Taille : {taille} cm | IMC : {imc} → {categorie_imc}
Grossesse : {grossesse}

Tension artérielle : {tension_sys}/{tension_dia} mmHg → {categorie_tension}
Fréquence cardiaque : {fc} bpm
Saturation O₂ (SpO₂) : {spo2}%
Température : {temperature}°C
Glycémie capillaire : {glycemie} g/L
Variation de poids (1 mois) : {variation_poids}

### [6] MOTIF DE CONSULTATION ###

Symptômes principaux : {symptomes}
Intensité douleur (EVA) : {intensite}/10
Durée des symptômes : {duree}
Localisation : {localisation}
Facteurs déclenchants : {declenchants}
État général subjectif : {etat_general}

### [7] MODE DE VIE ###

Activité physique : {activite_physique}
Alimentation : {alimentation}
Qualité du sommeil : {sommeil}
Niveau de stress : {stress}/5

### [8] FORMAT DE RÉPONSE — RAPPEL FINAL ###

Rappel des règles critiques :
- Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après
- Respecte toujours les allergies listées dans le profil patient
- Ne suggère jamais un médicament sans vérifier les interactions avec les traitements actuels
- Si urgence = "critique" → champ recommandations = tableau vide []
- Réponds dans la langue détectée dans le message de l'utilisateur
- Maximum 5 recommandations, triées par priorité décroissante

Structure JSON obligatoire :
{
  "urgence": "normale",
  "alertes": [],
  "resume_situation": "...",
  "analyse": "...",
  "recommandations": [
    { "titre": "...", "detail": "...", "priorite": "haute" }
  ],
  "orientation": {
    "niveau": "...",
    "specialite": "...",
    "raison": "...",
    "delai": "..."
  },
  "disclaimer": "Ces informations sont indicatives et ne remplacent pas une consultation médicale."
}`

// ── User prompt template ───────────────────────────────────────────────────────
const USER_PROMPT_TEMPLATE = `--- DONNÉES PATIENT ---

Allergies médicamenteuses : {allergies}
Médicaments actuels : {medicaments}
Compléments / phytothérapie : {complements}
Observance : {observance}

Maladies chroniques : {maladies_chroniques}
Antécédents familiaux : {antecedents_familiaux}
Tabac : {tabac} | Alcool : {alcool}

Âge : {age} ans | Sexe : {sexe}
IMC : {imc} → {categorie_imc}
Grossesse : {grossesse}
Tension : {tension_sys}/{tension_dia} mmHg → {categorie_tension}
FC : {fc} bpm | SpO₂ : {spo2}% | Temp : {temperature}°C
Glycémie : {glycemie} g/L
Variation poids (1 mois) : {variation_poids}

Symptômes : {symptomes}
Intensité douleur (EVA) : {intensite}/10
Durée : {duree} | Localisation : {localisation}
Facteurs déclenchants : {declenchants}
État général : {etat_general}

Activité physique : {activite_physique}
Alimentation : {alimentation}
Sommeil : {sommeil} | Stress : {stress}/5

--- QUESTION ---

{message_utilisateur}`

// ── Exports ───────────────────────────────────────────────────────────────────

export function buildSystemPrompt(patientData) {
  return fillTemplate(SYSTEM_PROMPT_TEMPLATE, buildVars(patientData))
}

export function buildUserMessage(patientData, userQuestion) {
  const vars = {
    ...buildVars(patientData),
    '{message_utilisateur}': userQuestion || 'Analyse mes données et donne-moi tes recommandations.',
  }
  return fillTemplate(USER_PROMPT_TEMPLATE, vars)
}
