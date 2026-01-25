# 🤖 FinTrack AI Context & Protocols

> **Note for Developers:** This file (`GEMINI.md`) serves as the primary context source and protocol definition for AI assistants (like Gemini CLI) working on this codebase. It documents the project status, architectural decisions, and mandatory coding standards to ensure AI-generated code remains consistent with the project's design.

---

# Gemini Agent Protocol for FinTrack

This document provides essential instructions for an autonomous AI agent operating on the FinTrack codebase. Adherence to this protocol is mandatory to ensure code quality, stability, and alignment with project standards.

## 1. Core Principles & Guardrails

### Coding Conventions

To maintain consistency and readability across the FinTrack codebase, please adhere to the following coding conventions:

### File Naming

-   **Backend Controllers:** Use `camelCase.js` (e.g., `budgetController.js`).
-   **Frontend Services:** Use `camelCase.js` (e.g., `api.js`, `utils.js`).
-   **Frontend Components:** Use `PascalCase` for directories (e.g., `AnomalyAlerts`) and `PascalCase` for files (e.g., `AnomalyAlerts.vue`).
-   **Vue Stores:** Use `camelCase.js` (e.g., `auth.js`, `settings.js`) in `frontend/src/stores/`.
-   **Vue Composables:** Use `camelCase.js` prefixed with `use` (e.g., `useFinance.js`) in `frontend/src/composables/`.
-   **Vue Views:** Use `PascalCase` suffixed with `View` (e.g., `DashboardView.vue`).

### Naming Conventions

-   **Variables and Functions:** Use `camelCase` (e.g., `myVariable`, `myFunction`).
-   **Global Constants (e.g., environment variables):** Use `SCREAMING_SNAKE_CASE` (e.g., `BANK_STATEMENTS_TABLE_ID`).

### JavaScript Syntax

-   **Semicolons:** Omit semicolons at the end of statements where possible (standard JS style), but follow existing file patterns.
-   **Variable Declaration:**
    -   Prefer `const` for variables that are not reassigned.
    -   Use `let` only for variables that need to be reassigned.
    -   Avoid `var`.
-   **Functions:** Prefer arrow functions (`=>`) for conciseness and lexical `this` binding.
-   **Vue Components:** Use `<script setup>` syntax for all new Vue components.

### Asynchronous Operations

-   **Promises:** Strictly use `async/await` for handling asynchronous operations. Avoid `.then()` chaining.

### Request Cancellation

-   **Purpose:** Utilize `AbortController` to manage and cancel ongoing API requests, especially in scenarios involving rapid UI interaction (e.g., quick filter changes, tab switching, search typing). This prevents race conditions, reduces unnecessary network traffic, and improves perceived UI responsiveness.
-   **Implementation:** Always create a new `AbortController` instance before initiating a cancellable fetch. Pass `controller.signal` to the `fetch` call (via the `api.js` module). Before making a new request for the same data stream, abort any pending requests by calling `controller.abort()`. Handle `AbortError` gracefully in catch blocks.

These are the foundational rules that govern all agent actions.

### ✅ ALWAYS DO:
- **Analyze First:** Before writing code, use your **available file search or codebase analysis tools** to map the surrounding architecture. Do not guess file paths.
- **Verify Changes:** After every code modification, run all mandatory verification checks defined in **Section 3**.
- **Follow Existing Patterns:** Mimic the style, structure, and patterns of the existing code. New code should be indistinguishable from the old.
- **Isolate Dependencies:** Ensure frontend and backend code remain logically separated.
- **Use Provided API Abstractions:** All frontend API calls **MUST** use the functions provided in `frontend/src/services/api.js`.

### ❌ NEVER DO:
- **NO New Dependencies:** Never add or update any npm package in `package.json` without explicit user permission.
- **NO Force Commands:** Never use `--force` flags (e.g., `npm install --force`, `git push --force`).
- **NO Direct API Calls:** Never use `fetch` or `axios` directly in page-specific JavaScript. Use the `api.js` module.
- **NO Secret Commits:** Never commit API keys, secrets, or any sensitive data. The `.gitignore` file must be respected.
- **NO Automated Testing Commands (Unless Instructed):** You may run `npm test` to execute backend tests using Mocha. Do not use Jest unless explicitly configured.

## 2. Development & Build Commands

-   **Install Dependencies:** `npm install`
-   **Start Backend Dev:** `npm run dev` (runs `nodemon backend/server.js`)
-   **Start Frontend Dev:** `npx vite`
-   **Run Full Build:** `npm run build`

## 3. Mandatory Agent Development Protocol

This protocol **MUST** be followed for every task involving code modification.

### Step 1: Pre-Change Analysis
1.  **State Your Plan:** Before making changes, articulate a clear plan.
2.  **Analyze Codebase:** Use `codebase_investigator` or search tools to map the surrounding architecture.

### Step 2: Code Modification
1.  **Backend Logic:** Wrap all new controller functions in the `catchAsync` utility. Use the `AppError` class for all operational, user-facing errors.
2.  **Frontend Logic:**
    -   **State:** Use Pinia stores (`frontend/src/stores/`) for global state.
    -   **API:** Import `useApi` from `frontend/src/services/apiInstance.js`.
    -   **UI:** Use PrimeVue components and services (Toast, ConfirmDialog).

### Step 3: Post-Change Verification

After **ANY** code change, perform these checks. **If any check fails, you must stop, revert, and report.**

1.  **Backend Health Check (If backend was modified):**
    - **Action:** Run `pm2 logs --nostream`.
    - **Success Criteria:** The command completes with exit code 0, and the log output **DOES NOT** contain the strings "Error", "failed", "crashed", or "unhandledRejection".
    - **Failure Action:**
        1. Read the error log.
        2. Attempt to fix the specific error and rerun the verification.
        3. If it fails again, you may repeat step 2 **two more times** (for a total of three attempts).
        4. If the check still fails after three total attempts, **revert all file changes** to their original state and report the final error.

2.  **Frontend Build Verification (If frontend was modified):**
    - **Action:** Run `npm run build`.
    - **Success Criteria:** The command exits with code 0.
    - **Failure Action:**
        1. Read the error log.
        2. Attempt to fix the specific error and rerun the verification.
        3. If it fails again, you may repeat step 2 **two more times** (for a total of three attempts).
        4. If the check still fails after three total attempts, **revert all file changes** to their original state and report the final error.

### Step 4: Adding New Tests (Backend Only)

1.  **Requirement:** New backend features in `controllers` or `services` must have a corresponding test.
2.  **Location:** `backend/tests/`.
3.  **Tool:** Node.js built-in `assert` or Mocha.
4.  **Execution:** Run `npm test` to verify all backend tests pass.

## 4. Architecture & File Organization

### Frontend (`/frontend/src/`)
-   **Views (`views/`):** Top-level page components (e.g., `DashboardView.vue`).
-   **Components (`components/`):** Reusable UI components.
-   **Services (`services/`):**
    -   `api.js`: Low-level API definitions.
    -   `apiInstance.js`: State-aware API instance (uses Auth store).
    -   `utils.js`: Helper functions.
-   **Stores (`stores/`):** Pinia stores (Auth, Finance, Settings, UI).
-   **Router (`router/`):** Vue Router configuration (`index.js`).
-   **Composables (`composables/`):** Reusable Vue logic (e.g., `useFinance.js`).

### Frontend Tech Stack
-   **Framework:** Vue 3 (Composition API, `<script setup>`)
-   **Build Tool:** Vite
-   **UI Library:** PrimeVue 4 (Styled Mode - Aura Theme)
-   **State Management:** Pinia
-   **CSS:** Tailwind CSS 4 + PrimeVue Styles
-   **HTTP Client:** Axios
-   **Charting:** Chart.js

### Backend Tech Stack
-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Database Integration:** NocoDB (via REST API)
-   **Authentication:** Firebase (Admin SDK)
-   **Logging:** Winston (Structured logging with daily rotation)
-   **Templating:** Handlebars (for emails)
-   **Testing:** Mocha + Sinon

### Infrastructure (`/infrastructure/`)
-   **Docker (`infrastructure/docker/`):** Contains `docker-compose.yml` and `Dockerfile` for NocoDB and Postgres.
-   **PM2 (`infrastructure/ecosystem.config.js`):** Process management configuration for production deployment.

### Backend (`/backend/`)
-   **Entrypoint:** `backend/server.js` starts the app.
-   **App Config:** `backend/app.js` contains Express middleware and route setup.
-   **Routes (`backend/routes/`):** Modular API routes.
-   **Scripts (`backend/scripts/`):** Utility scripts for NocoDB setup (`setupNocodb.js`), data seeding (`seedData.js`), and diagnostics (`checkData.js`).
-   **Logging:** Logs stored in `backend/logs/`.

### Refactoring & Architecture Standards
-   **Service Layer Pattern:** Complex business logic, data transformation, and external API interactions must be placed in `backend/services/`. Controllers should strictly handle HTTP requests/responses and delegate logic to services.
-   **Centralized Authentication:** Do not manually verify tokens in controllers. Use `authMiddleware.authenticateToken` in route definitions to secure endpoints.
-   **Separation of Concerns:** Avoid "God Objects". Break down large controllers or services into smaller, focused modules.

### NocoDB Integration
-   **Core Adapter:** `backend/services/nocodbService.js` is the low-level adapter for the NocoDB API.
-   **Domain Services:** Feature-specific logic (e.g., `subscriptionService.js`, `transactionService.js`) should import `nocodbService.js` to interact with the database.
-   **Generic Endpoints:** `backend/routes/nocodbRoutes.js` and `backend/controllers/nocodbController.js` handle generic table operations.

## 5. Important Calculation Rules

-   When calculating transaction totals, **always use the net sum** (positive + negative values), not the sum of absolute values.
-   For financial calculations (e.g., installments), use the provided `installment-calculator.js` module to avoid precision errors.

## 6. Git Commit Message Guidelines

To maintain a clear and consistent commit history, all commit messages MUST adhere to the following guidelines:

-   **Type(Scope): Subject (imperative mood, max 50 chars)**
    -   **Type:** Must be one of the following:
        -   `feat`: A new feature
        -   `fix`: A bug fix
        -   `docs`: Documentation only changes
        -   `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semicolons, etc.)
        -   `refactor`: A code change that neither fixes a bug nor adds a feature
        -   `perf`: A code change that improves performance
        -   `test`: Adding missing tests or correcting existing tests
        -   `build`: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
        -   `ci`: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
        -   `chore`: Other changes that don't modify src or test files
        -   `revert`: Reverts a previous commit
    -   **Scope (Optional):** The area of the codebase affected (e.g., `frontend`, `backend`, `auth`, `ui`, `budget`, `reporting`).
    -   **Subject:** A very brief summary of the change in the imperative mood (e.g., "add", "fix", "change"). Max 50 characters.

-   **Body (Optional):**
    -   More detailed explanatory text, if necessary. Wrap at 72 characters.
    -   Explain the *what* and *why* of the change.
    -   Motivate the change and contrast it with previous behavior.

-   **Footer (Optional):**
    -   Reference issues or pull requests. (e.g., `Fixes #123`, `See also #456`).
    -   Breaking Changes section.

**Example Commit Message:**

```
feat(backend): Implement user authentication via Firebase

This commit introduces Firebase authentication for user login and registration.
Users can now securely sign up and log in using their email and password.
The authentication tokens are managed client-side and validated on the backend
for protected routes.

Refers to issue #42
```
## 7. Testing Protocol (TDD)

To ensure code quality and prevent regressions, adherence to **Test-Driven Development (TDD)** is now mandatory for all new features and significant refactoring.

### TDD Workflow (Red-Green-Refactor)
1.  **Red:** Write a failing test case that defines the desired behavior or reproduces a bug.
2.  **Green:** Write the minimum amount of code necessary to make the test pass.
3.  **Refactor:** Improve the code structure and performance while ensuring tests remain green.

### Testing Frameworks
-   **Backend:** Mocha + Sinon
-   **Frontend:** Vitest + Vue Test Utils (for component and unit tests).

### Continuous Integration (CI)
-   A GitHub Actions workflow is configured to run `npm test` (backend) and `npm run test:ui` (frontend) on every push.
-   **Rule:** You must ensure all tests pass locally before committing code.

### ❌ NEVER DO:
- NO Automated Commits: Never commit code changes unless explicitly instructed to do so by the user.
### ❌ NEVER DO:
- NO Echoing Completion Messages: Never use 'echo' to output completion messages after a task. Simply indicate completion through direct tool output or by stating the task is done.
