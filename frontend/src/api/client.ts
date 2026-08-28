const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('wp-admin-token', token);
  } else {
    localStorage.removeItem('wp-admin-token');
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('wp-admin-token');
  }
  return authToken;
}

export function isAdmin(): boolean {
  return !!getAuthToken();
}

// ---- Country session (per-country login) ----
const COUNTRY_TOKEN_KEY = 'wp-country-token';
const COUNTRY_ID_KEY = 'wp-country-id';

export function setCountrySession(token: string, countryId: string) {
  localStorage.setItem(COUNTRY_TOKEN_KEY, token);
  localStorage.setItem(COUNTRY_ID_KEY, countryId);
}

export function clearCountrySession() {
  localStorage.removeItem(COUNTRY_TOKEN_KEY);
  localStorage.removeItem(COUNTRY_ID_KEY);
}

export function getCountryToken(): string | null {
  return localStorage.getItem(COUNTRY_TOKEN_KEY);
}

export function getCountryId(): string | null {
  return localStorage.getItem(COUNTRY_ID_KEY);
}

// request accepts an optional token. Defaults to the admin token when absent.
async function request<T>(path: string, options: RequestInit = {}, tokenOverride?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const token = tokenOverride !== undefined ? tokenOverride : getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (tokenOverride === null) {
    delete headers['Authorization'];
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `API error: ${res.status}`);
  }

  return res.json();
}

// Game config
export const gameApi = {
  get: () => request<any>('/api/game'),
  update: (data: { gameDay?: number; gameDate?: string }) => request<any>('/api/game', { method: 'PATCH', body: JSON.stringify(data) }),
  nextDay: () => request<any>('/api/game/next-day', { method: 'POST' }),
  createSnapshot: (data: any) => request<any>('/api/game/snapshot', { method: 'POST', body: JSON.stringify(data) }),
};

// Full serialized game state (single source of truth)
export const gameStateApi = {
  get: () => request<{ data: any | null }>('/api/game/state'),
  save: (data: any) => request<any>('/api/game/state', { method: 'PUT', body: JSON.stringify({ data }) }),
};

// Countries
export const countriesApi = {
  list: () => request<any[]>('/api/countries'),
  get: (id: string) => request<any>(`/api/countries/${id}`),
  create: (data: any) => request<any>('/api/countries', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/api/countries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/countries/${id}`, { method: 'DELETE' }),
  toggleDead: (id: string) => request<any>(`/api/countries/${id}/dead`, { method: 'POST' }),
  setPassword: (id: string, password: string) => request<any>(`/api/countries/${id}/password`, { method: 'POST', body: JSON.stringify({ password }) }),
  updateSelf: (id: string, data: any) => request<any>(`/api/countries/${id}/self`, { method: 'PATCH', body: JSON.stringify(data) }, getCountryToken()),
};

// Battles
export const battlesApi = {
  list: () => request<any[]>('/api/battles'),
  create: (data: any) => request<any>('/api/battles', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/battles/${id}`, { method: 'DELETE' }),
};

// Wars
export const warsApi = {
  list: () => request<any[]>('/api/wars'),
  create: (data: any) => request<any>('/api/wars', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/api/wars/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/wars/${id}`, { method: 'DELETE' }),
  addScore: (warId: string, data: any) => request<any>(`/api/wars/${warId}/score`, { method: 'POST', body: JSON.stringify(data) }),
};

// Territories
export const territoriesApi = {
  list: () => request<any[]>('/api/territories'),
  create: (data: any) => request<any>('/api/territories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/api/territories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/territories/${id}`, { method: 'DELETE' }),
};

// Treaties
export const treatiesApi = {
  list: () => request<any[]>('/api/treaties'),
  create: (data: any) => request<any>('/api/treaties', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/api/treaties/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/treaties/${id}`, { method: 'DELETE' }),
};

// Military
export const militaryApi = {
  get: () => request<any>('/api/military'),
  update: (data: any) => request<any>('/api/military', { method: 'PATCH', body: JSON.stringify(data) }),
};

// Expenses
export const expensesApi = {
  list: () => request<any[]>('/api/expenses'),
  create: (data: any) => request<any>('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/expenses/${id}`, { method: 'DELETE' }),
};

// Money changes
export const moneyChangesApi = {
  list: () => request<any[]>('/api/money-changes'),
  create: (data: any) => request<any>('/api/money-changes', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/money-changes/${id}`, { method: 'DELETE' }),
};

// MP changes
export const mpChangesApi = {
  list: () => request<any[]>('/api/mp-changes'),
  create: (data: any) => request<any>('/api/mp-changes', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/mp-changes/${id}`, { method: 'DELETE' }),
};

// Notes
export const notesApi = {
  list: (countryId?: string) => request<any[]>(`/api/notes${countryId ? `?countryId=${countryId}` : ''}`),
  listAll: () => request<any[]>('/api/notes/all'),
  create: (data: any) => request<any>('/api/notes', { method: 'POST', body: JSON.stringify(data) }, getCountryToken()),
  reply: (id: string, data: any) => request<any>(`/api/notes/${id}/reply`, { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/notes/${id}`, { method: 'DELETE' }),
};

// Snapshots
export const snapshotsApi = {
  listByDay: (day: number) => request<any[]>(`/api/snapshots?day=${day}`),
  listDays: () => request<any[]>('/api/snapshots/all'),
};

// Auth
export const authApi = {
  login: (password: string) => request<{ token: string; role: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  countryLogin: (country: string, password: string) => request<{ token: string; role: string; countryId: string; countryName: string }>('/api/auth/country-login', { method: 'POST', body: JSON.stringify({ countryName: country, password }) }),
  verify: () => request<{ valid: boolean; role?: 'admin' | 'country'; countryId?: string }>('/api/auth/verify'),
};
