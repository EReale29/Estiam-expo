import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Language } from '@/types/models';

type TranslationValue = string | Record<string, any>;

const STORAGE_KEY = '@travelmate_language';

const translations: Record<Language, TranslationValue> = {
  fr: {
    tabs: {
      home: 'Accueil',
      trips: 'Voyages',
      profile: 'Profil',
      notifications: 'Notifications',
      settings: 'Réglages',
      collection: 'Collection',
    },
    general: {
      loading: 'Chargement...',
      retry: 'Réessayer',
      error: 'Une erreur est survenue',
      offline: 'Hors ligne',
      syncNow: 'Synchroniser',
      seeAll: 'Voir tout',
    },
    auth: {
      loginTitle: 'Connectez-vous à votre compte',
      registerTitle: 'Créez un nouveau compte',
      email: 'Email',
      password: 'Mot de passe',
      username: "Nom d'utilisateur",
      forgot: 'Mot de passe oublié ?',
      switchToRegister: 'Pas encore de compte ? Inscrivez-vous',
      switchToLogin: 'Déjà un compte ? Connectez-vous',
      loginCta: 'Se connecter',
      registerCta: "S'inscrire",
      invalidEmail: 'Email invalide',
      invalidPassword: 'Mot de passe trop court (8 caractères mini)',
      invalidUsername: "Nom d'utilisateur requis",
    },
    home: {
      greeting: 'Bonjour',
      statsTrips: 'Voyages',
      statsPhotos: 'Photos',
      statsCountries: 'Pays',
      upcoming: 'Prochains voyages',
      quickActions: 'Actions rapides',
      filters: 'Filtres',
      recentActivity: 'Activités récentes',
      daysLeft: 'Dans {{count}} jours',
      newTrip: 'Nouveau voyage',
      addPhoto: 'Ajouter une photo',
      explore: 'Explorer',
      notification: 'Notifications',
    },
    trips: {
      title: 'Mes voyages',
      searchPlaceholder: 'Rechercher un voyage',
      filters: {
        all: 'Tous',
        upcoming: 'À venir',
        past: 'Passés',
        ongoing: 'En cours',
        favorites: 'Favoris',
      },
      listView: 'Liste',
      mapView: 'Carte',
      empty: 'Aucun voyage',
      openDetails: 'Ouvrir le détail',
    },
    profile: {
      title: 'Profil',
      nameLabel: 'Nom',
      edit: 'Éditer le profil',
      username: "Nom d'utilisateur",
      avatar: 'Photo de profil',
      save: 'Enregistrer',
      settings: 'Réglages',
      logout: 'Déconnexion',
      logoutSubtitle: 'Se déconnecter de votre compte',
      statsTrips: 'Voyages',
      statsPhotos: 'Photos',
      statsFavorites: 'Favoris',
      changeLanguage: 'Changer de langue',
    },
    notifications: {
      title: 'Test Notifications',
      initialize: 'Initialiser les notifications',
      immediate: 'Notification immédiate',
      in5s: 'Programmer (5 secondes)',
      in30s: 'Programmer (30 secondes)',
      badgeFive: 'Badge: 5',
      clearBadge: 'Effacer badge',
      results: 'Résultats des tests',
      empty: 'Aucun résultat pour le moment',
      simulatorInfo: 'Mode simulateur: les notifications push nécessitent un appareil physique.',
    },
    addTrip: {
      title: 'Créer un voyage',
      cover: 'Photo de couverture',
      titleLabel: 'Titre du voyage',
      destination: 'Destination',
      destinationHint: 'Ville, Pays',
      city: 'Ville',
      country: 'Pays',
      useLocation: 'Utiliser ma position',
      startDate: 'Date de départ',
      endDate: 'Date de retour',
      description: 'Description',
      create: 'Créer le voyage',
      uploading: 'Enregistrement...',
      required: 'Le titre est obligatoire',
      destinationFormat: 'Format attendu: Ville, Pays',
      dateError: 'La date de retour doit être après la date de départ',
      success: 'Votre voyage a été créé !',
      failure: 'Impossible de créer le voyage',
      permissionCamera: 'Nous avons besoin de la caméra pour prendre des photos.',
      permissionLibrary: 'Nous avons besoin de la galerie pour choisir une image.',
      permissionLocation: 'Nous avons besoin de la localisation pour détecter la destination.',
    },
    collection: {
      title: 'Collection',
      filterCountry: 'Pays',
      filterTrip: 'Voyage',
      filterFrom: 'Du',
      filterTo: 'Au',
      empty: 'Aucune photo trouvée',
      totalPhotos: '{{count}} photo(s)',
    },
    settingsPage: {
      title: 'Paramètres',
      searchPlaceholder: 'Rechercher un paramètre',
      appearance: 'Apparence',
      language: 'Langue',
      offline: 'Hors ligne',
      notifications: 'Notifications',
      logout: 'Déconnexion',
      enableNotifications: 'Activer les notifications',
      disableNotifications: 'Désactiver les notifications',
      notificationStatus: 'Notifications: {{status}}',
      statusOn: 'activées',
      statusOff: 'désactivées',
    },
  },
  en: {
    tabs: {
      home: 'Home',
      trips: 'Trips',
      profile: 'Profile',
      notifications: 'Notifications',
      settings: 'Settings',
      collection: 'Collection',
    },
    general: {
      loading: 'Loading...',
      retry: 'Retry',
      error: 'Something went wrong',
      offline: 'Offline',
      syncNow: 'Sync now',
      seeAll: 'See all',
    },
    auth: {
      loginTitle: 'Sign in to your account',
      registerTitle: 'Create a new account',
      email: 'Email',
      password: 'Password',
      username: 'Username',
      forgot: 'Forgot password?',
      switchToRegister: 'No account yet? Register',
      switchToLogin: 'Already have an account? Sign in',
      loginCta: 'Sign in',
      registerCta: 'Register',
      invalidEmail: 'Invalid email',
      invalidPassword: 'Password too short (min 8 chars)',
      invalidUsername: 'Username is required',
    },
    home: {
      greeting: 'Hello',
      statsTrips: 'Trips',
      statsPhotos: 'Photos',
      statsCountries: 'Countries',
      upcoming: 'Upcoming trips',
      quickActions: 'Quick actions',
      filters: 'Filters',
      recentActivity: 'Recent activity',
      daysLeft: 'In {{count}} days',
      newTrip: 'New trip',
      addPhoto: 'Add photo',
      explore: 'Explore',
      notification: 'Notifications',
    },
    trips: {
      title: 'My trips',
      searchPlaceholder: 'Search trips',
      filters: {
        all: 'All',
        upcoming: 'Upcoming',
        past: 'Past',
        ongoing: 'Ongoing',
        favorites: 'Favorites',
      },
      listView: 'List',
      mapView: 'Map',
      empty: 'No trip yet',
      openDetails: 'Open details',
    },
    profile: {
      title: 'Profile',
      nameLabel: 'Name',
      edit: 'Edit profile',
      username: 'Username',
      avatar: 'Profile photo',
      save: 'Save',
      settings: 'Settings',
      logout: 'Logout',
      logoutSubtitle: 'Sign out from your account',
      statsTrips: 'Trips',
      statsPhotos: 'Photos',
      statsFavorites: 'Favorites',
      changeLanguage: 'Change language',
    },
    notifications: {
      title: 'Notification tests',
      initialize: 'Initialize notifications',
      immediate: 'Immediate notification',
      in5s: 'Schedule (5 seconds)',
      in30s: 'Schedule (30 seconds)',
      badgeFive: 'Badge: 5',
      clearBadge: 'Clear badge',
      results: 'Test results',
      empty: 'No results yet',
      simulatorInfo: 'Simulator mode: push tokens require a physical device.',
    },
    addTrip: {
      title: 'Create a trip',
      cover: 'Cover photo',
      titleLabel: 'Trip title',
      destination: 'Destination',
      destinationHint: 'City, Country',
      city: 'City',
      country: 'Country',
      useLocation: 'Use my location',
      startDate: 'Start date',
      endDate: 'End date',
      description: 'Description',
      create: 'Create trip',
      uploading: 'Saving...',
      required: 'Title is required',
      destinationFormat: 'Expected format: City, Country',
      dateError: 'End date must be after start date',
      success: 'Trip created!',
      failure: 'Unable to create the trip',
      permissionCamera: 'Camera permission is required to take a picture.',
      permissionLibrary: 'Library permission is required to pick an image.',
      permissionLocation: 'Location permission is required to detect the destination.',
    },
    collection: {
      title: 'Collection',
      filterCountry: 'Country',
      filterTrip: 'Trip',
      filterFrom: 'From',
      filterTo: 'To',
      empty: 'No photos found',
      totalPhotos: '{{count}} photo(s)',
    },
    settingsPage: {
      title: 'Settings',
      searchPlaceholder: 'Search a setting',
      appearance: 'Appearance',
      language: 'Language',
      offline: 'Offline',
      notifications: 'Notifications',
      logout: 'Logout',
      enableNotifications: 'Enable notifications',
      disableNotifications: 'Disable notifications',
      notificationStatus: 'Notifications: {{status}}',
      statusOn: 'on',
      statusOff: 'off',
    },
  },
};

interface I18nContextShape {
  language: Language;
  isReady: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextShape | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('fr');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'fr' || stored === 'en') {
          setLanguageState(stored);
        }
      })
      .finally(() => setIsReady(true));
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const parts = key.split('.');
      let current: any = translations[language];
      for (const part of parts) {
        if (current && typeof current === 'object') {
          current = current[part];
        }
      }
      if (typeof current !== 'string') return key;
      if (!params) return current;
      return Object.entries(params).reduce(
        (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
        current
      );
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      isReady,
      setLanguage,
      t: translate,
    }),
    [language, isReady, setLanguage, translate]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within LanguageProvider');
  }
  return context;
};
