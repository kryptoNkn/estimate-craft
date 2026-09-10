import type { ApiErrorBody, LoginResponse, User } from './types';
import {
  clearToken,
  getRefreshToken,
  getToken,
  setTokens,
} from './auth-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8001';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return body.error ?? 'Request failed';
  } catch {
    return 'Request failed';
  }
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        clearToken();
        return null;
      }

      const body = (await response.json()) as LoginResponse;
      setTokens(body.access_token, body.refresh_token);
      return body.access_token;
    } catch {
      clearToken();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function shouldAttemptRefresh(path: string): boolean {
  return ![
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/api/v1/auth/logout',
    '/api/v1/auth/logout-all',
  ].includes(path);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const accessToken = token ?? getToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && shouldAttemptRefresh(path)) {
    const nextAccess = await refreshAccessToken();
    if (nextAccess) {
      return request<T>(path, options, nextAccess);
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function registerUser(email: string, password: string): Promise<User> {
  return request<User>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return request<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchCurrentUser(token?: string): Promise<User> {
  return request<User>('/api/v1/auth/me', { method: 'GET' }, token);
}

export async function logoutUser(): Promise<void> {
  const accessToken = getToken();
  const refreshToken = getRefreshToken();

  if (!accessToken || !refreshToken) {
    return;
  }

  try {
    await request<void>(
      '/api/v1/auth/logout',
      {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
      accessToken,
    );
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) {
      throw error;
    }
  }
}
