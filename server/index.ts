/**
 * server/index.ts — Production HTTP server for Kairon
 *
 * Serves the compiled React frontend (dist/) and exposes the same REST API
 * that the Vite dev-server plugin (sqlitePlugin) handles in development.
 *
 * Build:   npm run build:server  →  bundles to server.js in the project root
 * Start:   npm start             →  node server.js
 *
 * Environment variables (optional — create .env in the project root):
 *   PORT=3000          HTTP port (default: 3000)
 *   GEMINI_API_KEY=…   Google Gemini key (not used yet)
 */

import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import * as db from './db.js';

const PORT     = Number(process.env.PORT ?? 3000);
const DIST_DIR = path.join(process.cwd(), 'dist');

const app = express();
app.use(express.json({ limit: '10mb' }));

// ── Auth helpers ──────────────────────────────────────────────────────────────

function getBearerToken(req: Request): string | null {
  const auth = req.headers['authorization'] ?? '';
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
}

/** Validates the Bearer token and returns the user, or sends 401 and returns null. */
function requireAuth(req: Request, res: Response): db.DbUser | null {
  const token = getBearerToken(req);
  const user  = token ? db.getUserBySession(token) : null;
  if (!user) {
    res.status(401).json({ error: 'No autorizado. Inicia sesión para continuar.' });
    return null;
  }
  return user;
}

// ── Auth (public routes) ──────────────────────────────────────────────────────

app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name } = req.body as { email: string; password: string; name: string };
    const result = db.registerUser(email, password, name);
    res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al registrar usuario.';
    res.status(400).json({ error: message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const result = db.loginUser(email, password);
  if (!result) return void res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
  res.json(result);
});

app.get('/api/auth/me', (req, res) => {
  const token = getBearerToken(req);
  const user  = token ? db.getUserBySession(token) : null;
  if (!user) return void res.status(401).json({ error: 'No autorizado o sesión expirada.' });
  res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  const token = getBearerToken(req);
  if (token) db.deleteSession(token);
  res.json({ success: true });
});

// ── Protected: bulk data ──────────────────────────────────────────────────────

app.get('/api/data', (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  res.json({
    version:    '1.0',
    savedAt:    new Date().toISOString(),
    tasks:      db.getTasks(user.id),
    challenges: db.getChallenges(user.id),
    people:     db.getPeople(user.id),
  });
});

app.post('/api/data', (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  const { tasks = [], challenges = [], people = [] } = req.body as {
    tasks?:      db.DbTask[];
    challenges?: db.DbChallenge[];
    people?:     db.DbPerson[];
  };
  db.replaceTasks(     user.id, Array.isArray(tasks)      ? tasks      : []);
  db.replaceChallenges(user.id, Array.isArray(challenges) ? challenges : []);
  db.replacePeople(    user.id, Array.isArray(people)     ? people     : []);
  res.json({ success: true, savedAt: new Date().toISOString() });
});

// ── Protected: tasks ──────────────────────────────────────────────────────────

app.get('/api/tasks', (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  res.json(db.getTasks(user.id));
});

app.post('/api/tasks', (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  db.upsertTask(user.id, req.body as db.DbTask);
  res.json({ success: true });
});

app.delete('/api/tasks/:id', (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  db.deleteTask(user.id, req.params.id);
  res.json({ success: true });
});

// ── Protected: challenges ─────────────────────────────────────────────────────

app.get('/api/challenges', (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  res.json(db.getChallenges(user.id));
});

app.post('/api/challenges', (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  db.upsertChallenge(user.id, req.body as db.DbChallenge);
  res.json({ success: true });
});

app.delete('/api/challenges/:id', (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  db.deleteChallenge(user.id, req.params.id);
  res.json({ success: true });
});

// ── Protected: people ─────────────────────────────────────────────────────────

app.get('/api/people', (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  res.json(db.getPeople(user.id));
});

app.post('/api/people', (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  db.upsertPerson(user.id, req.body as db.DbPerson);
  res.json({ success: true });
});

app.delete('/api/people/:id', (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  db.deletePerson(user.id, req.params.id);
  res.json({ success: true });
});

// ── Static SPA shell ──────────────────────────────────────────────────────────

app.use(express.static(DIST_DIR));

// Fallback: any non-API path gets index.html so client-side routing works
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Kairon] ▶  http://0.0.0.0:${PORT}`);
});
