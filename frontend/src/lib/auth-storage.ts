const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getInitials(email: string): string {
  const localPart = email.split('@')[0] ?? email;
  const parts = localPart.split(/[._-]/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return localPart.slice(0, 2).toUpperCase();
}

export function formatRole(role: string): string {
  const labels: Record<string, string> = {
    user: 'Пользователь',
    admin: 'Администратор',
  };

  return labels[role] ?? role;
}

export function displayName(email: string): string {
  const localPart = email.split('@')[0] ?? email;
  const parts = localPart.split(/[._-]/).filter(Boolean);

  if (parts.length >= 2) {
    const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const lastInitial = parts[1].charAt(0).toUpperCase();
    return `${first} ${lastInitial}.`;
  }

  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}
