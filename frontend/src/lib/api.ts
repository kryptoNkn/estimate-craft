import type { ApiErrorBody, LoginResponse, User } from './types';

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

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await parseError(response));
  }

  return response.json() as Promise<T>;
}

export async function registerUser(
  email: string,
  password: string,
): Promise<User> {
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

export async function fetchCurrentUser(token: string): Promise<User> {
  return request<User>('/api/v1/auth/me', { method: 'GET' }, token);
}
