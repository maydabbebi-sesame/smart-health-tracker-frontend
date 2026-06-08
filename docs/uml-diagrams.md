# Smart Health Tracker - Pack UML

Ce dossier contient les diagrammes UML principaux du projet :

- [Cas d'utilisation - Authentification](./use-case-auth.puml)
- [Cas d'utilisation - Suivi sante et formulaire IA](./use-case-health-tracking.puml)
- [Cas d'utilisation - Analyse IA et MediAssist](./use-case-ai-analysis.puml)
- [Cas d'utilisation - Profil, notifications et preferences](./use-case-profile-notifications.puml)
- [Sequence systeme - Connexion](./sequence-login.puml)
- [Sequence systeme - Soumission formulaire sante vers IA](./sequence-symptom-analysis.puml)
- [Sequence systeme - Consultation notifications](./sequence-notifications.puml)
- [Sequence systeme - Modification profil](./sequence-profile-update.puml)
- [Diagramme de classes conceptuel](./class-diagram.puml)
- [Diagramme etat-transition - Formulaire sante](./state-symptom-form.puml)
- [Diagramme etat-transition - Analyse IA](./state-ai-analysis.puml)
- [Diagramme etat-transition - Notification](./state-notification.puml)

Notes importantes :

- Les roles applicatifs sont uniquement **Patient/User** et **Admin optionnel**.
- Il n'y a pas de role docteur/praticien.
- Le service IA est une API/service prive, pas un utilisateur.
- Le MVP actuel est frontend-only avec mocks, mais les diagrammes montrent le flux cible avec backend et base de donnees.
