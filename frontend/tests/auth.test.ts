import assert from 'node:assert';
import test from 'node:test';

import { decodeJWTStrict, isTokenExpired } from '../utils/jwt';
import { requestRefreshTokens } from '../services/auth-core';

const buildToken = (payload: Record<string, any>) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
};

test('decodeJWTStrict decodes valid payload', () => {
  const token = buildToken({ exp: Math.floor(Date.now() / 1000) + 60, foo: 'bar' });
  const decoded = decodeJWTStrict(token);
  assert.strictEqual(decoded.foo, 'bar');
});

test('decodeJWTStrict throws on missing exp', () => {
  const token = buildToken({ sub: '123' });
  assert.throws(() => decodeJWTStrict(token));
});

test('isTokenExpired returns true for expired tokens', () => {
  const expired = buildToken({ exp: Math.floor(Date.now() / 1000) - 10 });
  assert.strictEqual(isTokenExpired(expired), true);
});

test('isTokenExpired returns false for fresh tokens', () => {
  const fresh = buildToken({ exp: Math.floor(Date.now() / 1000) + 300 });
  assert.strictEqual(isTokenExpired(fresh), false);
});

test('requestRefreshTokens parses refresh response', async () => {
  const fakeFetch: typeof fetch = async () =>
    new Response(JSON.stringify({ accessToken: 'new-token', expiresIn: 10 }), { status: 200 });

  const tokens = await requestRefreshTokens('refresh-token', fakeFetch);
  assert(tokens);
  assert.strictEqual(tokens?.accessToken, 'new-token');
  assert.strictEqual(tokens?.refreshToken, 'refresh-token');
});
