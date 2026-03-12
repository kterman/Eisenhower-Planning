# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server on http://localhost:3000
npm run build     # Production build
npm run preview   # Preview production build
```

There are no test or lint scripts configured. Type checking is done via the IDE using `tsconfig.json` (strict mode, `noEmit: true`).

## Architecture

Single-page React 19 + TypeScript app built with Vite. Fully client-side — no backend, no external API calls. Styling is Tailwind CSS loaded from CDN (not installed as a package), along with Google Fonts loaded in `index.html`.

**Dependency loading is unconventional:** React, ReactDOM, and Lucide are loaded via an import map in `index.html` (ESM CDN), not bundled from `node_modules`. This means `node_modules` only contains the TypeScript types for those packages.

### Data flow

```
localStorage (eisenhower_app_users)
    ↕ services/storage.ts
App.tsx  (all state lives here)
    ├── Auth.tsx          (shown when no currentUser)
    ├── Header.tsx        (export/import/logout)
    └── PostIt.tsx        (one per task, drag+drop+edit)
```

- All task state is managed in `App.tsx` via `useState`; child components receive callbacks as props.
- `services/storage.ts` reads/writes the entire user map to `localStorage` under key `eisenhower_current_user` / `eisenhower_app_users`.
- The Eisenhower quadrants (`DO`, `DECIDE`, `DELEGATE`, `DELETE`) are defined in `constants.ts` with their colors and labels.

### Key types (`types.ts`)

```typescript
type QuadrantType = 'DO' | 'DECIDE' | 'DELEGATE' | 'DELETE';

interface Task {
  id: string;           // 9-char random ID
  subject: string;
  quadrant: QuadrantType;
  createdAt: number;
}
```

### Path alias

`@/*` resolves to the project root (configured in both `vite.config.ts` and `tsconfig.json`).
