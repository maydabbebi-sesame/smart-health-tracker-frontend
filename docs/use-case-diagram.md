# Smart Health Tracker - Diagramme de cas d'utilisation global

```mermaid
flowchart LR
  Patient["Patient / User"]
  Admin["Admin (optionnel)"]
  AI["Service IA prive"]
  Backend["Backend API / Base de donnees"]

  subgraph App["Smart Health Tracker Frontend"]
    UCAuth["S'inscrire / Se connecter"]
    UCDashboard["Consulter le dashboard sante"]
    UCSymptoms["Remplir le formulaire de suivi sante"]
    UCMeasures["Renseigner les mesures appareils"]
    UCHistory["Consulter l'historique medical"]
    UCAI["Consulter l'analyse IA"]
    UCChat["Discuter avec l'assistant MediAssist"]
    UCAlerts["Consulter les notifications et alertes"]
    UCProfile["Modifier le profil patient"]
    UCSettings["Configurer les preferences"]
    UCAdmin["Consulter le tableau de bord admin"]
  end

  Patient --> UCAuth
  Patient --> UCDashboard
  Patient --> UCSymptoms
  Patient --> UCMeasures
  Patient --> UCHistory
  Patient --> UCAI
  Patient --> UCChat
  Patient --> UCAlerts
  Patient --> UCProfile
  Patient --> UCSettings

  Admin --> UCAdmin

  UCSymptoms --> Backend
  UCMeasures --> Backend
  UCHistory --> Backend
  UCProfile --> Backend
  UCSettings --> Backend
  UCAlerts --> Backend
  UCDashboard --> Backend

  Backend --> AI
  UCAI --> AI
  UCChat --> AI

  AI --> UCAI
  AI --> UCAlerts
  AI --> UCChat
```

## Acteurs

- **Patient / User** : utilisateur principal de l'application. Il saisit ses donnees, consulte son suivi, ses alertes, son profil et les recommandations IA.
- **Admin** : role optionnel et isole. Il sert uniquement au monitoring global de la plateforme.
- **Backend API / Base de donnees** : couche future qui stockera les donnees patient et exposera les endpoints necessaires au frontend.
- **Service IA prive** : service externe/interne appele via API. Ce n'est pas un role utilisateur.

## Cas d'utilisation principaux

- Authentification : inscription, connexion classique, preparation OAuth Google/Apple.
- Dashboard : consultation des indicateurs, charts, alertes et resume IA.
- Formulaire sante : saisie des donnees personnelles, mesures appareils, antecedents, traitements, symptomes et mode de vie.
- Analyse IA : generation de recommandations personnalisees a partir des donnees patient.
- Notifications : affichage des alertes, filtres, details et marquage comme lu.
- Profil : edition des informations patient et photo de profil.
- Settings : configuration des preferences frontend.
- Admin : supervision optionnelle.

## Regles metier importantes

- L'application ne contient pas de role docteur/praticien.
- Les seuls roles applicatifs sont **Patient/User** et **Admin optionnel**.
- L'IA est un service/API prive, pas un utilisateur.
- Le MVP actuel est frontend-only avec mocks, mais les contrats backend sont documentes dans `docs/api-contracts.md`.
