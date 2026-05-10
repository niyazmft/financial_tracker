# FinTrack Agent Guide

Repo-specific guidance for OpenCode sessions. When in doubt, trust executable config over this doc.

## Package Manager & Install

- **Use pnpm only** (v10.32.1). Never npm/yarn.
- `pnpm install` from root.
- Lockfile: `pnpm-lock.yaml`. Use `--frozen-lockfile` in CI.

## Repo Structure

Single-package monorepo layout:

```text
backend/          # Express API
  server.js     # Entry point
  app.js        # Express middleware/routes setup
  routes/       # API route definitions
  controllers/  # camelCase.js (request handlers)
  services/     # Business logic layer (REQUIRED for complex ops)
  scripts/      # NocoDB setup, seed, check utils
frontend/       # Vue 3 SPA
  src/
    views/      # PascalCaseView.vue (page components)
    components/ # PascalCase.vue (reusable UI)
    services/   # API abstractions ONLY
      api.js         # Low-level API defs
      apiInstance.js # State-aware instance (useApi)
    stores/     # Pinia stores (camelCase.js)
    composables/# Vue logic (camelCase.js, useXxx)
    router/     # Vue Router config
infrastructure/
  docker/       # Postgres + NocoDB containers
  ecosystem.config.js  # PM2 production config
dist/           # Vite build output (gitignored)
```

## Stack & Toolchain

- **Frontend**: Vue 3 (Composition API, `<script setup>`), Vite, PrimeVue 4, Pinia, Tailwind CSS 4, Chart.js
- **Backend**: Node.js, Express, Winston logging
- **Database**: NocoDB (REST API over Postgres) - NOT a traditional ORM
- **Auth**: Firebase Admin SDK (backend), Firebase Client SDK (frontend)
- **Test**: Mocha + Sinon (backend), Vitest + Vue Test Utils (frontend)
- **Lint**: ESLint (JS/Vue/JSON), Stylelint (CSS), Markdownlint
- **Deep Clean**: Knip (unused exports/files), Depcheck (unused dependencies)
- **Hooks**: Husky pre-commit runs `lint-staged`

## Critical Commands

```bash
# Dev (requires Docker infrastructure running)
pnpm run dev                    # Backend with nodemon
pnpm vite                       # Frontend dev server (port 5173)

# Testing
pnpm test                       # Backend (Mocha)
pnpm run test:ui                # Frontend (Vitest)

# Build & Quality
pnpm run build                  # Vite build (outputs to dist/)
pnpm run lint:all               # All linters (JS/Vue/CSS/MD/JSON)
pnpm exec eslint '**/*.{js,mjs,vue}' --fix      # Auto-fix JS
pnpm exec stylelint 'frontend/src/**/*.css' --fix  # Auto-fix CSS
pnpm run lint:unused            # Find unused exports/files (Knip)
pnpm run lint:deps              # Find unused dependencies (depcheck)
pnpm run analyze                # Run both Knip + depcheck

# Database (requires Docker running)
cd infrastructure/docker && docker-compose up -d  # Start Postgres+NocoDB
pnpm run db:setup               # Create tables in NocoDB
pnpm run db:seed -- <USER_ID>   # Seed dummy data
pnpm run db:check -- <USER_ID>  # Diagnostic check

# Production
pnpm run pm2:start              # Start with PM2
pnpm run pm2:logs               # View logs
```

## Mandatory Code Conventions

- **Backend files**: `camelCase.js`
- **Vue components**: `PascalCase.vue`, directories `PascalCase/`
- **Views**: Suffix `View` (e.g., `DashboardView.vue`)
- **Composables**: Prefix `use` (e.g., `useFinance.js`)
- **Global constants**: `SCREAMING_SNAKE_CASE`
- **Functions**: Arrow functions (`=>`) preferred
- **Async**: `async/await` ONLY. Never `.then()` chaining
- **Vue**: `<script setup>` syntax mandatory for new components
- **Semicolons**: Omit where possible (follow existing file pattern)
- **Vars**: `const` > `let`, never `var`

## Architecture Rules

1. **Service Layer REQUIRED**: Complex logic goes in `backend/services/`, not controllers. Controllers handle HTTP only.
2. **No Direct API Calls**: Frontend MUST use `frontend/src/services/api.js` abstractions. Never `fetch` or `axios` directly.
3. **Request Cancellation**: Use `AbortController` for cancellable requests (rapid UI interactions like filters/search). Pass `controller.signal` via api.js.
4. **Error Handling**: Wrap backend controllers in `catchAsync` utility. Use `AppError` class for operational errors.
5. **NocoDB Pattern**: All DB access via `backend/services/nocodbService.js` (low-level adapter). Domain services import it.
6. **Auth**: Use `authMiddleware.authenticateToken` in route definitions. Never manual token verification in controllers.

## Environment & Secrets

- Copy `.env.example` → `.env` and fill values
- **Required**: Firebase service account JSON at root (e.g., `service-account.json`)
- **Required**: NocoDB token + table IDs after `db:setup`
- **NEVER commit**: `.env`, service account JSON, API keys
- Firebase project association: `firebase use --add`

## Testing & Verification Protocol

After ANY code change, run:

```bash
pnpm test                       # Backend tests (Mocha)
pnpm run test:ui                # Frontend tests (Vitest)
pnpm run lint:all               # All linters
```

If frontend modified, also verify:

```bash
pnpm run build                  # Must exit 0
```

**Auto-fix before manual fixes**: Always run `eslint --fix` and `stylelint --fix` before addressing lint errors manually.

### Backend Health Check (if backend modified)

Run `pm2 logs --nostream`. Success: no "Error", "failed", "crashed", or "unhandledRejection" in output.

**Failure protocol**: Fix, retry up to 3 times total. After 3 failures, **revert all changes** and report.

## TDD Workflow (Mandatory for New Features)

1. **Red**: Write failing test defining desired behavior
2. **Green**: Write minimum code to make test pass
3. **Refactor**: Improve code while keeping tests green

**Backend tests**: Mocha + Sinon in `backend/tests/`. Use Node.js `assert`.
**Frontend tests**: Vitest + Vue Test Utils.

**Test Setup**: Global mocks in `frontend/tests/setup.js`:

- `localStorage` - Required because `settings.js` store accesses it on import
- `matchMedia` - Required for theme detection tests

New backend features in `controllers/` or `services/` MUST have corresponding tests.

## Key File Locations

- API base: `frontend/src/services/api.js`
- NocoDB adapter: `backend/services/nocodbService.js`
- Auth middleware: `backend/middleware/authMiddleware.js`
- Error classes: `backend/utils/error.js`
- Logger config: `backend/config/logger.js`
- Env config: `backend/config/env.js`
- Frontend entry: `frontend/src/main.js`
- Router: `frontend/src/router/index.js`

## CI/CD Constraints (from `.github/workflows/ci.yml`)

- Node versions: 20.x, 22.x
- Uses `pnpm install --frozen-lockfile`
- Required env vars mocked in CI (Firebase, NocoDB table IDs)
- Pipeline order: install → lint:all → test → test:ui → build

## Common Gotchas

1. **Vite root is `frontend/`** - paths in vite.config.mjs are relative to this
2. **Build output goes to `dist/`** at root, not frontend/dist
3. **NocoDB runs in Docker on 8080** - must be healthy before app starts
4. **Lint-staged runs on pre-commit** - but don't rely on it; lint before committing
5. **Financial calculations**: Use net sum (pos + neg), not absolute values. Use `installment-calculator.js` for precision.
6. **AbortController**: Required for rapid-fire requests (filters, search) to prevent race conditions.
