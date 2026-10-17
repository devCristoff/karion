# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`AGENTS.md` is the authoritative guide for coding standards, palette, and domain model. Follow it; this file covers commands and the cross-file architecture.

## Commands

```bash
npm run dev       # Vite on http://localhost:3000. The REST API only exists here (see Backend).
npm run lint      # tsc --noEmit. This is the only type/static check; there is no ESLint.
npm run build     # Production bundle into dist/. Does not run lint.
npm run preview   # Serves dist/ only. There is NO /api in preview, so auth and data won't work.
```

- There is no test runner or test suite. Don't assume `npm test` exists.
- `npm run clean` deletes `dist/` and `server.js`, but `server.js` no longer exists. It's harmless but stale.
- Gemini is optional. `.env.local` may hold `GEMINI_API_KEY`, but no source file reads it (see Gotchas).

## Backend lives inside Vite

There is no separate server process. `vite.config.ts` defines `sqlitePlugin()`, a Vite `configureServer` middleware that handles every `/api/*` route. It lazily imports `server/db.ts` (better-sqlite3, WAL mode) on the first API call.

- The route list at the top of `vite.config.ts` is the API contract. Keep it updated when you add routes.
- Auth routes are handled first. Every other route then passes through one gate: it reads the Bearer token, resolves it with `db.getUserBySession`, and passes the resulting `userId` into every DB call. Route handlers never trust a `userId` from the request body.
- `server/db.ts` runs `migrateFromJson()` and schema creation on import. Schema changes go in the `db.exec` block plus an `ensureColumn(...)` call. `CREATE TABLE IF NOT EXISTS` will not add columns to existing tables.
- The DB row types (`DbTask`, `DbChallenge`, `DbPerson`) in `server/db.ts` mirror the types in `src/types/index.ts` by hand. A field change must be made in both places, and the row mapping in `getTasks`/`getChallenges`/`getPeople` must be updated too.

## Data flow: localStorage is the UI source, the server is the copy

Read `src/services/storage.ts` together with the handlers in `src/App.tsx`.

- **Load:** `App.tsx` mounts, calls `authService.fetchCurrentUser()`, then `refreshAllData()`. `storageService.fetchFromServer()` **overwrites** the user-scoped localStorage keys with whatever `/api/data` returns.
- **Write:** Every mutation in `App.tsx` (`updateTasks`, `updateChallenges`, `updatePeople`) calls `storageService.saveTasks/saveChallenges/savePeople`. Each one writes localStorage, then POSTs the **entire** user dataset to `/api/data`. The server replaces all of that user's rows in a transaction (`replaceTasks` and the other `replace*` functions).
- The granular `saveTask`/`removeTask`/`savePerson`/etc. methods in `storage.ts` and the per-entity routes exist but **the UI does not call them**. Assume the bulk path is the live one.
- Sync is fire-and-forget. A failed POST is silently ignored, with no retry queue. On the next load, the server copy wins and overwrites local data. Offline edits can be lost. Keep this in mind before changing persistence.
- localStorage keys are `kairon_${userId}_${base}_v2`, with a plain `kairon_` prefix when no user is cached. Bump the `_v2` suffix only with a deliberate migration plan.

## Cross-entity integrity is enforced in React, not in the DB

The DB has foreign keys only from child tables to `users`/`tasks`/`challenges`. `tasks.assignedTo` and `tasks.challengeId` are plain columns with no FK.

- Deleting a person sets `assignedTo: null` on their tasks (`handleDeletePerson`). Deleting a challenge sets `challengeId: null` (`handleDeleteChallenge`). Both live in `App.tsx`.
- Any new delete path, or any server-side tool that removes people or challenges, must repeat this unlinking or tasks will hold dangling references.

## Frontend structure

- `App.tsx` is the single state owner (`tasks`, `challenges`, `people`, `currentView`, modal state). It switches on `AppView` to render one of the feature components under `src/components/`. Modals take explicit `onSave`/`onClose` props and are not wired to storage directly.
- `src/services/auth.ts` holds the token and cached user in localStorage (`kairon_auth_token_v1`, `kairon_cached_user_v1`) and attaches the `Authorization` header via `getAuthHeaders()`. Use `getAuthHeaders()` for any new authenticated call.
- A task's Eisenhower quadrant is not stored. It's derived from the `urgent`/`important` booleans on `Task`, and moving a task between quadrants just rewrites those two flags (`handleMoveTaskQuadrant` in `App.tsx`).
- User-facing strings are in Spanish (toasts, confirms, errors). Match that when adding UI text.

## Gotchas

- **Gemini is not wired up.** `@google/genai` is in `package.json` and `.env.example` documents `GEMINI_API_KEY`, but nothing in `src/` or `server/` imports or reads them. The README's AI-feature claims don't reflect the code.
- **Legacy JSON migration is dormant after first run.** `migrateFromJson()` only fires if `data/kairon_db.json` exists and `meta.json_migrated` is not set. The live store is `data/kairon.db`.
- **The first registered user adopts all orphan rows** (`userId` NULL or empty). Re-registering on a populated DB does not.
- **Dev server binds `0.0.0.0`** (`--host=0.0.0.0`), so the API endpoints are reachable from the local network while `npm run dev` is running. Auth still gates every data route.
- **Never wipe or overwrite `data/kairon.db`** (see AGENTS.md). It is gitignored, so git won't protect it.
- **The per-entity storage methods** (`saveTask`, `removeTask`, `saveChallenge`, `removeChallenge`, `savePerson`, `removePerson`) in `storage.ts` are not called by the UI — the UI always uses the bulk `saveTasks`/`saveChallenges`/`savePeople` path via the `updateTasks`/`updateChallenges`/`updatePeople` helpers in `App.tsx`. The per-entity methods are available for future per-mutation optimization but must be carefully wired (see timing note in bulk sync section above).
