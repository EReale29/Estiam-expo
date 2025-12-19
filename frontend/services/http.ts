import { config } from '@/utils/env';
import { auth } from './auth';

const DEFAULT_TIMEOUT = 10000;

const parseErrorMessage = async (response: Response) => {
  try {
    const body = await response.json();
    return body.error || body.message || response.statusText;
  } catch {
    return response.statusText;
  }
};

export const http = {
  async request<T>(path: string, options: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await auth.fetch(`${config.mockBackendUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      },
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      throw new Error(message || 'Request failed');
    }
    return (await response.json()) as T;
  },
};
