# 🤖 AI Agent Operational Guide (AGENTS.md)

This document establishes the architecture, coding standards, development workflows, and operational boundaries that **every AI agent or automated coding assistant** must strictly adhere to when interacting with the **Kairon** repository.

---

## 🧭 Project Vision & Core Principles

**Kairon** is a personal productivity and time-management platform inspired by the ancient Greek concept of *Kairós* (the opportune, qualitative moment for action). The system is engineered to be:
1. **Ultra-Fast & Frictionless**: Offline-first architecture with instant optimistic UI updates and zero artificial latency.
2. **Visually Cohesive**: Sleek *Dark Modern* interface featuring subtle micro-interactions and semantic color coding across quadrants, priorities, and workflow states.
3. **Resilient & Portable**: Dual-layer hybrid persistence (`localStorage` + background sync with SQLite `data/kairon.db`).

---

## 🧱 System Architecture

### 1. Domain Models (`src/types/index.ts`)
All schema modifications or extensions to core entities must originate in `src/types/index.ts`:
* **`User`**: Authenticated user account (`id`, `email`, `name`, `createdAt`).
* **`Task`**: Granular task entity including due date (`dueDate`), priority (`low`, `medium`, `high`, `urgent`), workflow status (`todo`, `in_progress`, `review`, `done`), Eisenhower flags (`urgent`, `important`), assigned collaborator (`assignedTo`), associated monthly challenge (`challengeId`), and owning user (`userId`).
* **`MonthlyChallenge`**: Goal tracking system supporting three specialized modalities (`daily_habit`, `numeric_target`, `milestones`) bound to `userId`.
* **`Person`**: Directory of collaborators, AI agents (`agent`), family members (`family`), technical services (`service`), and colleagues (`colleague`) bound to `userId`.
* **`EisenhowerQuadrant`**: Operational quadrants: `q1` (Do First), `q2` (Schedule/Plan), `q3` (Delegate), and `q4` (Eliminate/Postpone).
* **`AppView`**: Available views: `'dashboard' | 'challenges' | 'tasks' | 'eisenhower' | 'kanban' | 'people'`.

### 2. Security & User Isolation (`src/services/auth.ts`, `server/db.ts`)
* **Zero-Role User Isolation**: All users are standard users with exclusive access to their own workspace. No role hierarchies or administrative bypasses.
* **Native Crypto**: Password hashing with unique salt uses Node.js `crypto.scryptSync` and constant-time comparison `crypto.timingSafeEqual`.
* **Session Management**: Random 32-byte session tokens stored in the `sessions` table in SQLite with 30-day expiration.
* **Auth Endpoints**:
  * `POST /api/auth/register`: Register new user.
  * `POST /api/auth/login`: Authenticate and return token.
  * `GET /api/auth/me`: Validate session and return user profile.
  * `POST /api/auth/logout`: Invalidate session in SQLite.

### 3. Data Flow & Hybrid Persistence (`src/services/storage.ts` & `server/db.ts`)
* **Initial Load**: Synchronously loads from browser `localStorage` (scoped by `userId` to prevent local data leakage), followed by an authenticated query to `/api/data` to reconcile with the SQLite database (`data/kairon.db`).
* **Dual Write**: Every state mutation updates `localStorage` and sends authenticated requests (`Authorization: Bearer <token>`) to the SQLite backend (`/api/tasks`, `/api/challenges`, `/api/people` or bulk `/api/data`).
* **Referential Integrity**:
  * Deleting a `Person` must unassign associated tasks (`assignedTo: null`) rather than cascading deletion.
  * Deleting a `MonthlyChallenge` must unbind associated tasks (`challengeId: null`).

### 4. Backend Development Middleware (`vite.config.ts`)
* Vite dev server incorporates `sqlitePlugin`, which validates Bearer session tokens on all protected routes, injects the verified `userId`, and enforces strict database isolation via `server/db.ts` (`better-sqlite3` in WAL mode).

---

## 🛠️ Technology Stack & Dependencies

* **Frontend Framework**: React 19 using modern functional components and hooks.
* **Language**: TypeScript 5.8+ (Strict type checking enabled in `tsconfig.json`).
* **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`.
* **Iconography**: `lucide-react`.
* **Animations**: `motion` (Framer Motion).
* **Build System**: Vite 8+.

---

## ⚡ Development Commands

Agents must strictly use the following commands to validate and build their work:

```bash
# Start local development server (port 3000, 0.0.0.0)
npm run dev

# Strict TypeScript type check (no file emission)
npm run lint

# Compile and package production build
npm run build

# Preview production build locally
npm run preview

# Clean build artifacts
npm run clean
```

---

## 📐 Coding Standards & Best Practices

### TypeScript & Type Safety
1. **Strict Typing**: Never use `any`. Use `unknown` alongside type guards or explicit generic constraints when handling dynamic data.
2. **Component Props**: Explicitly declare interfaces for component props following the `[ComponentName]Props` naming convention.
3. **Immutability**: Treat all application state (tasks, challenges, people) as immutable (`map`, `filter`, spread operator `[...]`).

### Visual Styling & UI Palette
1. **Dark Modern Theme**:
   * Root background: `bg-neutral-950`
   * Panels & cards: `bg-neutral-900`
   * Structural borders: `border-neutral-800`
   * Text hierarchy: `text-neutral-100` (primary), `text-neutral-400` (secondary), `text-neutral-500` (muted).
   * Primary brand accents: Amber (`amber-400` / `amber-500`) for call-to-action elements, focus states, and key highlights.
2. **Eisenhower Semantic Palette**:
   * **Q1 (Urgent & Important)**: `rose-500`
   * **Q2 (Not Urgent & Important)**: `amber-500`
   * **Q3 (Urgent & Not Important)**: `sky-500`
   * **Q4 (Neither Urgent Nor Important)**: `neutral-500`
3. **Responsive Layout**:
   * The `Sidebar` component supports desktop collapse (`lg:pl-20` vs `lg:pl-64`) and transforms into a drawer overlay on mobile screens.

### State Management & Components
1. **Single Source of Truth**: Global app state (`tasks`, `challenges`, `people`, `currentView`) resides in `src/App.tsx`.
2. **Modal Decoupling**: Keep modal dialogs (`TaskModal`, `ChallengeModal`, `PersonModal`) clean and decoupled with explicit `onClose` and `onSave` callbacks.
3. **User Feedback**: Trigger `showToast` in `App.tsx` upon creating, editing, or deleting entities.

---

## 🛡️ Operational Boundaries & Safety Rules

1. **User Data Safeguard**:
   * **NEVER** wipe, truncate, or overwrite `data/kairon.db` (or legacy `data/kairon_db.json`) with mock or dummy data unless explicitly instructed by the user.
2. **Secrets & Environment Variables**:
   * **NEVER** expose API keys or sensitive credentials in source code.
   * All secret configurations must be retrieved via `.env` / `.env.local` conforming to `.gitignore`.
3. **Backward Compatibility**:
   * When introducing new properties to `Task`, `MonthlyChallenge`, or `Person`, always declare them as optional (`field?: type`) to preserve compatibility with existing user databases.
4. **Documentation & Comment Integrity**:
   * Preserve existing code comments and JSDoc annotations unless directly refactoring obsolete logic.
