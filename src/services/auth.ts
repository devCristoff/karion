import { User } from '../types';

const TOKEN_KEY = 'kairon_auth_token_v1';
const USER_KEY = 'kairon_cached_user_v1';

export const authService = {
  /**
   * Retrieves the current session token from localStorage
   */
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Saves the session token in localStorage
   */
  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },

  /**
   * Clears the session token
   */
  clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },

  /**
   * Retrieves the locally cached user profile
   */
  getCachedUser(): User | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCachedUser(user: User): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  },

  clearCachedUser(): void {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
  },

  /**
   * Helper that returns Authorization headers with Bearer token
   */
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  /**
   * Registers a new user account
   */
  async register(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Error al registrar usuario.');
    }

    this.setToken(data.token);
    this.setCachedUser(data.user);
    return data;
  },

  /**
   * Authenticates an existing user
   */
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Credenciales inválidas.');
    }

    this.setToken(data.token);
    this.setCachedUser(data.user);
    return data;
  },

  /**
   * Validates the active session against /api/auth/me
   */
  async fetchCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) {
      this.clearCachedUser();
      return null;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) {
        this.clearToken();
        this.clearCachedUser();
        return null;
      }

      const data = await res.json();
      if (data && data.user) {
        this.setCachedUser(data.user);
        return data.user;
      }
      return null;
    } catch {
      // If offline, fallback to cached user if available
      return this.getCachedUser();
    }
  },

  /**
   * Ends the user session both on server and locally
   */
  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch {
      // ignore
    } finally {
      this.clearToken();
      this.clearCachedUser();
    }
  },
};
