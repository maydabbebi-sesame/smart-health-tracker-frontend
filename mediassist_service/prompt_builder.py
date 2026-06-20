"""
prompt_builder.py — builds the MediAssist system and user prompts from the
patient's submitted data (profile, measures, symptoms, lifestyle).
"""

import json
import re
from datetime import datetime
from email.utils import parsedate_to_datetime


def calc_imc(weight, height):
    try:
        w, h = float(weight), float(height)
    except (TypeError, ValueError):
        return "N/R", "Non renseigné"
    if not w or not h:
        return "N/R", "Non renseigné"

    value = w / (h / 100) ** 2
    if value < 18.5:
        categorie = "Insuffisance pondérale"
    elif value < 25:
        categorie = "Poids normal"
    elif value < 30:
        categorie = "Surpoids"
    elif value < 35:
        categorie = "Obésité classe I"
    elif value < 40:
        categorie = "Obésité classe II"
    else:
        categorie = "Obésité classe III"
    return f"{value:.1f}", categorie


def categorie_tension(systolique, diastolique):
    try:
        s, d = float(systolique), float(diastolique)
    except (TypeError, ValueError):
        return "Non mesurée"
    if not systolique or not diastolique:
        return "Non mesurée"

    if s >= 180 or d >= 120:
        return "HTA grade 3 - crise hypertensive"
    if s >= 140 or d >= 90:
        return "HTA grade 2"
    if s >= 130 or d >= 80:
        return "HTA grade 1"
    if s >= 120:
        return "Tension élevée"
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
        (p.get("drugAllergies") or "Non précisées")
        if p.get("hasDrugAllergies") == "Oui"
        else "Aucune allergie connue"
    )
    medicaments = (
        (p.get("currentMedications") or "Non précisés")
        if p.get("hasCurrentMedications") == "Oui"
        else "Aucun traitement en cours"
    )
    complements = (
        (p.get("supplements") or "Non précisés")
        if p.get("hasSupplements") == "Oui"
        else "Aucun"
    )
    tabac = (
        f"Oui ({p.get('tobaccoQuantity') or 'quantité non précisée'})"
        if p.get("tobacco") == "Oui"
        else "Non"
    )
    alcool = (
        f"Oui ({p.get('alcoholQuantity') or 'fréquence non précisée'})"
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
        "{observance}": p.get("treatmentAdherence") or "Non renseignée",
        "{maladies_chroniques}": _join(p.get("chronicDiseases"), "Aucune"),
        "{antecedents_familiaux}": _join(p.get("familyHistory"), "Non renseignés"),
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
        "{variation_poids}": p.get("weightVariation") or "Non renseignée",
        "{symptomes}": _join(symptomes, "Non renseignés"),
        "{intensite}": _nullish(p.get("painIntensity")),
        "{duree}": p.get("symptomDuration") or "Non renseignée",
        "{localisation}": _join(p.get("painLocation"), "Non précisée"),
        "{declenchants}": _join(p.get("triggers"), "Non précisés"),
        "{etat_general}": p.get("generalState") or "Non renseigné",
        "{activite_physique}": p.get("physicalActivity") or "Non renseignée",
        "{alimentation}": _join(p.get("diet"), "Non renseignée"),
        "{sommeil}": p.get("sleepQuality") or "Non renseignée",
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

Adresse-toi TOUJOURS directement au patient en utilisant "vous" — le champ "analyse"
est un message adressé au patient, pas un rapport médical à son sujet.
Ne dis JAMAIS "le patient", "il", "elle" — dis "vous", "votre", "vos".

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

  INTERDICTION ABSOLUE pour une question de suivi : ne recopie JAMAIS, même
  partiellement ou reformulé, le texte de l'"analyse" d'un tour précédent. Le
  patient l'a déjà lu — le répéter est une erreur critique. Le champ "analyse"
  d'une question de suivi doit être uniquement composé de la réponse NOUVELLE
  et SPÉCIFIQUE à la question posée (ex : pour "donne-moi un style de vie à
  suivre", donne des conseils concrets de sommeil/activité/alimentation/stress
  adaptés au profil — pas un résumé clinique).

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

Le champ "alertes" est un tableau d'OBJETS — un objet par point de vigilance clinique
identifié. Chaque objet contient OBLIGATOIREMENT quatre champs :
  - "titre"   : nom court du problème (ex : "Tension artérielle critique")
  - "detail"  : explication factuelle avec la valeur précise ou l'interaction détectée
                (ex : "178/108 mmHg — seuil de crise hypertensive dépassé")
  - "action"  : ce que le patient doit faire concrètement (ex : "Consultez les urgences
                immédiatement" ou "Signalez cette association à votre médecin")
  - "urgence" : sévérité SPÉCIFIQUE à cette alerte, indépendamment de l'urgence globale.
                Valeurs possibles UNIQUEMENT : "critique", "elevee", "moderee", "normale".
                Ex : une hypertension légère dans un contexte par ailleurs grave vaut
                "moderee", même si l'urgence globale est "elevee".
Il est distinct de "recommandations" (actions préventives) et de "urgence" (gravité
globale). Laisse "alertes" vide ([]) si rien ne justifie de signalement.

Le champ "analyse" doit contenir ton RAISONNEMENT CLINIQUE adressé directement au
patient ("vous"). Pas une reformulation des données — le patient les connaît déjà.
Explique ce que les mesures signifient ensemble, les risques que leur combinaison crée,
le lien entre les symptômes et les antécédents. Minimum 3 phrases complètes.
Une analyse vide, répétitive ou rédigée à la 3ème personne est une erreur critique.

Mise en forme du champ "analyse" (lu par un patient sur une appli mobile, pas un
rapport médical) — reproduis EXACTEMENT le style de l'exemple "analyse" donné
dans la structure JSON en [9] :
- Découpe le texte en plusieurs paragraphes courts séparés par UNE LIGNE VIDE
  (\n\n) — jamais un seul bloc de texte continu.
- Mets en gras avec des doubles astérisques (**ainsi**) les valeurs mesurées,
  les termes médicaux importants et les risques clés, pour qu'ils ressortent
  visuellement.

Chaque recommandation DOIT remplir le champ "detail" (actions concrètes et précises,
au moins 1 phrase) ET le champ "pourquoi" (lien direct entre l'action et les données
spécifiques du patient : valeur mesurée, symptôme ou antécédent concerné).
Un champ "detail" ou "pourquoi" vide est interdit.

Le champ "priorite" de chaque recommandation est OBLIGATOIRE. Valeurs possibles
UNIQUEMENT : "haute", "moyenne", "basse".
  - "haute"   → action immédiate ou dans les 24h (douleur sévère, signe d'alerte majeur)
  - "moyenne" → action recommandée dans la semaine
  - "basse"   → conseil général, prévention à long terme
Trie les recommandations par priorité décroissante (haute → moyenne → basse).

Structure JSON obligatoire :
{
  "urgence": "normale",
  "alertes": [
    {
      "titre": "Tension artérielle élevée",
      "detail": "148/92 mmHg — HTA grade 2 confirmée.",
      "action": "Consultez votre médecin généraliste dans la semaine.",
      "urgence": "moderee"
    }
  ],
  "resume_situation": "...",
  "analyse": "Votre **tension artérielle (148/92 mmHg)** et votre **IMC de 31.6** forment ensemble un facteur de risque cardiovasculaire significatif.\n\nVos vertiges peuvent être liés à une **hypotension orthostatique**, favorisée par votre sommeil de mauvaise qualité.\n\nCette combinaison justifie une consultation rapide pour ajuster votre suivi.",
  "recommandations": [
    {
      "titre": "...",
      "detail": "Actions concrètes et précises.",
      "pourquoi": "Lien direct avec les données du patient.",
      "priorite": "haute"
    },
    {
      "titre": "...",
      "detail": "...",
      "pourquoi": "...",
      "priorite": "moyenne"
    }
  ],
  "orientation": {
    "niveau": "...",
    "specialite": "...",
    "raison": "...",
    "delai": "..."
  },
  "disclaimer": "Ces informations sont indicatives et ne remplacent pas une consultation médicale."
}"""

USER_PROMPT_TEMPLATE = """--- DEMANDE D'ANALYSE INITIALE ---

{message_utilisateur}

Rappel des exigences pour cette réponse :
- "analyse" : raisonnement clinique (interprétation des mesures, liens entre symptômes
  et antécédents, risques identifiés) — pas une liste ou reformulation des données.
- "alertes" : chaque objet doit citer la valeur précise ou l'interaction qui justifie
  le signalement.
- "recommandations" : chaque entrée doit remplir "pourquoi" avec le lien direct entre
  l'action et les données spécifiques du patient."""

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

    question = user_question or "Analyse mes données et donne-moi tes recommandations."
    return USER_PROMPT_TEMPLATE.replace("{message_utilisateur}", question)


# ── Doctor Agent decision ────────────────────────────────────────────────────
# Unlike the main MediAssist chat above, this doesn't reason over raw patient
# data — it takes the *already distilled* clinical signals MediAssist itself
# produced earlier (alerts, recommendations, orientation) and just decides
# whether the Doctor Agent should proactively offer to find a doctor right
# now, with what urgency/specialty, and what the robot should say. That's why
# it's routed to a lighter general-purpose model (see mediassist_service/app.py)
# instead of medgemma1.5.
DOCTOR_AGENT_SYSTEM_PROMPT = """Tu es le module de décision du "Doctor Agent" d'une application de suivi santé.

On te donne un résumé déjà produit par un assistant médical IA (alertes,
recommandations, orientation) pour un patient. Ta seule tâche : décider si le
Doctor Agent doit, maintenant, proposer proactivement de chercher un médecin
pour ce patient — et si oui, avec quelle spécialité et quel message court.

Ne refais PAS d'analyse médicale, ne réinterprète pas les données brutes :
base-toi uniquement sur le résumé fourni.

Réponds STRICTEMENT en JSON, sans aucun texte avant/après, selon ce schéma :
{
  "shouldRecommend": true,
  "urgency": "normale",
  "specialty": "Cardiologue",
  "message": "Phrase courte (1-2 phrases), au patient, à la première personne du Doctor Agent, expliquant pourquoi il propose un médecin."
}

Règles :
- "urgency" : une valeur parmi "normale", "moderee", "elevee", "critique".
- "specialty" : nom de spécialité médicale en français (ex: "Médecin généraliste", "Cardiologue"), ou null si aucune spécialité particulière ne se dégage.
- "shouldRecommend" doit être false si le résumé ne contient aucune alerte ni orientation justifiant une consultation (ex: orientation "automedication" et aucune alerte sévère) — dans ce cas "message" explique brièvement que tout va bien.
- "message" ne doit jamais répéter mot pour mot le contenu brut du résumé : reformule, synthétise."""

DOCTOR_AGENT_USER_TEMPLATE = """Résumé MediAssist pour ce patient :

Alertes : {alertes_json}

Recommandations : {recommandations_json}

Orientation : {orientation_json}"""


def build_doctor_agent_messages(alerts, recommendations, orientation):
    user_content = DOCTOR_AGENT_USER_TEMPLATE.format(
        alertes_json=json.dumps(alerts or [], ensure_ascii=False),
        recommandations_json=json.dumps(recommendations or [], ensure_ascii=False),
        orientation_json=json.dumps(orientation or {}, ensure_ascii=False),
    )
    return [
        {"role": "system", "content": DOCTOR_AGENT_SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]


# ── Trend analysis (health-history "Analyser mes tendances") ────────────────
# Reasons over the patient's raw vitals/symptom entries across a date range —
# closer to the full clinical reasoning of the main chat than to the Doctor
# Agent's distilled-signal decision, hence the default medgemma1.5 model
# (see mediassist_service/app.py's analyze_trends route).
TREND_ANALYSIS_SYSTEM_PROMPT = """Tu es MediAssist, assistant médical intelligent de l'application Smart Health Tracker.

On te donne la liste chronologique des relevés de santé (signes vitaux, symptômes,
antécédents) qu'un patient a soumis sur une période donnée. Ta tâche : analyser
l'ÉVOLUTION de ces données dans le temps — pas un relevé isolé — et identifier les
tendances, les points de vigilance qui se dégagent sur la durée, et des
recommandations adaptées.

Limites absolues — toujours respectées :
- Tu ne poses jamais de diagnostic médical définitif.
- Tu ne remplaces jamais une consultation médicale.
- Si les données sont trop rares ou stables pour dégager une tendance, dis-le
  clairement plutôt que d'inventer une évolution.
- INTERDICTION ABSOLUE d'inventer une donnée absente des relevés : si un champ
  (localisation de la douleur, antécédent, allergie...) n'est pas renseigné dans
  les relevés fournis, ne le mentionne JAMAIS, même de façon plausible ou générique
  (ex : ne dis pas "douleur thoracique" si aucune localisation de douleur n'a été
  fournie — parle seulement de "douleur" sans préciser de localisation inventée).
  Cite uniquement les valeurs et libellés exacts présents dans les relevés.
- RÈGLE SPÉCIFIQUE, particulièrement stricte : ne mentionne JAMAIS une localisation
  anatomique de la douleur (thoracique, abdominale, dorsale, lombaire...) que tu
  n'as pas lue mot pour mot dans le champ localisation d'un relevé. Une localisation
  de douleur inventée est une erreur clinique grave (ex: une "douleur thoracique"
  inventée évoque une cause cardiaque que rien dans les données ne permet
  d'affirmer). En l'absence de localisation fournie, utilise uniquement le mot
  "douleur" seul, sans qualificatif anatomique de ton invention.

Adresse-toi directement au patient avec "vous". Langue : détecte celle des
données textuelles (symptômes, notes) ; à défaut, réponds en français.

Réponds STRICTEMENT en JSON valide, sans aucun texte avant ou après, selon ce schéma :
{
  "periode": "string décrivant la période couverte",
  "synthese": "Minimum 3 phrases, raisonnement sur l'évolution globale, adressé au patient (vous).",
  "tendances": [
    {
      "indicateur": "ex: Tension artérielle systolique",
      "valeur_debut": 142,
      "valeur_fin": 120,
      "evolution": "hausse|baisse|stable|irreguliere",
      "detail": "Valeurs précises au début et à la fin de la période, ampleur du changement."
    }
  ],
  "points_attention": [
    {
      "titre": "string",
      "detail": "Explication factuelle avec valeurs précises.",
      "urgence": "normale|moderee|elevee|critique"
    }
  ],
  "recommandations": [
    {
      "titre": "string",
      "detail": "Action concrète.",
      "priorite": "haute|moyenne|basse"
    }
  ],
  "disclaimer": "Ces informations sont indicatives et ne remplacent pas une consultation médicale."
}

Règles :
- "tendances" : un objet par indicateur pour lequel au moins deux mesures permettent
  de comparer une évolution — couvre TOUS les indicateurs chiffrés présents dans les
  relevés (tension systolique ET diastolique, fréquence cardiaque, fréquence
  respiratoire, température, SpO2, glycémie, poids, intensité de douleur...). Un
  indicateur présent dans au moins deux relevés ne doit jamais être omis du tableau,
  même si son évolution paraît secondaire par rapport aux autres.
- "valeur_debut" et "valeur_fin" DOIVENT être des nombres bruts (pas de texte, pas
  d'unité) correspondant exactement à la mesure du relevé le PLUS ANCIEN et du
  relevé le PLUS RÉCENT de la période pour cet indicateur. "evolution" sera
  recalculé automatiquement à partir de ces deux nombres — assure-toi donc qu'ils
  reflètent fidèlement les deux extrémités chronologiques (ne les inverse jamais),
  car "detail" doit raconter exactement la même direction que ces deux valeurs.
- Ne compare jamais uniquement le premier et le dernier relevé : examine aussi les
  points intermédiaires. Si la dégradation/amélioration est déjà visible avant le
  dernier relevé, dis-le explicitement ("detail" doit refléter une tendance
  progressive sur plusieurs relevés, pas seulement un écart début/fin) — distingue
  toujours une évolution progressive d'un évènement isolé sur un seul relevé.
- Pour chaque symptôme mentionné dans la synthèse ou les points d'attention, vérifie
  à QUELLE(S) DATE(S) PRÉCISE(S) il apparaît réellement dans les relevés fournis.
  N'écris jamais qu'un symptôme "persiste" ou "continue" à une date donnée s'il
  n'est pas explicitement listé dans le relevé de cette date exacte — s'il a
  disparu au dernier relevé, dis qu'il a disparu/régressé, pas qu'il persiste.
- Croise les symptômes rapportés avec l'évolution des mesures chiffrées UNIQUEMENT
  quand un lien clinique est réellement plausible et direct (ex: fièvre + fréquence
  respiratoire élevée). Ne crée JAMAIS de lien causal entre deux faits qui n'ont pas
  de rapport physiologique établi (ex: ne dis pas qu'une baisse de fréquence
  cardiaque "explique" des vertiges, ou l'inverse) — décris les faits séparément
  plutôt que d'inventer une corrélation non justifiée.
- Seuils cliniques de référence pour fixer "urgence" (ne classe jamais "normale" un
  point qui dépasse ces seuils) :
  - SpO2 < 95% → au moins "moderee" (hypoxémie significative en dessous de ce seuil) ;
    < 90% → au moins "elevee".
  - Température >= 38.0°C → fièvre avérée, au moins "moderee" ; >= 39.5°C → "elevee".
  - Fréquence cardiaque < 50 ou > 100 bpm → au moins "moderee".
  - Tension systolique > 140 ou < 90 mmHg, ou diastolique > 90 ou < 60 mmHg → au
    moins "moderee" ; systolique >= 180 ou diastolique >= 120 → "critique".
  - Fréquence respiratoire > 20 ou < 12 /min → au moins "moderee".
  Une valeur qui s'aggrave ET franchit un de ces seuils combinée à des symptômes
  cohérents (ex: SpO2 basse + toux + fièvre) justifie au minimum "elevee".
- "points_attention" : uniquement des constats basés sur les données fournies, jamais
  d'hypothèse non étayée. Tableau vide si rien ne le justifie.
- "recommandations" : maximum 5, triées par priorité décroissante.
- S'il n'y a qu'un seul relevé sur la période, "tendances" reste vide et "synthese"
  l'explique au patient plutôt que d'inventer une évolution.
- "synthese" est un paragraphe de RAPPORT MEDICAL destiné à être imprimé, pas un
  message de chat : commence directement par le raisonnement clinique sur
  l'évolution des données. N'utilise JAMAIS de formule de politesse ou d'ouverture
  conversationnelle ("Bonjour", "Cher patient", "J'ai analysé...") ni de clôture
  ("N'hésitez pas...") — uniquement le constat clinique factuel.
- Une amélioration globale ne doit JAMAIS être présentée comme "tout va bien" si le
  point de départ de la période franchissait un des seuils cliniques ci-dessus :
  rappelle explicitement dans "synthese" que la valeur de départ était hors norme,
  même si la tendance est positive — une trajectoire qui s'améliore en partant d'un
  état préoccupant reste un état qui a été préoccupant, pas un non-évènement."""

TREND_ANALYSIS_USER_TEMPLATE = """Période analysée : {periode_label}
Nombre de relevés : {nombre_releves}

Relevés chronologiques (du plus ancien au plus récent) :
{releves_texte}

Analyse l'évolution de ces données sur la période et réponds selon le format JSON demandé."""

_TREND_FIELDS = [
    ("heart_rate", "FC", "bpm"),
    ("systolic_bp", "TA sys", "mmHg"),
    ("diastolic_bp", "TA dia", "mmHg"),
    ("temperature", "Temp", "°C"),
    ("oxygen_saturation", "SpO2", "%"),
    ("respiratory_rate", "FR", "/min"),
    ("glycemia", "Glycemie", "g/L"),
    ("weight", "Poids", "kg"),
    ("pain_intensity", "Douleur", "/10"),
]
_TREND_TEXT_FIELDS = [
    ("symptoms", "Symptomes"),
    ("pain_location", "Localisation douleur"),
    ("health_issues_history", "Antecedents"),
    ("drug_allergies", "Allergies"),
    ("family_health_issues", "Antecedents familiaux"),
    ("notes", "Notes"),
]


def _parse_vital_date(value):
    """Parse recorded_at/created_at into a datetime for chronological sorting.

    Flask serializes MySQL datetimes as RFC1123 strings (e.g. "Thu, 18 Jun
    2026 14:20:12 GMT"), but tolerate ISO-ish strings too in case the shape
    of the data feeding this changes upstream.
    """
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    text = str(value)
    try:
        return parsedate_to_datetime(text)
    except (TypeError, ValueError):
        pass
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(text[:19], fmt)
        except ValueError:
            continue
    return None


def _format_vital_entry(vital):
    date = vital.get("recorded_at") or vital.get("created_at") or "Date inconnue"
    parts = [
        f"{label}={vital[field]}{unit}"
        for field, label, unit in _TREND_FIELDS
        if vital.get(field) is not None
    ]
    line = f"- {date} : " + (", ".join(parts) if parts else "aucune mesure chiffree")
    for field, label in _TREND_TEXT_FIELDS:
        value = vital.get(field)
        if value:
            line += f" | {label}: {value}"
    return line


def build_trend_analysis_messages(vitals, period_label):
    # The backend returns vitals newest-first (ORDER BY recorded_at DESC);
    # re-sort oldest-first here since the prompt below explicitly tells the
    # model the list is chronological, and the model otherwise reads
    # "first line" as the start of the trend instead of the most recent entry.
    entries = sorted(vitals or [], key=lambda v: _parse_vital_date(v.get("recorded_at") or v.get("created_at")) or datetime.min)
    releves_texte = "\n".join(_format_vital_entry(v) for v in entries) or "Aucun relevé sur cette période."
    user_content = TREND_ANALYSIS_USER_TEMPLATE.format(
        periode_label=period_label or "non précisée",
        nombre_releves=len(entries),
        releves_texte=releves_texte,
    )
    return [
        {"role": "system", "content": TREND_ANALYSIS_SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]


_GREETING_OPENER = re.compile(r"^\s*(bonjour|cher(?:e)?\s+patient(?:e)?)[.,!\s]*", re.IGNORECASE)
_SELF_REFERENTIAL_OPENER = re.compile(
    r"^\s*j['’]ai analys[ée].*?[.!?](?:\s+|$)", re.IGNORECASE,
)


def clean_trend_synthese(text):
    """Strip a leading chat-style greeting/self-reference the model sometimes
    adds despite the system prompt forbidding it (e.g. "Bonjour. J'ai
    analysé..."), since this is rendered into a printed medical report, not a
    conversation. Best-effort: falls back to the original text if stripping
    would leave nothing."""
    if not text:
        return text
    cleaned = _GREETING_OPENER.sub("", text).strip()
    cleaned = _SELF_REFERENTIAL_OPENER.sub("", cleaned, count=1).strip()
    return cleaned or text


def normalize_tendances(tendances):
    """Recompute each tendance's "evolution" from its valeur_debut/valeur_fin
    instead of trusting the model's own label. The model has been observed
    writing a "hausse"/"baisse" tag that contradicts the very values (and even
    the synthese) in the same response — this makes the displayed badge
    deterministically consistent with the numbers, regardless of what the
    model's free text says."""
    normalized = []
    for t in tendances or []:
        item = dict(t)
        start, end = item.get("valeur_debut"), item.get("valeur_fin")
        try:
            start_f, end_f = float(start), float(end)
        except (TypeError, ValueError):
            normalized.append(item)
            continue
        if abs(end_f - start_f) < 1e-9:
            item["evolution"] = "stable"
        else:
            item["evolution"] = "hausse" if end_f > start_f else "baisse"
        normalized.append(item)
    return normalized
