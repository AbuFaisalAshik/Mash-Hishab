import { AppStateData, UserProfile } from '../types';

const TOKEN_KEY = 'mash_khoroch_auth_token_v1';

export function getStoredAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
  appState: AppStateData;
  generatedSeedPhrase?: string[];
  message?: string;
}

export type AuthUser = UserProfile;

export const authApi = {
  getToken: getStoredAuthToken,
  setToken: setStoredAuthToken,
  clearToken: clearStoredAuthToken,

  async register(params: {
    email: string;
    password: string;
    name?: string;
    nameBn?: string;
    nameEn?: string;
    phone?: string;
    monthlyBudget?: number;
    institutionOrJob?: string;
    preferredLanguage?: 'bn' | 'en';
    themeMode?: 'dark' | 'light' | 'system';
    createSeedPhrase?: boolean;
  }): Promise<AuthResponse> {
    const res = await apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setStoredAuthToken(res.token);
    return res;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredAuthToken(res.token);
    return res;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; debugCode?: string }> {
    return apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(params: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<AuthResponse> {
    const res = await apiFetch<AuthResponse>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setStoredAuthToken(res.token);
    return res;
  },

  async verifySeedPhrase(params: {
    email: string;
    seedPhrase: string;
  }): Promise<{
    verified: boolean;
    requiresEmailCode: boolean;
    emailHint: string;
    debugCode?: string;
    message: string;
  }> {
    return apiFetch('/api/auth/verify-seed-phrase', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async completeSeedRecovery(params: {
    email: string;
    seedPhrase: string;
    emailCode?: string;
    newPassword: string;
    emergencyOverride?: boolean;
  }): Promise<AuthResponse> {
    const res = await apiFetch<AuthResponse>('/api/auth/complete-seed-recovery', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setStoredAuthToken(res.token);
    return res;
  },

  async regenerateSeed(currentPassword: string): Promise<{
    success: boolean;
    seedPhrase: string[];
    user?: UserProfile;
    message: string;
  }> {
    return apiFetch('/api/auth/regenerate-seed-phrase', {
      method: 'POST',
      body: JSON.stringify({ currentPassword }),
    });
  },

  async regenerateSeedPhrase(currentPassword: string): Promise<{
    success: boolean;
    seedPhrase: string[];
    message: string;
  }> {
    return apiFetch('/api/auth/regenerate-seed-phrase', {
      method: 'POST',
      body: JSON.stringify({ currentPassword }),
    });
  },

  async logout(): Promise<void> {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout server notification failed:', e);
    } finally {
      clearStoredAuthToken();
    }
  },

  async getMe(): Promise<UserProfile> {
    const res = await apiFetch<{ user: UserProfile; appState: AppStateData; seedBackupEnabled: boolean }>('/api/auth/me');
    return res.user;
  },
};

export const dataApi = {
  fetchUserData: async (): Promise<AppStateData> => {
    return apiFetch<AppStateData>('/api/data');
  },
  getData: async (): Promise<AppStateData> => {
    return apiFetch<AppStateData>('/api/data');
  },

  syncUserData: async (state: AppStateData): Promise<{ success: boolean; updatedAt: number }> => {
    return apiFetch<{ success: boolean; updatedAt: number }>('/api/data/sync', {
      method: 'POST',
      body: JSON.stringify(state),
    });
  },
  syncData: async (state: AppStateData): Promise<{ success: boolean; updatedAt: number }> => {
    return apiFetch<{ success: boolean; updatedAt: number }>('/api/data/sync', {
      method: 'POST',
      body: JSON.stringify(state),
    });
  },

  clearUserData: async (): Promise<{ success: boolean; appState: AppStateData }> => {
    return apiFetch<{ success: boolean; appState: AppStateData }>('/api/data/clear', {
      method: 'DELETE',
    });
  },
};

export const adminApi = {
  getStats: async (): Promise<any> => {
    return apiFetch('/api/admin/stats');
  },
  getUsers: async (): Promise<{ users: any[]; total: number }> => {
    return apiFetch('/api/admin/users');
  },
  getUserDetails: async (userId: string): Promise<{ user: any; appState: AppStateData }> => {
    return apiFetch(`/api/admin/users/${userId}/details`);
  },
  resetUserPassword: async (userId: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    return apiFetch(`/api/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },
  toggleUserStatus: async (userId: string): Promise<{ success: boolean; status: string; message: string }> => {
    return apiFetch(`/api/admin/users/${userId}/toggle-status`, {
      method: 'POST',
    });
  },
  deleteUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
    return apiFetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },
  getAnnouncement: async (): Promise<any> => {
    return apiFetch('/api/admin/announcement');
  },
  setAnnouncement: async (params: { message: string; active: boolean; type?: string }): Promise<any> => {
    return apiFetch('/api/admin/announcement', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};

export const systemApi = {
  getAnnouncement: async (): Promise<any> => {
    return apiFetch('/api/system/announcement');
  },
};
