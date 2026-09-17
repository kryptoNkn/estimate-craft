import type { ApiErrorBody, HouseProjectConfig, LoginResponse, ProjectDetail, ProjectListResponse, User } from './types';
import {
  clearToken,
  getRefreshToken,
  getToken,
  setTokens,
} from './auth-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8001';

export class ApiError extends Error {
  status: number;
  retryAfterSeconds?: number;

  constructor(status: number, message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function parseRetryAfter(response: Response): number | undefined {
  const raw = response.headers.get('Retry-After');
  if (!raw) {
    return undefined;
  }

  const seconds = Number.parseInt(raw, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return body.error ?? 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export function formatApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      const wait = error.retryAfterSeconds;
      if (wait) {
        return `Слишком много попыток. Подождите ${wait} с и попробуйте снова.`;
      }
      return 'Слишком много попыток. Подождите немного и попробуйте снова.';
    }

    if (error.status === 409 && error.message === 'project was updated elsewhere') {
      return 'Проект уже изменили в другой вкладке. Обновите страницу, чтобы не затереть правки.';
    }

    return error.message;
  }

  return fallback;
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
    '/api/v1/auth/change-password',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
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
    throw new ApiError(
      response.status,
      await parseError(response),
      parseRetryAfter(response),
    );
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

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<LoginResponse> {
  return request<LoginResponse>('/api/v1/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}
export async function forgotPassword(email: string): Promise<void> {
  return request<void>('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<LoginResponse> {
  return request<LoginResponse>('/api/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function logoutAllUser(): Promise<void> {
  const accessToken = getToken();
  if (!accessToken) {
    return;
  }

  try {
    await request<void>('/api/v1/auth/logout-all', { method: 'POST' }, accessToken);
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) {
      throw error;
    }
  }
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

export async function listProjects(options: {
  q?: string;
  cursor?: string | null;
  limit?: number;
} = {}): Promise<ProjectListResponse> {
  const params = new URLSearchParams();
  if (options.q?.trim()) {
    params.set('q', options.q.trim());
  }
  if (options.cursor) {
    params.set('cursor', options.cursor);
  }
  if (options.limit) {
    params.set('limit', String(options.limit));
  }

  const query = params.toString();
  const path = query ? `/api/v1/projects?${query}` : '/api/v1/projects';
  return request<ProjectListResponse>(path, { method: 'GET' });
}

export async function getProject(id: string): Promise<ProjectDetail> {
  return request<ProjectDetail>(`/api/v1/projects/${id}`, { method: 'GET' });
}

export async function createProject(
  title: string,
  config: HouseProjectConfig,
): Promise<ProjectDetail> {
  return request<ProjectDetail>('/api/v1/projects', {
    method: 'POST',
    body: JSON.stringify({ title, config }),
  });
}

export async function updateProject(
  id: string,
  title: string,
  config: HouseProjectConfig,
  version: number,
): Promise<ProjectDetail> {
  return request<ProjectDetail>(`/api/v1/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title, config, version }),
  });
}

export async function deleteProject(id: string): Promise<void> {
  return request<void>(`/api/v1/projects/${id}`, { method: 'DELETE' });
}

export function safeInternalPath(value: string | null): string | undefined {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return undefined;
  }

  return value;
}
