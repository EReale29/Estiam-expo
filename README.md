# TravelMate – React Native + Node mock backend

## Installation

### Backend (mock API)
```bash
cd backend
npm install
# Configure your secrets in a `.env` file
# PORT=4000
# JWT_SECRET=change-me
# JWT_REFRESH_SECRET=change-me-too
# DATABASE_PATH=./data/app.db
npm run migrate   # initialise la base SQLite
npm start        # démarre l’API sur http://localhost:4000
```

Principaux endpoints (tous nécessitent un `Authorization: Bearer <accessToken>` sauf Auth) :
- Auth : `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- Utilisateurs : `GET /users/:id`
- Trips : `GET /dashboard`, `GET /trips`, `POST /trips`, `GET /trips/:id`, `PUT /trips/:id`, `DELETE /trips/:id`
- Interactions : `POST /trips/:id/like`, `POST /trips/:id/comments`, `DELETE /trips/:id/comments/:commentId`
- Upload : `POST /uploads` (multipart `file`)

Exemples rapides (assurez-vous d’avoir défini vos variables d’environnement avant) :
```bash
# Inscription
curl -X POST http://localhost:4000/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"me@test.com","password":"secret123","name":"Me","username":"metest"}'

# Connexion
curl -X POST http://localhost:4000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"me@test.com","password":"secret123"}'

# Refresh
curl -X POST http://localhost:4000/auth/refresh \\
  -H "Content-Type: application/json" \\
  -d '{"refreshToken":"<refresh token>"}'

# Créer un voyage
curl -X POST http://localhost:4000/trips \\
  -H "Authorization: Bearer <access token>" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Week-end","destination":"Paris, France","startDate":"2024-06-01"}'

# Like / Unlike
curl -X POST http://localhost:4000/trips/<tripId>/like \\
  -H "Authorization: Bearer <access token>"

# Commenter
curl -X POST http://localhost:4000/trips/<tripId>/comments \\
  -H "Authorization: Bearer <access token>" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Super !"}'
```

### Frontend (Expo Router)
```bash
cd frontend
# Installez les dépendances natives (React Native Maps, DateTimePicker, etc.)
npm install
# Pointez l'app vers l'API
export EXPO_PUBLIC_MOCK_BACKEND_URL=http://localhost:4000
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
- Le backend persiste désormais en SQLite local (voir `backend/db.js`) et nécessite que les variables d’environnement JWT soient définies avant de démarrer.
