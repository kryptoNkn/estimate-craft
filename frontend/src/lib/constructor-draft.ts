const DRAFT_KEY = 'constructor_draft';

export interface ConstructorDraft {
  title: string;
  config: import('./types').HouseProjectConfig;
}

export function stashConstructorDraft(draft: ConstructorDraft): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function takeConstructorDraft(): ConstructorDraft | null {
  const raw = sessionStorage.getItem(DRAFT_KEY);
  if (!raw) {
    return null;
  }

  sessionStorage.removeItem(DRAFT_KEY);

  try {
    return JSON.parse(raw) as ConstructorDraft;
  } catch {
    return null;
  }
}
