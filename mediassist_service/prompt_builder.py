"""
prompt_builder.py — builds the MediAssist system and user prompts from the
patient's submitted data (profile, measures, symptoms, lifestyle).
"""


def calc_imc(weight, height):
    try:
        w, h = float(weight), float(height)
    except (TypeError, ValueError):
        return "N/R", "Non renseigne"
    if not w or not h:
        return "N/R", "Non renseigne"

    value = w / (h / 100) ** 2
    if value < 18.5:
        categorie = "Insuffisance ponderale"
    elif value < 25:
        categorie = "Poids normal"
    elif value < 30:
        categorie = "Surpoids"
    elif value < 35:
        categorie = "Obesite classe I"
    elif value < 40:
        categorie = "Obesite classe II"
    else:
        categorie = "Obesite classe III"
    return f"{value:.1f}", categorie


def categorie_tension(systolique, diastolique):
    try:
        s, d = float(systolique), float(diastolique)
    except (TypeError, ValueError):
        return "Non mesuree"
    if not systolique or not diastolique:
        return "Non mesuree"

    if s >= 180 or d >= 120:
        return "HTA grade 3 - crise hypertensive"
    if s >= 140 or d >= 90:
        return "HTA grade 2"
    if s >= 130 or d >= 80:
        return "HTA grade 1"
    if s >= 120:
        return "Tension elevee"
    return "Normale"


def _falsy(value, fallback="N/R"):
    """Mirrors JS `value || fallback` — empty string, 0 and None all fall back."""
    return str(value) if value else fallback


def _nullish(value, fallback="N/R"):
    """Mirrors JS `value ?? fallback` — only None/missing falls back (0 is kept)."""
    return str(value) if value is not None else fallback


def _join(values, fallback):
    return ", ".join(values) if values else fallback


def _build_vars(p):
    imc, categorie_imc = calc_imc(p.get("weight"), p.get("height"))

    allergies = (
        (p.get("drugAllergies") or "Non precisees")
        if p.get("hasDrugAllergies") == "Oui"
        else "Aucune allergie connue"
    )
    medicaments = (
        (p.get("currentMedications") or "Non precises")
        if p.get("hasCurrentMedications") == "Oui"
        else "Aucun traitement en cours"
    )
    complements = (
        (p.get("supplements") or "Non precises")
        if p.get("hasSupplements") == "Oui"
        else "Aucun"
    )
    tabac = (
        f"Oui ({p.get('tobaccoQuantity') or 'quantite non precisee'})"
        if p.get("tobacco") == "Oui"
        else "Non"
    )
    alcool = (
        f"Oui ({p.get('alcoholQuantity') or 'frequence non precisee'})"
        if p.get("alcohol") == "Oui"
        else "Non"
    )

    symptomes = [*(p.get("symptoms") or [])]
    if p.get("otherSymptoms"):
        symptomes.append(p["otherSymptoms"])

    return {
        "{allergies}": allergies,
        "{medicaments}": medicaments,
        "{complements}": complements,
        "{observance}": p.get("treatmentAdherence") or "Non renseignee",
        "{maladies_chroniques}": _join(p.get("chronicDiseases"), "Aucune"),
        "{antecedents_familiaux}": _join(p.get("familyHistory"), "Non renseignes"),
        "{tabac}": tabac,
        "{alcool}": alcool,
        "{age}": _falsy(p.get("age")),
        "{sexe}": p.get("biologicalSex") or "N/R",
        "{poids}": _falsy(p.get("weight")),
        "{taille}": _falsy(p.get("height")),
        "{imc}": imc,
        "{categorie_imc}": categorie_imc,
        "{grossesse}": p.get("pregnancyStatus") or "N/A",
        "{tension_sys}": _falsy(p.get("bloodPressureSys")),
        "{tension_dia}": _falsy(p.get("bloodPressureDia")),
        "{categorie_tension}": categorie_tension(p.get("bloodPressureSys"), p.get("bloodPressureDia")),
        "{fc}": _falsy(p.get("heartRate")),
        "{spo2}": _falsy(p.get("spo2")),
        "{temperature}": _falsy(p.get("temperature")),
        "{glycemie}": _falsy(p.get("glycemia")),
        "{variation_poids}": p.get("weightVariation") or "Non renseignee",
        "{symptomes}": _join(symptomes, "Non renseignes"),
        "{intensite}": _nullish(p.get("painIntensity")),
        "{duree}": p.get("symptomDuration") or "Non renseignee",
        "{localisation}": _join(p.get("painLocation"), "Non precisee"),
        "{declenchants}": _join(p.get("triggers"), "Non precises"),
        "{etat_general}": p.get("generalState") or "Non renseigne",
        "{activite_physique}": p.get("physicalActivity") or "Non renseignee",
        "{alimentation}": _join(p.get("diet"), "Non renseignee"),
        "{sommeil}": p.get("sleepQuality") or "Non renseignee",
        "{stress}": _falsy(p.get("stressLevel")),
    }


def _fill(template, variables):
    result = template
    for placeholder, value in variables.items():
        result = result.replace(placeholder, value)
    return result


SYSTEM_PROMPT_TEMPLATE = """### [1] RÔLE ET LIMITES — ANCRAGE PRINCIPAL ###

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

### [8] QUESTIONS DE SUIVI — CONVERSATION EN COURS ###

Le profil patient ci-dessus reste valable pour TOUTE la conversation — il ne te sera
pas redonné à chaque message. Distingue deux types de message utilisateur :

- DEMANDE D'ANALYSE INITIALE ("Analyse mes données et donne-moi tes recommandations") :
  fournis l'évaluation complète (urgence, alertes, recommandations, orientation...).

- QUESTION DE SUIVI (ex : "Quel style de vie me recommandes-tu ?", "Et pour mon
  sommeil ?", "Peux-tu m'expliquer plus ?") : c'est une vraie conversation, pas
  une nouvelle analyse. Réponds directement et précisément à CETTE question —
  MAIS attention, "conversation" ne veut PAS dire "texte libre hors JSON" :
  ta réponse reste TOUJOURS le même objet JSON structuré (voir [9]), avec ton
  texte conversationnel placé dans le champ "analyse" — c'est ce texte précis,
  et lui seul, qui est affiché au patient. Ne romps JAMAIS le format JSON, même
  pour une réponse courte ou conversationnelle. Garde "resume_situation" inchangé
  ou bref. Ne renvoie "recommandations", "alertes" ou une nouvelle "orientation"
  QUE si la question révèle un élément clinique réellement nouveau qui les
  justifie ; sinon laisse ces champs vides ([]) pour ne pas répéter ce qui a
  déjà été communiqué.

### [9] FORMAT DE RÉPONSE — RAPPEL FINAL ###

Rappel des règles critiques :
- Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après — CETTE
  RÈGLE S'APPLIQUE À CHAQUE MESSAGE SANS EXCEPTION, y compris une question de
  suivi conversationnelle ([8]) : même une réponse courte du type "Bien sûr,
  voici..." doit être encapsulée dans le champ "analyse" du JSON, jamais
  envoyée comme texte brut hors structure
- Respecte toujours les allergies listées dans le profil patient
- Ne suggère jamais un médicament sans vérifier les interactions avec les traitements actuels
- Si urgence = "critique" → champ recommandations = tableau vide []
- Réponds dans la langue détectée dans le message de l'utilisateur
- Maximum 5 recommandations, triées par priorité décroissante

Le champ "alertes" est un tableau de COURTES phrases signalant chacune un élément
clinique précis qui justifie une vigilance immédiate (ex : "Tension artérielle très
élevée : 178/108 mmHg", "Association Aspirine + traitement anticoagulant en cours").
Il est distinct de "recommandations" (qui propose des actions) et de "urgence" (qui
qualifie la gravité globale) — ne les duplique pas. Laisse-le vide [] seulement si
rien dans les données ne justifie un signalement explicite.

Structure JSON obligatoire :
{
  "urgence": "normale",
  "alertes": ["Tension artérielle élevée : 148/92 mmHg (HTA grade 2)"],
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
}"""

USER_PROMPT_TEMPLATE = """--- DONNÉES PATIENT ---

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

{message_utilisateur}"""

# Used for every turn AFTER the first one. The patient profile is already in the
# system prompt (present on every call) and in the conversation history — repeating
# it here would make a follow-up question look identical to a fresh analysis request
# and push the model to redo a full assessment instead of answering conversationally.
FOLLOWUP_PROMPT_TEMPLATE = """--- QUESTION DE SUIVI ---

{message_utilisateur}"""


def build_system_prompt(patient_data):
    return _fill(SYSTEM_PROMPT_TEMPLATE, _build_vars(patient_data))


def build_user_message(patient_data, user_question, is_followup=False):
    if is_followup:
        return FOLLOWUP_PROMPT_TEMPLATE.replace(
            "{message_utilisateur}", user_question or "Peux-tu préciser ta question ?",
        )

    variables = _build_vars(patient_data)
    variables["{message_utilisateur}"] = user_question or "Analyse mes données et donne-moi tes recommandations."
    return _fill(USER_PROMPT_TEMPLATE, variables)
