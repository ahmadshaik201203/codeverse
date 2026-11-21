import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, apiFetchRaw, apiUrl, getApiBaseUrl, ApiError } from '@/lib/api';

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('API configuration', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    vi.stubEnv('NODE_ENV', 'development');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('uses NEXT_PUBLIC_API_URL and strips trailing slashes', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.codeverse.example/api/');

    expect(getApiBaseUrl()).toBe('https://api.codeverse.example/api');
    expect(apiUrl('/auth/login')).toBe('https://api.codeverse.example/api/auth/login');
  });

  it('keeps local development working when the variable is unset', () => {
    expect(getApiBaseUrl()).toBe('http://localhost:5000/api');
  });

  it('rejects an invalid API URL with a clear configuration error', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'not-a-url');

    try {
      getApiBaseUrl();
      throw new Error('expected getApiBaseUrl to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe('API_CONFIG_INVALID');
    }
  });

  it('fails clearly in production instead of calling localhost', () => {
    vi.stubEnv('NODE_ENV', 'production');

    try {
      getApiBaseUrl();
      throw new Error('expected getApiBaseUrl to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe('API_NOT_CONFIGURED');
      expect((error as ApiError).message).toMatch(/not configured/i);
    }
  });
});

describe('apiFetch error handling', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.codeverse.example/api');
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('sends the stored token and returns parsed data', async () => {
    localStorage.setItem('token', 'session-token');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(200, { user: { email: 'student@codeverse.test' } }));

    const data = await apiFetch<{ user: { email: string } }>('/auth/me');

    expect(data.user.email).toBe('student@codeverse.test');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.codeverse.example/api/auth/me');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer session-token');
  });

  it('surfaces the server message and code for a rejected request', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(422, {
        error: { code: 'FIELD_NOT_EDITABLE', message: 'skills is managed by the server.' },
        requestId: 'req-1',
      })
    );

    await expect(apiFetch('/portfolio/me', { method: 'PUT', body: '{}' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      code: 'FIELD_NOT_EDITABLE',
      message: 'skills is managed by the server.',
      requestId: 'req-1',
    });
  });

  it('clears a rejected session token on 401', async () => {
    localStorage.setItem('token', 'expired');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } })
    );

    await expect(apiFetch('/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('reports an unreachable API as a network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiFetch('/domains')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
    });
  });

  it('returns the raw response from apiFetchRaw so callers can branch', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(503, { error: { code: 'AI_UNAVAILABLE' } }));

    const response = await apiFetchRaw('/ai/project-blueprint', { method: 'POST', body: '{}' });

    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe('AI_UNAVAILABLE');
  });
});
