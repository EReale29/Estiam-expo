import { config } from '@/utils/env';
import { AuthTokens } from './auth';

export interface AuthApiResponse<TUser = any> {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: TUser;
}

export const buildTokens = (data: AuthApiResponse): AuthTokens => ({
  accessToken: data.accessToken,
  refreshToken: data.refreshToken || data.accessToken,
  expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
});

export const requestRefreshTokens = async (
  refreshToken: string,
  fetcher: typeof fetch = fetch
): Promise<AuthTokens | null> => {
  try {
    const response = await fetcher(`${config.mockBackendUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as AuthApiResponse;
    if (!data?.accessToken) {
      return null;
    }

    return buildTokens({ ...data, refreshToken });
  } catch (error) {
    return null;
  }
};
