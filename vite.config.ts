import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { type IncomingMessage, type ServerResponse } from 'http';
import { defineConfig, type Plugin } from 'vite';

// ─── SQLite & Auth Plugin ──────────────────────────────────────────────────────
//
// Exposes an authenticated REST API backed by SQLite:
//
//  Auth (Public / Session):
//    POST   /api/auth/register    – Register a new user { email, password, name }
//    POST   /api/auth/login       – Login { email, password }
//    GET    /api/auth/me          – Get current user (Bearer token)
//    POST   /api/auth/logout      – Invalidate session (Bearer token)
//
//  Protected (Bearer token required, scoped to authenticated user):
//    GET    /api/data             – Full user payload (tasks + challenges + people)
//    POST   /api/data             – Bulk replace user entities (import / backup)
//    GET    /api/tasks            – User tasks
//    POST   /api/tasks            – Upsert user task
//    DELETE /api/tasks/:id        – Delete user task
//    GET    /api/challenges       – User challenges
//    POST   /api/challenges       – Upsert user challenge
//    DELETE /api/challenges/:id   – Delete user challenge
//    GET    /api/people           – User people
//    POST   /api/people           – Upsert user person
//    DELETE /api/people/:id       – Delete user person

function sqlitePlugin(): Plugin {
  type DbModule = typeof import('./server/db.ts');
  let _db: DbModule | null = null;

  /** Lazy singleton loader — DB is initialised once on the first API call. */
  const getDb = async (): Promise<DbModule> => {
    if (!_db) _db = await import('./server/db.ts') as DbModule;
    return _db;
  };

  /** Accumulate the full request body as a UTF-8 string. */
  const readBody = (req: IncomingMessage): Promise<string> =>
    new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      req.on('end',  () => resolve(data));
      req.on('error', reject);
    });

  /** Respond with JSON, setting the correct status code and Content-Type. */
  const json = (res: ServerResponse, payload: unknown, status = 200): void => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
  };

  /** Extract session token from Authorization: Bearer <token> */
  const getBearerToken = (req: IncomingMessage): string | null => {
    const auth = req.headers['authorization'] || '';
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      return auth.substring(7).trim();
    }
    return null;
  };

  return {
    name: 'kairon-sqlite-auth-plugin',

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url    = req.url    ?? '';
        const method = (req.method ?? 'GET').toUpperCase();

        // Only intercept /api/* routes
        if (!url.startsWith('/api/')) {
          return next();
        }

        try {
          const db = await getDb();

          // ── Auth: POST /api/auth/register ────────────────────────────────
          if (url === '/api/auth/register' && method === 'POST') {
            try {
              const body = JSON.parse(await readBody(req));
              const { email, password, name } = body;
              const result = db.registerUser(email, password, name);
              return json(res, result, 201);
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Error al registrar usuario.';
              return json(res, { error: message }, 400);
            }
          }

          // ── Auth: POST /api/auth/login ───────────────────────────────────
          if (url === '/api/auth/login' && method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const { email, password } = body;
            const result = db.loginUser(email, password);
            if (!result) {
              return json(res, { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' }, 401);
            }
            return json(res, result);
          }

          // ── Auth: GET /api/auth/me ───────────────────────────────────────
          if (url === '/api/auth/me' && method === 'GET') {
            const token = getBearerToken(req);
            const user = token ? db.getUserBySession(token) : null;
            if (!user) {
              return json(res, { error: 'No autorizado o sesión expirada.' }, 401);
            }
            return json(res, { user });
          }

          // ── Auth: POST /api/auth/logout ──────────────────────────────────
          if (url === '/api/auth/logout' && method === 'POST') {
            const token = getBearerToken(req);
            if (token) {
              db.deleteSession(token);
            }
            return json(res, { success: true });
          }

          // ── Protected Routes Authentication Gate ─────────────────────────
          const token = getBearerToken(req);
          const currentUser = token ? db.getUserBySession(token) : null;
          if (!currentUser) {
            return json(res, { error: 'No autorizado. Inicia sesión para continuar.' }, 401);
          }
          const userId = currentUser.id;

          // ── Bulk: GET /api/data ─────────────────────────────────────────
          if (url === '/api/data' && method === 'GET') {
            return json(res, {
              version:    '1.0',
              savedAt:    new Date().toISOString(),
              tasks:      db.getTasks(userId),
              challenges: db.getChallenges(userId),
              people:     db.getPeople(userId),
            });
          }

          // ── Bulk: POST /api/data (import / backup restore) ──────────────
          if (url === '/api/data' && method === 'POST') {
            const parsed = JSON.parse(await readBody(req));
            db.replaceTasks(     userId, Array.isArray(parsed.tasks)      ? parsed.tasks      : []);
            db.replaceChallenges(userId, Array.isArray(parsed.challenges)  ? parsed.challenges : []);
            db.replacePeople(    userId, Array.isArray(parsed.people)      ? parsed.people     : []);
            return json(res, { success: true, savedAt: new Date().toISOString() });
          }

          // ── Tasks: GET /api/tasks ───────────────────────────────────────
          if (url === '/api/tasks' && method === 'GET') {
            return json(res, db.getTasks(userId));
          }

          // ── Tasks: POST /api/tasks (upsert single) ──────────────────────
          if (url === '/api/tasks' && method === 'POST') {
            const task = JSON.parse(await readBody(req));
            db.upsertTask(userId, task);
            return json(res, { success: true });
          }

          // ── Tasks: DELETE /api/tasks/:id ────────────────────────────────
          const taskDel = url.match(/^\/api\/tasks\/([^/?]+)$/);
          if (taskDel && method === 'DELETE') {
            db.deleteTask(userId, decodeURIComponent(taskDel[1]));
            return json(res, { success: true });
          }

          // ── Challenges: GET /api/challenges ─────────────────────────────
          if (url === '/api/challenges' && method === 'GET') {
            return json(res, db.getChallenges(userId));
          }

          // ── Challenges: POST /api/challenges (upsert single) ────────────
          if (url === '/api/challenges' && method === 'POST') {
            const challenge = JSON.parse(await readBody(req));
            db.upsertChallenge(userId, challenge);
            return json(res, { success: true });
          }

          // ── Challenges: DELETE /api/challenges/:id ───────────────────────
          const challengeDel = url.match(/^\/api\/challenges\/([^/?]+)$/);
          if (challengeDel && method === 'DELETE') {
            db.deleteChallenge(userId, decodeURIComponent(challengeDel[1]));
            return json(res, { success: true });
          }

          // ── People: GET /api/people ─────────────────────────────────────
          if (url === '/api/people' && method === 'GET') {
            return json(res, db.getPeople(userId));
          }

          // ── People: POST /api/people (upsert single) ────────────────────
          if (url === '/api/people' && method === 'POST') {
            const person = JSON.parse(await readBody(req));
            db.upsertPerson(userId, person);
            return json(res, { success: true });
          }

          // ── People: DELETE /api/people/:id ──────────────────────────────
          const personDel = url.match(/^\/api\/people\/([^/?]+)$/);
          if (personDel && method === 'DELETE') {
            db.deletePerson(userId, decodeURIComponent(personDel[1]));
            return json(res, { success: true });
          }
        } catch (err: unknown) {
          console.error('[Kairon SQLite Auth]', err);
          const message = err instanceof Error ? err.message : 'Error interno del servidor.';
          return json(res, { error: message }, 500);
        }

        next();
      });
    },
  };
}

// ─── Vite Config ──────────────────────────────────────────────────────────────

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), sqlitePlugin()],
    resolve: {
      alias: {
        '@': import.meta.dirname,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr:   process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
