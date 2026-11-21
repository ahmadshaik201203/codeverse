/**
 * Single source of truth for the CodeVerse API location.
 *
 * Every request in the client goes through this module. `NEXT_PUBLIC_API_URL`
 * must include the `/api` suffix, e.g. `https://api.codeverse.dev/api`. In
 * development an unset value falls back to the local server on port 5000; a
 * production build without configuration fails loudly instead of silently
 * calling a developer machine.
 */

type AuthTokenProvider = () => Promise<string | null>;

let authTokenProvider: AuthTokenProvider | null = null;

/**
 * Registers the source of the bearer token used for API calls. The Firebase
 * provider (AuthContext) installs it so this module never imports Firebase and
 * stays usable in tests and on the server.
 */
export const setAuthTokenProvider = (provider: AuthTokenProvider | null): void => {
  authTokenProvider = provider;
};

/**
 * Prefers a legacy application JWT if one is stored, then falls back to the
 * current Firebase ID token. The backend verifies whichever one it receives.
 */
const resolveAuthToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('token');
  if (stored) return stored;

  if (!authTokenProvider) return null;

  try {
    return await authTokenProvider();
  } catch {
    return null;
  }
};

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

let warnedAboutFallback = false;

/** Returns the configured base URL, or throws a clear, user-safe ApiError. */
export const getApiBaseUrl = (): string => {
  const configured = (process.env.NEXT_PUBLIC_API_URL ?? '').trim();

  if (configured) {
    if (!/^https?:\/\/[^\s]+$/i.test(configured)) {
      throw new ApiError(
        'The API address is not a valid http(s) URL. Check NEXT_PUBLIC_API_URL.',
        0,
        'API_CONFIG_INVALID'
      );
    }
    return trimTrailingSlashes(configured);
  }

  if (process.env.NODE_ENV !== 'production') {
    if (!warnedAboutFallback) {
      warnedAboutFallback = true;
      console.warn(
        '[CodeVerse] NEXT_PUBLIC_API_URL is not set; falling back to http://localhost:5000/api for local development.'
      );
    }
    return 'http://localhost:5000/api';
  }

  throw new ApiError(
    'The CodeVerse API address is not configured for this deployment. Set NEXT_PUBLIC_API_URL before building.',
    0,
    'API_NOT_CONFIGURED'
  );
};

export const isApiConfigured = (): boolean => {
  try {
    getApiBaseUrl();
    return true;
  } catch {
    return false;
  }
};

/** Builds an absolute API URL from an endpoint such as `/auth/login`. */
export const apiUrl = (endpoint: string): string => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${getApiBaseUrl()}${path}`;
};

export interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
  message?: string;
  requestId?: string;
}

/** Error carrying the HTTP status and machine code so callers can branch safely. */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly requestId?: string;

  constructor(message: string, status: number, code: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

const extractMessage = (data: ApiErrorBody, status: number): string => {
  if (data?.error?.message) return data.error.message;
  if (typeof data?.message === 'string' && data.message.length > 0) return data.message;
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  return 'An error occurred during the request.';
};

/**
 * Low-level request used by pages that need the raw `Response` (paginated lists,
 * streaming UI). Adds the stored session token and converts a transport failure
 * or a missing configuration into an ApiError.
 */
export const apiFetchRaw = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = apiUrl(endpoint);
  const token = await resolveAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    return response;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Cannot reach the CodeVerse API. Check your connection or that the server is running.',
      0,
      'NETWORK_ERROR'
    );
  }
};

// Default stays permissive so pre-existing call sites keep working; callers that
// care about the shape pass an explicit generic.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiFetch = async <T = Record<string, any>>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await apiFetchRaw(endpoint, options);

  const data = (await response.json().catch(() => ({}))) as ApiErrorBody;

  if (!response.ok) {
    throw new ApiError(
      extractMessage(data, response.status),
      response.status,
      data?.error?.code ?? 'REQUEST_FAILED',
      data?.requestId
    );
  }

  return data as T;
};
