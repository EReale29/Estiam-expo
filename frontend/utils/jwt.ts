export interface JwtPayload {
  exp?: number;
  [key: string]: any;
}

const decodeBase64 = (input: string) => {
  if (typeof atob === 'function') {
    return atob(input);
  }
  return Buffer.from(input, 'base64').toString('binary');
};

export const decodeJWTStrict = (token: string): JwtPayload => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is required');
  }
  const [, payload] = token.split('.');
  if (!payload) {
    throw new Error('Invalid token structure');
  }
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = decodeURIComponent(
    decodeBase64(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  const parsed = JSON.parse(decoded);
  if (!parsed.exp) {
    throw new Error('Token missing exp claim');
  }
  return parsed as JwtPayload;
};

export const isTokenExpired = (token: string, marginSeconds = 60): boolean => {
  const payload = decodeJWTStrict(token);
  const expiresAt = payload.exp * 1000;
  return Date.now() >= expiresAt - marginSeconds * 1000;
};
