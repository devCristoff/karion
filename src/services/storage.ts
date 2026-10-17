import { MonthlyChallenge, Person, Task } from '../types';
import { authService } from './auth';

// User-scoped storage keys helper to avoid data leaking between different users on the same browser
function getKey(base: string): string {
  const user = authService.getCachedUser();
  return user ? `kairon_${user.id}_${base}_v2` : `kairon_${base}_v2`;
}

// No mock data - completely clean and empty initial state
const INITIAL_PEOPLE:     Person[]           = [];
const INITIAL_CHALLENGES: MonthlyChallenge[] = [];
const INITIAL_TASKS:      Task[]             = [];

export interface KaironDatabasePayload {
  version:    string;
  savedAt:    string;
  tasks:      Task[];
  challenges: MonthlyChallenge[];
  people:     Person[];
}

export const storageService = {
  // ─── Local Cache (localStorage scoped by user) ─────────────────────────────

  /** Synchronously loads tasks from local user-scoped cache */
  getTasks(): Task[] {
    try {
      const data = localStorage.getItem(getKey('tasks'));
      if (!data) return INITIAL_TASKS;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  },

  /** Synchronously loads challenges from local user-scoped cache */
  getChallenges(): MonthlyChallenge[] {
    try {
      const data = localStorage.getItem(getKey('challenges'));
      if (!data) return INITIAL_CHALLENGES;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : INITIAL_CHALLENGES;
    } catch {
      return INITIAL_CHALLENGES;
    }
  },

  /** Synchronously loads people/agents from local user-scoped cache */
  getPeople(): Person[] {
    try {
      const data = localStorage.getItem(getKey('people'));
      if (!data) return INITIAL_PEOPLE;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : INITIAL_PEOPLE;
    } catch {
      return INITIAL_PEOPLE;
    }
  },

  /** Gets the timestamp of the last server save */
  getLastSaved(): string {
    return localStorage.getItem(getKey('last_saved')) || new Date().toISOString();
  },

  updateLastSaved(): void {
    localStorage.setItem(getKey('last_saved'), new Date().toISOString());
  },

  // ─── Bulk Save (localStorage + /api/data POST with Bearer token) ───────────

  /**
   * Saves tasks locally and syncs the full state to the user's SQLite records.
   */
  saveTasks(tasks: Task[]): void {
    const safe = Array.isArray(tasks) ? tasks : [];
    localStorage.setItem(getKey('tasks'), JSON.stringify(safe));
    this.updateLastSaved();
    this.syncToServer();
  },

  /**
   * Saves challenges locally and syncs the full state to the user's SQLite records.
   */
  saveChallenges(challenges: MonthlyChallenge[]): void {
    const safe = Array.isArray(challenges) ? challenges : [];
    localStorage.setItem(getKey('challenges'), JSON.stringify(safe));
    this.updateLastSaved();
    this.syncToServer();
  },

  /**
   * Saves people locally and syncs the full state to the user's SQLite records.
   */
  savePeople(people: Person[]): void {
    const safe = Array.isArray(people) ? people : [];
    localStorage.setItem(getKey('people'), JSON.stringify(safe));
    this.updateLastSaved();
    this.syncToServer();
  },

  // ─── Granular Single-Entity Operations ─────────────────────────────────────

  /**
   * Upserts a single task in SQLite scoped to the authenticated user.
   */
  async saveTask(task: Task): Promise<void> {
    const current = this.getTasks();
    const exists  = current.some(t => t.id === task.id);
    const updated = exists
      ? current.map(t => (t.id === task.id ? task : t))
      : [task, ...current];
    localStorage.setItem(getKey('tasks'), JSON.stringify(updated));
    this.updateLastSaved();
    try {
      await fetch('/api/tasks', {
        method:  'POST',
        headers: authService.getAuthHeaders(),
        body:    JSON.stringify(task),
      });
    } catch { /* offline — localStorage already updated */ }
  },

  /**
   * Deletes a single task from SQLite and user cache.
   */
  async removeTask(id: string): Promise<void> {
    const updated = this.getTasks().filter(t => t.id !== id);
    localStorage.setItem(getKey('tasks'), JSON.stringify(updated));
    this.updateLastSaved();
    try {
      await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
        method:  'DELETE',
        headers: authService.getAuthHeaders(),
      });
    } catch { /* offline */ }
  },

  /**
   * Upserts a single challenge in SQLite scoped to the authenticated user.
   */
  async saveChallenge(challenge: MonthlyChallenge): Promise<void> {
    const current = this.getChallenges();
    const exists  = current.some(c => c.id === challenge.id);
    const updated = exists
      ? current.map(c => (c.id === challenge.id ? challenge : c))
      : [challenge, ...current];
    localStorage.setItem(getKey('challenges'), JSON.stringify(updated));
    this.updateLastSaved();
    try {
      await fetch('/api/challenges', {
        method:  'POST',
        headers: authService.getAuthHeaders(),
        body:    JSON.stringify(challenge),
      });
    } catch { /* offline */ }
  },

  /**
   * Deletes a single challenge from SQLite and user cache.
   */
  async removeChallenge(id: string): Promise<void> {
    const updated = this.getChallenges().filter(c => c.id !== id);
    localStorage.setItem(getKey('challenges'), JSON.stringify(updated));
    this.updateLastSaved();
    try {
      await fetch(`/api/challenges/${encodeURIComponent(id)}`, {
        method:  'DELETE',
        headers: authService.getAuthHeaders(),
      });
    } catch { /* offline */ }
  },

  /**
   * Upserts a single person in SQLite scoped to the authenticated user.
   */
  async savePerson(person: Person): Promise<void> {
    const current = this.getPeople();
    const exists  = current.some(p => p.id === person.id);
    const updated = exists
      ? current.map(p => (p.id === person.id ? person : p))
      : [...current, person];
    localStorage.setItem(getKey('people'), JSON.stringify(updated));
    this.updateLastSaved();
    try {
      await fetch('/api/people', {
        method:  'POST',
        headers: authService.getAuthHeaders(),
        body:    JSON.stringify(person),
      });
    } catch { /* offline */ }
  },

  /**
   * Deletes a single person from SQLite and user cache.
   */
  async removePerson(id: string): Promise<void> {
    const updated = this.getPeople().filter(p => p.id !== id);
    localStorage.setItem(getKey('people'), JSON.stringify(updated));
    this.updateLastSaved();
    try {
      await fetch(`/api/people/${encodeURIComponent(id)}`, {
        method:  'DELETE',
        headers: authService.getAuthHeaders(),
      });
    } catch { /* offline */ }
  },

  // ─── Server Sync ────────────────────────────────────────────────────────────

  /**
   * Fetches the complete dataset for the active user from SQLite (/api/data GET)
   */
  async fetchFromServer(): Promise<KaironDatabasePayload | null> {
    try {
      const res = await fetch('/api/data', {
        headers: authService.getAuthHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && typeof data === 'object') {
        const tasks      = Array.isArray(data.tasks)      ? data.tasks      : [];
        const challenges = Array.isArray(data.challenges)  ? data.challenges : [];
        const people     = Array.isArray(data.people)      ? data.people     : [];

        localStorage.setItem(getKey('tasks'),      JSON.stringify(tasks));
        localStorage.setItem(getKey('challenges'), JSON.stringify(challenges));
        localStorage.setItem(getKey('people'),     JSON.stringify(people));
        if (data.savedAt) {
          localStorage.setItem(getKey('last_saved'), data.savedAt);
        }

        return {
          version:    data.version || '1.0',
          savedAt:    data.savedAt || new Date().toISOString(),
          tasks,
          challenges,
          people,
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Syncs the current user's state to SQLite via POST /api/data.
   * Retries up to 3 times with linear backoff (600 ms, 1200 ms) on
   * network errors so a momentary offline blip does not silently lose data.
   */
  async syncToServer(): Promise<boolean> {
    const MAX_RETRIES = 3;
    const payload: KaironDatabasePayload = {
      version:    '1.0',
      savedAt:    new Date().toISOString(),
      tasks:      this.getTasks(),
      challenges: this.getChallenges(),
      people:     this.getPeople(),
    };

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await fetch('/api/data', {
          method:  'POST',
          headers: authService.getAuthHeaders(),
          body:    JSON.stringify(payload),
        });
        if (res.ok) return true;
      } catch { /* network error — will retry */ }

      if (attempt < MAX_RETRIES - 1) {
        await new Promise<void>(resolve => setTimeout(resolve, 600 * (attempt + 1)));
      }
    }
    return false;
  },
};
