import { config } from '@/utils/env';
import * as SecureStore from 'expo-secure-store';
import { decodeJWTStrict, isTokenExpired as isTokenExpiredStrict } from '@/utils/jwt';
import { AuthApiResponse, buildTokens, requestRefreshTokens } from './auth-core';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  username: string;
  name?: string;
}

interface StoredAuthState {
  tokens: AuthTokens | null;
  user: User | null;
}

const KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER_DATA: 'auth_user_data',
  TOKEN_EXPIRY: 'auth_token_expiry',
};

const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    try {
      if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
        await SecureStore.setItemAsync(key, value);
        return;
      }
    } catch (e) {
      // fall through to localStorage
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  async get(key: string): Promise<string | null> {
    try {
      if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
        return await SecureStore.getItemAsync(key);
      }
    } catch (e) {
      // fall back
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async remove(key: string): Promise<void> {
    try {
      if (SecureStore && typeof SecureStore.deleteItemAsync === 'function') {
        await SecureStore.deleteItemAsync(key);
        return;
      }
    } catch (e) {
      // fall through
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

let refreshPromise: Promise<AuthTokens | null> | null = null;

const saveTokens = async (tokens: AuthTokens): Promise<void> => {
  await Promise.all([
    secureStorage.set(KEYS.ACCESS_TOKEN, tokens.accessToken),
    secureStorage.set(KEYS.REFRESH_TOKEN, tokens.refreshToken),
    secureStorage.set(KEYS.TOKEN_EXPIRY, tokens.expiresAt.toString()),
  ]);
};

const getTokens = async (): Promise<AuthTokens | null> => {
  const [accessToken, refreshToken, expiresAt] = await Promise.all([
    secureStorage.get(KEYS.ACCESS_TOKEN),
    secureStorage.get(KEYS.REFRESH_TOKEN),
    secureStorage.get(KEYS.TOKEN_EXPIRY),
  ]);

  if (!accessToken || !refreshToken || !expiresAt) return null;
  return {
    accessToken,
    refreshToken,
    expiresAt: parseInt(expiresAt, 10),
  };
};

const clearTokens = async (): Promise<void> => {
  await Promise.all([
    secureStorage.remove(KEYS.ACCESS_TOKEN),
    secureStorage.remove(KEYS.REFRESH_TOKEN),
    secureStorage.remove(KEYS.TOKEN_EXPIRY),
  ]);
};

const saveUser = async (user: User): Promise<void> => {
  await secureStorage.set(KEYS.USER_DATA, JSON.stringify(user));
};

const getUser = async (): Promise<User | null> => {
  const stored = await secureStorage.get(KEYS.USER_DATA);
  return stored ? (JSON.parse(stored) as User) : null;
};

const clearUser = async (): Promise<void> => {
  await secureStorage.remove(KEYS.USER_DATA);
};

const parseAuthResponse = (data: AuthApiResponse<User>): StoredAuthState => {
  if (!data?.accessToken || !data.user) {
    throw new Error('Invalid response from server');
  }
  const tokens = buildTokens(data);
  return { user: data.user, tokens };
};

const handleAuthCall = async (endpoint: string, body: any): Promise<StoredAuthState> => {
  const response = await fetch(`${config.mockBackendUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const message = err.error || err.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  const data = (await response.json()) as AuthApiResponse<User>;
  return parseAuthResponse(data);
};

export const auth = {
  async saveTokens(tokens: AuthTokens) {
    await saveTokens(tokens);
  },
  async getTokens() {
    return getTokens();
  },
  async clearTokens() {
    await clearTokens();
  },
  async saveUser(user: User) {
    await saveUser(user);
  },
  async getUser() {
    return getUser();
  },
  async clearUser() {
    await clearUser();
  },
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const { user, tokens } = await handleAuthCall('/auth/login', credentials);
    await Promise.all([saveTokens(tokens), saveUser(user)]);
    return { user, tokens };
  },
  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const { user, tokens } = await handleAuthCall('/auth/register', data);
    await Promise.all([saveTokens(tokens), saveUser(user)]);
    return { user, tokens };
  },
  async loadProfile(): Promise<User> {
    const response = await this.fetch(`${config.mockBackendUrl}/me`);
    if (!response.ok) {
      throw new Error('Unable to load profile');
    }
    const body = (await response.json()) as { user: User };
    if (!body?.user) throw new Error('Invalid profile payload');
    await saveUser(body.user);
    return body.user;
  },
  async logout(): Promise<void> {
    try {
      const tokens = await getTokens();
      if (tokens?.accessToken) {
        await fetch(`${config.mockBackendUrl}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
      }
    } catch {
      // ignore logout failures
    }
    await Promise.all([clearTokens(), clearUser()]);
  },
  async refreshTokens(): Promise<AuthTokens | null> {
    if (refreshPromise) return refreshPromise;
    const tokens = await getTokens();
    if (!tokens?.refreshToken) return null;

    refreshPromise = requestRefreshTokens(tokens.refreshToken).finally(() => {
      refreshPromise = null;
    });

    const refreshed = await refreshPromise;
    if (refreshed) {
      await saveTokens(refreshed);
    }
    return refreshed;
  },
  async getAuthState(): Promise<{ user: User | null; tokens: AuthTokens | null; isAuthenticated: boolean }> {
    try {
      const [storedUser, storedTokens] = await Promise.all([getUser(), getTokens()]);
      if (!storedUser || !storedTokens) {
        return { user: null, tokens: null, isAuthenticated: false };
      }

      try {
        decodeJWTStrict(storedTokens.accessToken);
      } catch {
        const refreshed = await this.refreshTokens();
        if (!refreshed) {
          await this.logout();
          return { user: null, tokens: null, isAuthenticated: false };
        }
        return { user: storedUser, tokens: refreshed, isAuthenticated: true };
      }

      if (isTokenExpiredStrict(storedTokens.accessToken)) {
        const refreshed = await this.refreshTokens();
        if (!refreshed) {
          await this.logout();
          return { user: null, tokens: null, isAuthenticated: false };
        }
        return { user: storedUser, tokens: refreshed, isAuthenticated: true };
      }

      return { user: storedUser, tokens: storedTokens, isAuthenticated: true };
    } catch {
      await this.logout();
      return { user: null, tokens: null, isAuthenticated: false };
    }
  },
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    let tokens = await getTokens();
    if (!tokens?.accessToken) throw new Error('Not authenticated');

    if (isTokenExpiredStrict(tokens.accessToken)) {
      const refreshed = await this.refreshTokens();
      if (!refreshed) throw new Error('Session expired');
      tokens = refreshed;
    }

    const mergedHeaders: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
      Authorization: `Bearer ${tokens.accessToken}`,
    };

    let response = await fetch(url, { ...options, headers: mergedHeaders });

    if (response.status === 401) {
      const refreshed = await this.refreshTokens();
      if (!refreshed) {
        await this.logout();
        throw new Error('Session expired');
      }
      const retryHeaders: Record<string, string> = {
        ...((options.headers as Record<string, string>) || {}),
        Authorization: `Bearer ${refreshed.accessToken}`,
      };
      response = await fetch(url, { ...options, headers: retryHeaders });
    }

    return response;
  },
};

export { isTokenExpiredStrict as isTokenExpired, decodeJWTStrict as decodeJWT };
