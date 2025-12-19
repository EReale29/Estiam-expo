# TravelMate – React Native + Node mock backend

## Installation

### Backend (mock API)
```bash
cd backend
npm install
npm start        # démarre l’API sur http://localhost:4000
```

### Frontend (Expo Router)
```bash
cd frontend
# Installez les dépendances natives (React Native Maps, DateTimePicker, etc.)
npm install
npx expo start   # lance Expo
```

> Remarque : si votre registry NPM bloque certains paquets dans cet environnement, exécutez l’installation sur une connexion autorisée (`npm install --registry=https://registry.npmjs.org`). Les nouvelles dépendances listées dans `package.json` doivent être résolues pour que la carte et le date picker fonctionnent.

## Améliorations majeures
- **API & typage** : appels centralisés (`services/http.ts`, `services/api.ts`), typage strict des tokens et des modèles (`types/models.ts`, `utils/jwt.ts`), refresh explicite et testé des tokens.
- **Auth robuste** : garde de route fiable dans `_layout.tsx`, persistence SecureStore, profil dynamique `/me`, logout complet.
- **Dashboard Home** : données en temps réel depuis l’API (`/dashboard`), actions rapides réelles, bouton notifications, feedback erreur/chargement.
- **Trips** : recherche + filtres, vue liste/carte interactive, navigation vers le détail (`trip/[id].tsx`), données depuis l’API.
- **Ajout de voyage** : validation stricte (titre, destination `Ville, Pays`, dates via date picker), upload réel avec progression, gestion permissions appareil/simulateur, retour automatique.
- **Notifications** : effet corrigé, initialisation claire, état badge/permissions, logs limités, différenciation simulateur/device.
- **I18n** : FR/EN sur l’app via `contexts/i18n-context.tsx`, bascule de langue dans Profil/Settings.
- **Offline** : ping backend, file d’attente/synchronisation revue, bannières état réseau, cache trips.
- **Tests unitaires** : couverture des helpers JWT et du refresh token (`frontend/tests/auth.test.ts`).

## Décisions techniques
- **Centralisation** : `services/http` pour la configuration réseau (headers communs, timeout), `services/auth` pour la logique auth/refresh et `services/api` pour les routes métier.
- **Séparation des responsabilités** : hooks dédiés (`use-dashboard`, `use-trips`, `use-notifications`, `use-offline`) pour éviter la logique métier dans les composants UI.
- **Typage & validation** : helpers dédiés (`utils/jwt`, `utils/validation`) pour fiabiliser les tokens, emails/mots de passe et formats de destination.
- **Expérience utilisateur** : états `loading`/`error` visibles partout, feedback clair sur les permissions, navigation cohérente (See all, Quick actions, detail trip).
- **Accessibilité & cohérence** : composants tactiles plus larges, contrastes conservés, textes multi-langues.

## Limites connues
- L’installation des paquets peut échouer derrière certains proxies (erreur 403). Utilisez un registry autorisé ou ré-exécutez `npm install` avec le flag `--registry`.
- Les nouveaux modules natifs (`react-native-maps`, `@react-native-community/datetimepicker`) doivent être installés sur l’environnement cible avant de lancer Expo.
- Le backend mock persiste en JSON local (`backend/data/trips.json`) et ne gère pas de droits complexes : à adapter pour un environnement prod.
