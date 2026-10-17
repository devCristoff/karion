/**
 * server/db.ts
 *
 * SQLite database layer for Kairon with User Security & Multi-User Isolation.
 * Runs exclusively in the Vite dev-server (Node.js) context via sqlitePlugin.
 * Uses better-sqlite3 for synchronous, high-performance local persistence.
 *
 * Security:
 *   - Native Node.js crypto (crypto.scryptSync, crypto.timingSafeEqual, crypto.randomBytes)
 *   - Secure session token management in SQLite (sessions table)
 *   - Zero external binary dependencies for authentication
 *   - Strict data partitioning: All tasks, challenges, and people are bound to a specific userId.
 */

import Database from 'better-sqlite3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// ─── Type Aliases ─────────────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface DbTask {
  id: string;
  userId?: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  category: string;
  urgent: boolean;
  important: boolean;
  assignedTo: string | null;
  challengeId: string | null;
  tags: string[];
  estimatedMinutes?: number;
  completedAt: string | null;
  createdAt: string;
}

export interface DbMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface DbChallenge {
  id: string;
  userId?: string;
  title: string;
  description: string;
  category: string;
  targetMonth: string;
  goalType: 'daily_habit' | 'numeric_target' | 'milestones';
  targetDays?: number;
  completedDates?: string[];
  targetCount?: number;
  currentCount?: number;
  unit?: string;
  milestones?: DbMilestone[];
  status: 'active' | 'completed' | 'paused' | 'failed';
  accentColor?: string;
  createdAt: string;
}

export interface DbPerson {
  id: string;
  userId?: string;
  name: string;
  type: 'person' | 'agent' | 'family' | 'service' | 'colleague';
  role: string;
  avatarColor: string;
  contactInfo?: string;
  notes?: string;
  createdAt: string;
}

export interface KaironPayload {
  version: string;
  savedAt: string;
  tasks: DbTask[];
  challenges: DbChallenge[];
  people: DbPerson[];
}

// ─── Database Initialisation ──────────────────────────────────────────────────

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.resolve(DATA_DIR, 'kairon.db');
const LEGACY_JSON_PATH = path.resolve(DATA_DIR, 'kairon_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);

// Performance & security pragmas
db.pragma('journal_mode = WAL');   // Non-blocking concurrent reads
db.pragma('foreign_keys = ON');    // Enforce relational integrity
db.pragma('cache_size = -4000');   // 4 MB page cache
db.pragma('synchronous = NORMAL'); // Balanced durability vs. speed

// ─── Schema Setup & Evolution ─────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    email        TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    passwordSalt TEXT NOT NULL,
    name         TEXT NOT NULL DEFAULT '',
    createdAt    TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

  CREATE TABLE IF NOT EXISTS sessions (
    token     TEXT PRIMARY KEY,
    userId    TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_userId    ON sessions(userId);
  CREATE INDEX IF NOT EXISTS idx_sessions_expiresAt ON sessions(expiresAt);

  CREATE TABLE IF NOT EXISTS tasks (
    id               TEXT    PRIMARY KEY,
    userId           TEXT,
    title            TEXT    NOT NULL DEFAULT '',
    description      TEXT    NOT NULL DEFAULT '',
    dueDate          TEXT    NOT NULL DEFAULT '',
    priority         TEXT    NOT NULL DEFAULT 'medium',
    status           TEXT    NOT NULL DEFAULT 'todo',
    category         TEXT    NOT NULL DEFAULT '',
    urgent           INTEGER NOT NULL DEFAULT 0,
    important        INTEGER NOT NULL DEFAULT 0,
    assignedTo       TEXT,
    challengeId      TEXT,
    estimatedMinutes INTEGER,
    completedAt      TEXT,
    createdAt        TEXT    NOT NULL DEFAULT '',
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS task_tags (
    taskId  TEXT NOT NULL,
    tag     TEXT NOT NULL,
    PRIMARY KEY (taskId, tag),
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_status      ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_assignedTo  ON tasks(assignedTo);
  CREATE INDEX IF NOT EXISTS idx_tasks_challengeId ON tasks(challengeId);
  CREATE INDEX IF NOT EXISTS idx_tasks_dueDate     ON tasks(dueDate);
  CREATE INDEX IF NOT EXISTS idx_tasks_priority    ON tasks(priority);

  CREATE TABLE IF NOT EXISTS challenges (
    id           TEXT    PRIMARY KEY,
    userId       TEXT,
    title        TEXT    NOT NULL DEFAULT '',
    description  TEXT    NOT NULL DEFAULT '',
    category     TEXT    NOT NULL DEFAULT '',
    targetMonth  TEXT    NOT NULL DEFAULT '',
    goalType     TEXT    NOT NULL DEFAULT 'daily_habit',
    targetDays   INTEGER,
    targetCount  INTEGER,
    currentCount INTEGER,
    unit         TEXT,
    status       TEXT    NOT NULL DEFAULT 'active',
    accentColor  TEXT,
    createdAt    TEXT    NOT NULL DEFAULT '',
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_challenges_targetMonth ON challenges(targetMonth);
  CREATE INDEX IF NOT EXISTS idx_challenges_status      ON challenges(status);

  CREATE TABLE IF NOT EXISTS challenge_completed_dates (
    challengeId TEXT NOT NULL,
    dateStr     TEXT NOT NULL,
    PRIMARY KEY (challengeId, dateStr),
    FOREIGN KEY (challengeId) REFERENCES challenges(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS challenge_milestones (
    id          TEXT    PRIMARY KEY,
    challengeId TEXT    NOT NULL,
    title       TEXT    NOT NULL DEFAULT '',
    completed   INTEGER NOT NULL DEFAULT 0,
    sortOrder   INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (challengeId) REFERENCES challenges(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS people (
    id          TEXT PRIMARY KEY,
    userId      TEXT,
    name        TEXT NOT NULL DEFAULT '',
    type        TEXT NOT NULL DEFAULT 'person',
    role        TEXT NOT NULL DEFAULT '',
    avatarColor TEXT NOT NULL DEFAULT '',
    contactInfo TEXT,
    notes       TEXT,
    createdAt   TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Migration helper for pre-existing tables created before userId column was added
function ensureColumn(table: string, column: string, typeDef: string) {
  try {
    const info = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!info.some((c) => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeDef}`);
    }
  } catch {
    // Column already exists or table busy
  }
}

ensureColumn('tasks', 'userId', 'TEXT');
ensureColumn('challenges', 'userId', 'TEXT');
ensureColumn('people', 'userId', 'TEXT');

// Create indexes on userId after ensuring columns exist
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tasks_userId      ON tasks(userId);
  CREATE INDEX IF NOT EXISTS idx_challenges_userId ON challenges(userId);
  CREATE INDEX IF NOT EXISTS idx_people_userId     ON people(userId);
`);

// ─── Prepared Statements ──────────────────────────────────────────────────────

const stmt = {
  // Users & Sessions -----------------------------------------------------------
  insertUser: db.prepare(`
    INSERT INTO users (id, email, passwordHash, passwordSalt, name, createdAt)
    VALUES (@id, @email, @passwordHash, @passwordSalt, @name, @createdAt)
  `),
  getUserByEmail: db.prepare(`
    SELECT id, email, name, createdAt FROM users WHERE email = ?
  `),
  getUserWithPasswordByEmail: db.prepare(`
    SELECT id, email, name, passwordHash, passwordSalt, createdAt FROM users WHERE email = ?
  `),
  getUserById: db.prepare(`
    SELECT id, email, name, createdAt FROM users WHERE id = ?
  `),
  insertSession: db.prepare(`
    INSERT INTO sessions (token, userId, expiresAt, createdAt)
    VALUES (@token, @userId, @expiresAt, @createdAt)
  `),
  getUserBySession: db.prepare(`
    SELECT u.id, u.email, u.name, u.createdAt
    FROM sessions s
    JOIN users u ON s.userId = u.id
    WHERE s.token = ? AND s.expiresAt > ?
  `),
  deleteSession: db.prepare(`
    DELETE FROM sessions WHERE token = ?
  `),
  deleteExpiredSessions: db.prepare(`
    DELETE FROM sessions WHERE expiresAt <= ?
  `),

  // Orphan Adoption (transfers unassigned pre-existing data to first registered user)
  countUsers: db.prepare('SELECT COUNT(*) as count FROM users'),
  claimOrphanedTasks: db.prepare("UPDATE tasks SET userId = ? WHERE userId IS NULL OR userId = ''"),
  claimOrphanedChallenges: db.prepare("UPDATE challenges SET userId = ? WHERE userId IS NULL OR userId = ''"),
  claimOrphanedPeople: db.prepare("UPDATE people SET userId = ? WHERE userId IS NULL OR userId = ''"),

  // Tasks -----------------------------------------------------------------------
  tasksByUser: db.prepare('SELECT * FROM tasks WHERE userId = ? ORDER BY createdAt DESC'),
  tagsByTask: db.prepare('SELECT tag FROM task_tags WHERE taskId = ?'),
  getTaskOwner: db.prepare('SELECT userId FROM tasks WHERE id = ?'),
  upsertTask: db.prepare(`
    INSERT INTO tasks
      (id, userId, title, description, dueDate, priority, status, category,
       urgent, important, assignedTo, challengeId, estimatedMinutes, completedAt, createdAt)
    VALUES
      (@id, @userId, @title, @description, @dueDate, @priority, @status, @category,
       @urgent, @important, @assignedTo, @challengeId, @estimatedMinutes, @completedAt, @createdAt)
    ON CONFLICT(id) DO UPDATE SET
      title            = excluded.title,
      description      = excluded.description,
      dueDate          = excluded.dueDate,
      priority         = excluded.priority,
      status           = excluded.status,
      category         = excluded.category,
      urgent           = excluded.urgent,
      important        = excluded.important,
      assignedTo       = excluded.assignedTo,
      challengeId      = excluded.challengeId,
      estimatedMinutes = excluded.estimatedMinutes,
      completedAt      = excluded.completedAt
  `),
  deleteTaskTags: db.prepare('DELETE FROM task_tags WHERE taskId = ?'),
  insertTag: db.prepare('INSERT OR IGNORE INTO task_tags (taskId, tag) VALUES (?, ?)'),
  deleteTask: db.prepare('DELETE FROM tasks WHERE id = ? AND userId = ?'),
  clearUserTaskTags: db.prepare(`
    DELETE FROM task_tags WHERE taskId IN (SELECT id FROM tasks WHERE userId = ?)
  `),
  clearUserTasks: db.prepare('DELETE FROM tasks WHERE userId = ?'),

  // Challenges ------------------------------------------------------------------
  challengesByUser: db.prepare('SELECT * FROM challenges WHERE userId = ? ORDER BY createdAt DESC'),
  datesByChallenge: db.prepare('SELECT dateStr FROM challenge_completed_dates WHERE challengeId = ?'),
  milestonesByChallenge: db.prepare('SELECT * FROM challenge_milestones WHERE challengeId = ? ORDER BY sortOrder'),
  getChallengeOwner: db.prepare('SELECT userId FROM challenges WHERE id = ?'),
  upsertChallenge: db.prepare(`
    INSERT INTO challenges
      (id, userId, title, description, category, targetMonth, goalType,
       targetDays, targetCount, currentCount, unit, status, accentColor, createdAt)
    VALUES
      (@id, @userId, @title, @description, @category, @targetMonth, @goalType,
       @targetDays, @targetCount, @currentCount, @unit, @status, @accentColor, @createdAt)
    ON CONFLICT(id) DO UPDATE SET
      title        = excluded.title,
      description  = excluded.description,
      category     = excluded.category,
      targetMonth  = excluded.targetMonth,
      goalType     = excluded.goalType,
      targetDays   = excluded.targetDays,
      targetCount  = excluded.targetCount,
      currentCount = excluded.currentCount,
      unit         = excluded.unit,
      status       = excluded.status,
      accentColor  = excluded.accentColor
  `),
  deleteDates: db.prepare('DELETE FROM challenge_completed_dates WHERE challengeId = ?'),
  insertDate: db.prepare('INSERT OR IGNORE INTO challenge_completed_dates (challengeId, dateStr) VALUES (?, ?)'),
  deleteMilestones: db.prepare('DELETE FROM challenge_milestones WHERE challengeId = ?'),
  insertMilestone: db.prepare('INSERT INTO challenge_milestones (id, challengeId, title, completed, sortOrder) VALUES (?, ?, ?, ?, ?)'),
  deleteChallenge: db.prepare('DELETE FROM challenges WHERE id = ? AND userId = ?'),
  clearUserDates: db.prepare(`
    DELETE FROM challenge_completed_dates WHERE challengeId IN (SELECT id FROM challenges WHERE userId = ?)
  `),
  clearUserMilestones: db.prepare(`
    DELETE FROM challenge_milestones WHERE challengeId IN (SELECT id FROM challenges WHERE userId = ?)
  `),
  clearUserChallenges: db.prepare('DELETE FROM challenges WHERE userId = ?'),

  // People ----------------------------------------------------------------------
  peopleByUser: db.prepare('SELECT * FROM people WHERE userId = ? ORDER BY createdAt ASC'),
  getPersonOwner: db.prepare('SELECT userId FROM people WHERE id = ?'),
  upsertPerson: db.prepare(`
    INSERT INTO people (id, userId, name, type, role, avatarColor, contactInfo, notes, createdAt)
    VALUES (@id, @userId, @name, @type, @role, @avatarColor, @contactInfo, @notes, @createdAt)
    ON CONFLICT(id) DO UPDATE SET
      name        = excluded.name,
      type        = excluded.type,
      role        = excluded.role,
      avatarColor = excluded.avatarColor,
      contactInfo = excluded.contactInfo,
      notes       = excluded.notes
  `),
  deletePerson: db.prepare('DELETE FROM people WHERE id = ? AND userId = ?'),
  clearUserPeople: db.prepare('DELETE FROM people WHERE userId = ?'),

  // Meta ------------------------------------------------------------------------
  getMeta: db.prepare('SELECT value FROM meta WHERE key = ?'),
  setMeta: db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)'),
};

// ─── Startup Maintenance ──────────────────────────────────────────────────────

// Purge expired sessions on every cold start to keep the sessions table lean.
try {
  stmt.deleteExpiredSessions.run(new Date().toISOString());
} catch { /* non-critical — ignore */ }

// ─── Authentication & Crypto ──────────────────────────────────────────────────

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const calculated = crypto.scryptSync(password, salt, 64);
    const stored = Buffer.from(hash, 'hex');
    if (calculated.length !== stored.length) return false;
    return crypto.timingSafeEqual(calculated, stored);
  } catch {
    return false;
  }
}

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  stmt.insertSession.run({
    token,
    userId,
    expiresAt,
    createdAt: now.toISOString(),
  });
  return token;
}

export function registerUser(email: string, password: string, name: string): { user: DbUser; token: string } {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Correo electrónico inválido.');
  }
  if (!password || password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  const existing = stmt.getUserByEmail.get(normalizedEmail);
  if (existing) {
    throw new Error('El correo electrónico ya está registrado.');
  }

  const userCount = (stmt.countUsers.get() as { count: number }).count;
  const isFirstUser = userCount === 0;

  const { hash, salt } = hashPassword(password);
  const userId = `u-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const now = new Date().toISOString();
  const displayName = name.trim() || normalizedEmail.split('@')[0];

  stmt.insertUser.run({
    id: userId,
    email: normalizedEmail,
    passwordHash: hash,
    passwordSalt: salt,
    name: displayName,
    createdAt: now,
  });

  // If this is the first registered user, transfer any legacy unassigned records to them
  if (isFirstUser) {
    try {
      stmt.claimOrphanedTasks.run(userId);
      stmt.claimOrphanedChallenges.run(userId);
      stmt.claimOrphanedPeople.run(userId);
    } catch {
      // ignore
    }
  }

  const token = createSession(userId);
  return {
    user: { id: userId, email: normalizedEmail, name: displayName, createdAt: now },
    token,
  };
}

export function loginUser(email: string, password: string): { user: DbUser; token: string } | null {
  const normalizedEmail = email.trim().toLowerCase();
  const row = stmt.getUserWithPasswordByEmail.get(normalizedEmail) as {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    passwordSalt: string;
    createdAt: string;
  } | undefined;

  if (!row) return null;
  if (!verifyPassword(password, row.passwordHash, row.passwordSalt)) return null;

  const token = createSession(row.id);
  return {
    user: { id: row.id, email: row.email, name: row.name, createdAt: row.createdAt },
    token,
  };
}

export function getUserBySession(token: string): DbUser | null {
  const now = new Date().toISOString();
  const row = stmt.getUserBySession.get(token, now) as DbUser | undefined;
  return row || null;
}

export function deleteSession(token: string): void {
  stmt.deleteSession.run(token);
}

// ─── User-Scoped Tasks ────────────────────────────────────────────────────────

export function getTasks(userId: string): DbTask[] {
  const rows = stmt.tasksByUser.all(userId) as Record<string, unknown>[];
  return rows.map((row) => {
    const tagRows = stmt.tagsByTask.all(row.id as string) as { tag: string }[];
    return {
      id:               row.id as string,
      userId:           row.userId as string,
      title:            row.title as string,
      description:      row.description as string,
      dueDate:          row.dueDate as string,
      priority:         row.priority as DbTask['priority'],
      status:           row.status as DbTask['status'],
      category:         row.category as string,
      urgent:           Boolean(row.urgent),
      important:        Boolean(row.important),
      assignedTo:       (row.assignedTo as string | null) ?? null,
      challengeId:      (row.challengeId as string | null) ?? null,
      tags:             tagRows.map((t) => t.tag),
      estimatedMinutes: row.estimatedMinutes != null ? (row.estimatedMinutes as number) : undefined,
      completedAt:      (row.completedAt as string | null) ?? null,
      createdAt:        row.createdAt as string,
    };
  });
}

function _upsertTask(userId: string, task: DbTask): void {
  // Check ownership if task already exists
  const owner = stmt.getTaskOwner.get(task.id) as { userId: string } | undefined;
  if (owner && owner.userId && owner.userId !== userId) {
    throw new Error('Acceso denegado: No tienes permiso para editar esta tarea.');
  }

  stmt.upsertTask.run({
    ...task,
    userId,
    urgent:           task.urgent ? 1 : 0,
    important:        task.important ? 1 : 0,
    estimatedMinutes: task.estimatedMinutes ?? null,
    assignedTo:       task.assignedTo ?? null,
    challengeId:      task.challengeId ?? null,
    completedAt:      task.completedAt ?? null,
  });

  stmt.deleteTaskTags.run(task.id);
  for (const tag of task.tags ?? []) {
    stmt.insertTag.run(task.id, tag);
  }
}

export function upsertTask(userId: string, task: DbTask): void {
  _upsertTask(userId, task);
}

export function deleteTask(userId: string, id: string): void {
  stmt.deleteTask.run(id, userId);
}

export const replaceTasks = db.transaction((userId: string, tasks: DbTask[]) => {
  stmt.clearUserTaskTags.run(userId);
  stmt.clearUserTasks.run(userId);
  for (const task of tasks) {
    _upsertTask(userId, task);
  }
});

// ─── User-Scoped Challenges ───────────────────────────────────────────────────

export function getChallenges(userId: string): DbChallenge[] {
  const rows = stmt.challengesByUser.all(userId) as Record<string, unknown>[];
  return rows.map((row) => {
    const completedDates = (stmt.datesByChallenge.all(row.id as string) as { dateStr: string }[]).map((d) => d.dateStr);
    const milestoneRows  = stmt.milestonesByChallenge.all(row.id as string) as Record<string, unknown>[];
    const milestones: DbMilestone[] = milestoneRows.map((m) => ({
      id:        m.id as string,
      title:     m.title as string,
      completed: Boolean(m.completed),
    }));
    return {
      id:           row.id as string,
      userId:       row.userId as string,
      title:        row.title as string,
      description:  row.description as string,
      category:     row.category as string,
      targetMonth:  row.targetMonth as string,
      goalType:     row.goalType as DbChallenge['goalType'],
      status:       row.status as DbChallenge['status'],
      createdAt:    row.createdAt as string,
      accentColor:  row.accentColor != null ? (row.accentColor as string) : undefined,
      targetDays:   row.targetDays  != null ? (row.targetDays  as number) : undefined,
      targetCount:  row.targetCount != null ? (row.targetCount as number) : undefined,
      currentCount: row.currentCount!= null ? (row.currentCount as number): undefined,
      unit:         row.unit        != null ? (row.unit        as string) : undefined,
      completedDates,
      milestones,
    };
  });
}

function _upsertChallenge(userId: string, challenge: DbChallenge): void {
  const owner = stmt.getChallengeOwner.get(challenge.id) as { userId: string } | undefined;
  if (owner && owner.userId && owner.userId !== userId) {
    throw new Error('Acceso denegado: No tienes permiso para editar este reto.');
  }

  stmt.upsertChallenge.run({
    id:           challenge.id,
    userId,
    title:        challenge.title,
    description:  challenge.description,
    category:     challenge.category,
    targetMonth:  challenge.targetMonth,
    goalType:     challenge.goalType,
    status:       challenge.status,
    createdAt:    challenge.createdAt,
    accentColor:  challenge.accentColor  ?? null,
    targetDays:   challenge.targetDays   ?? null,
    targetCount:  challenge.targetCount  ?? null,
    currentCount: challenge.currentCount ?? null,
    unit:         challenge.unit         ?? null,
  });

  stmt.deleteDates.run(challenge.id);
  for (const dateStr of challenge.completedDates ?? []) {
    stmt.insertDate.run(challenge.id, dateStr);
  }

  stmt.deleteMilestones.run(challenge.id);
  for (let i = 0; i < (challenge.milestones ?? []).length; i++) {
    const m = challenge.milestones![i];
    stmt.insertMilestone.run(m.id, challenge.id, m.title, m.completed ? 1 : 0, i);
  }
}

export function upsertChallenge(userId: string, challenge: DbChallenge): void {
  _upsertChallenge(userId, challenge);
}

export function deleteChallenge(userId: string, id: string): void {
  stmt.deleteChallenge.run(id, userId);
}

export const replaceChallenges = db.transaction((userId: string, challenges: DbChallenge[]) => {
  stmt.clearUserDates.run(userId);
  stmt.clearUserMilestones.run(userId);
  stmt.clearUserChallenges.run(userId);
  for (const challenge of challenges) {
    _upsertChallenge(userId, challenge);
  }
});

// ─── User-Scoped People ───────────────────────────────────────────────────────

export function getPeople(userId: string): DbPerson[] {
  return (stmt.peopleByUser.all(userId) as Record<string, unknown>[]).map((row) => ({
    id:          row.id          as string,
    userId:      row.userId      as string,
    name:        row.name        as string,
    type:        row.type        as DbPerson['type'],
    role:        row.role        as string,
    avatarColor: row.avatarColor as string,
    createdAt:   row.createdAt   as string,
    contactInfo: row.contactInfo != null ? (row.contactInfo as string) : undefined,
    notes:       row.notes       != null ? (row.notes       as string) : undefined,
  }));
}

function _upsertPerson(userId: string, person: DbPerson): void {
  const owner = stmt.getPersonOwner.get(person.id) as { userId: string } | undefined;
  if (owner && owner.userId && owner.userId !== userId) {
    throw new Error('Acceso denegado: No tienes permiso para editar este colaborador.');
  }

  stmt.upsertPerson.run({
    ...person,
    userId,
    contactInfo: person.contactInfo ?? null,
    notes:       person.notes       ?? null,
  });
}

export function upsertPerson(userId: string, person: DbPerson): void {
  _upsertPerson(userId, person);
}

export function deletePerson(userId: string, id: string): void {
  stmt.deletePerson.run(id, userId);
}

export const replacePeople = db.transaction((userId: string, people: DbPerson[]) => {
  stmt.clearUserPeople.run(userId);
  for (const person of people) {
    _upsertPerson(userId, person);
  }
});

// ─── Meta ─────────────────────────────────────────────────────────────────────

export function getMeta(key: string): string | null {
  const row = stmt.getMeta.get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setMeta(key: string, value: string): void {
  stmt.setMeta.run(key, value);
}

// ─── Legacy JSON Migration ───────────────────────────────────────────────────

export function migrateFromJson(): void {
  if (!fs.existsSync(LEGACY_JSON_PATH)) return;
  if (getMeta('json_migrated') === 'true') return;

  try {
    const raw  = fs.readFileSync(LEGACY_JSON_PATH, 'utf-8');
    const data = JSON.parse(raw) as KaironPayload;

    const tasks      = Array.isArray(data.tasks)      ? data.tasks      : [];
    const challenges = Array.isArray(data.challenges)  ? data.challenges : [];
    const people     = Array.isArray(data.people)      ? data.people     : [];

    if (tasks.length + challenges.length + people.length > 0) {
      // Legacy records start with unassigned userId; will be claimed when first user registers
      for (const t of tasks) {
        _upsertTask('', t);
      }
      for (const c of challenges) {
        _upsertChallenge('', c);
      }
      for (const p of people) {
        _upsertPerson('', p);
      }
      console.log(
        `[Kairon] ✔ Migrated kairon_db.json → kairon.db: ` +
        `${tasks.length} tasks · ${challenges.length} challenges · ${people.length} people`
      );
    }
    setMeta('json_migrated',    'true');
    setMeta('json_migrated_at', new Date().toISOString());
  } catch (err) {
    console.error('[Kairon] Migration from kairon_db.json failed:', err);
  }
}

migrateFromJson();
